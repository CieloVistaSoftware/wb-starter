/**
 * triage-data-wb.mjs
 * Scans all test files for data-wb references, categorizes each hit,
 * and writes a migration report to data/data-wb-triage.json
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

function walk(dir, cb) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, cb);
    else cb(p);
  }
}

function categorize(line, filePath) {
  const trimmed = line.trim();
  const lowerFile = filePath.toLowerCase();

  // 1. Comments
  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
    return { category: 'comment', action: 'leave', confidence: 'high' };
  }

  // 2. Compliance tests — intentionally testing legacy data-wb behavior
  if (lowerFile.includes('compliance') || lowerFile.includes('legacy')) {
    // Check if this is actually asserting data-wb should/shouldn't exist
    if (trimmed.includes('toHaveAttribute') || trimmed.includes('getAttribute') || trimmed.includes('hasAttribute')) {
      return { category: 'compliance-assertion', action: 'review', confidence: 'low', note: 'May intentionally test legacy attribute' };
    }
    if (trimmed.includes('data-wb')) {
      return { category: 'compliance-selector', action: 'review', confidence: 'medium', note: 'In compliance test — verify intent' };
    }
  }

  // 3. Playwright locator selectors: locator('[data-wb="xxx"]') or page.$('[data-wb=xxx]')
  const locatorMatch = trimmed.match(/locator\s*\(\s*['"`]\[data-wb[=~|^$*]*["']?\s*=?\s*["']?(\w+)?/);
  if (locatorMatch) {
    return { category: 'selector-locator', action: 'convert', confidence: 'high', extractedName: locatorMatch[1] || null };
  }

  // 4. CSS-style selectors in strings: '[data-wb="xxx"]' or `[data-wb="xxx"]`
  const cssSelectorMatch = trimmed.match(/\[data-wb[=~|^$*]*["']?=?\s*["']?(\w+)?/);
  if (cssSelectorMatch) {
    return { category: 'selector-css', action: 'convert', confidence: 'high', extractedName: cssSelectorMatch[1] || null };
  }

  // 5. setAttribute / getAttribute / hasAttribute / removeAttribute
  if (trimmed.includes('setAttribute') && trimmed.includes('data-wb')) {
    const attrMatch = trimmed.match(/setAttribute\s*\(\s*['"`]data-wb['"`]\s*,\s*['"`](\w+)['"`]/);
    return { category: 'set-attribute', action: 'convert', confidence: 'high', extractedName: attrMatch?.[1] || null };
  }
  if (trimmed.includes('getAttribute') && trimmed.includes('data-wb')) {
    return { category: 'get-attribute', action: 'convert', confidence: 'high' };
  }
  if (trimmed.includes('hasAttribute') && trimmed.includes('data-wb')) {
    return { category: 'has-attribute', action: 'convert', confidence: 'medium', note: 'Check if testing for absence or presence' };
  }
  if (trimmed.includes('removeAttribute') && trimmed.includes('data-wb')) {
    return { category: 'remove-attribute', action: 'review', confidence: 'medium', note: 'May be cleanup logic' };
  }

  // 6. toHaveAttribute assertions
  if (trimmed.includes('toHaveAttribute') && trimmed.includes('data-wb')) {
    const assertMatch = trimmed.match(/toHaveAttribute\s*\(\s*['"`]data-wb['"`]\s*,\s*['"`](\w+)['"`]/);
    return { category: 'assertion-attribute', action: 'convert', confidence: 'high', extractedName: assertMatch?.[1] || null };
  }

  // 7. String literals containing data-wb (test descriptions, expected values, etc.)
  if (trimmed.includes("'data-wb'") || trimmed.includes('"data-wb"') || trimmed.includes('`data-wb`')) {
    return { category: 'string-literal', action: 'review', confidence: 'medium', note: 'May be test description or expected value' };
  }

  // 8. HTML template strings containing data-wb
  if (trimmed.includes('data-wb=') && (trimmed.includes('<') || trimmed.includes('innerHTML') || trimmed.includes('html`'))) {
    const htmlMatch = trimmed.match(/data-wb\s*=\s*["'](\w+)["']/);
    return { category: 'html-template', action: 'convert', confidence: 'high', extractedName: htmlMatch?.[1] || null };
  }

  // 9. evaluate/evalOnSelector containing data-wb
  if (trimmed.includes('evaluate') && trimmed.includes('data-wb')) {
    return { category: 'evaluate-script', action: 'review', confidence: 'medium', note: 'In-browser script — check context' };
  }

  // 10. Fallback
  return { category: 'other', action: 'review', confidence: 'low', note: 'Uncategorized — needs manual review' };
}

// --- Main ---
const hits = [];
const testDir = 'tests';

walk(testDir, (filePath) => {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.js')) return;
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('data-wb')) {
      const rel = relative('.', filePath).replace(/\\/g, '/');
      const info = categorize(line, filePath);
      hits.push({
        file: rel,
        line: i + 1,
        text: line.trim().substring(0, 200),
        ...info
      });
    }
  });
});

// Summary stats
const summary = {
  total: hits.length,
  byCategory: {},
  byAction: {},
  byConfidence: {}
};

for (const h of hits) {
  summary.byCategory[h.category] = (summary.byCategory[h.category] || 0) + 1;
  summary.byAction[h.action] = (summary.byAction[h.action] || 0) + 1;
  summary.byConfidence[h.confidence] = (summary.byConfidence[h.confidence] || 0) + 1;
}

const report = {
  generated: new Date().toISOString(),
  summary,
  hits
};

writeFileSync('data/data-wb-triage.json', JSON.stringify(report, null, 2));

console.log(`\nTriage complete: ${hits.length} hits\n`);
console.log('By Category:');
for (const [k, v] of Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`);
}
console.log('\nBy Action:');
for (const [k, v] of Object.entries(summary.byAction).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`);
}
console.log('\nBy Confidence:');
for (const [k, v] of Object.entries(summary.byConfidence).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`);
}
console.log('\nFull report: data/data-wb-triage.json');
