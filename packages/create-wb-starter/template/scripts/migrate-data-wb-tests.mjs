/**
 * Migrate tests from data-wb="name" to x-{name} (v3.0 syntax)
 * 
 * Pattern categories:
 * 1. setAttribute('data-wb', 'value') → setAttribute('x-{value}', '')
 * 2. data-wb="value" in HTML template strings → x-{value}=""
 * 3. [data-wb="value"] CSS selectors → [x-{value}]
 * 4. Comments/docs → update text
 * 5. SKIP: Files that intentionally test legacy behavior
 * 6. SKIP: data-wb-* attributes (these are NOT the same as data-wb)
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const BASE = 'tests';
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Files that INTENTIONALLY test legacy data-wb behavior — DO NOT MIGRATE
const SKIP_FILES = [
  'strict-mode-runtime.spec.ts',      // Tests legacy error detection
  'v3-syntax-compliance.spec.ts',      // Tests that data-wb is flagged
  'legacy-pill.spec.ts',               // Tests legacy pill detection
  'project-integrity.spec.ts',         // Validates data-wb references
  'schema-validation.spec.ts',         // Schema compliance checks
  'verify_optout.spec.ts',             // Tests opt-out with data-wb=""
  'test-coverage-compliance.spec.ts',  // Checks test coverage patterns
  'find-pill.spec.ts',                 // Debug tool for legacy patterns
];

// Files where data-wb appears only in comments — safe to update comments
const COMMENT_ONLY_PATTERNS = [
  'base.ts',                           // Comment about mdhtml cleanup
];

function walk(dir, cb) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, cb);
    else cb(p);
  }
}

const stats = { files: 0, skipped: 0, modified: 0, changes: 0 };
const report = [];

walk(BASE, (filepath) => {
  if (!filepath.endsWith('.ts')) return;
  
  const filename = filepath.split(/[/\\]/).pop();
  const relPath = relative(BASE, filepath);
  
  // Skip files that intentionally test legacy behavior
  if (SKIP_FILES.includes(filename)) {
    stats.skipped++;
    report.push(`SKIP (intentional legacy): ${relPath}`);
    return;
  }
  
  stats.files++;
  const original = readFileSync(filepath, 'utf8');
  let content = original;
  let fileChanges = 0;
  
  // ─── Pattern 1: setAttribute('data-wb', 'value') → setAttribute('x-{value}', '') ───
  content = content.replace(
    /\.setAttribute\(\s*['"]data-wb['"]\s*,\s*['"](\w+)['"]\s*\)/g,
    (match, value) => {
      fileChanges++;
      return `.setAttribute('x-${value}', '')`;
    }
  );
  
  // ─── Pattern 2: data-wb="value" in HTML template strings ───
  // Matches: data-wb="card", data-wb="spinner", etc in template literals and strings
  content = content.replace(
    /data-wb="(\w+)"/g,
    (match, value, offset) => {
      // Check if this is inside a comment
      const lineStart = content.lastIndexOf('\n', offset) + 1;
      const lineContent = content.substring(lineStart, offset);
      if (lineContent.trimStart().startsWith('//') || lineContent.trimStart().startsWith('*')) {
        // Update comment text too for accuracy
        fileChanges++;
        return `x-${value}`;
      }
      fileChanges++;
      return `x-${value}=""`;
    }
  );
  
  // ─── Pattern 3: [data-wb="value"] CSS/querySelector selectors ───
  content = content.replace(
    /\[data-wb="(\w+)"\]/g,
    (match, value) => {
      fileChanges++;
      return `[x-${value}]`;
    }
  );
  
  // ─── Pattern 4: querySelectorAll('[data-wb]') — generic selector for any data-wb ───
  // This finds ALL elements with any data-wb. In v3.0, elements use x-* attributes.
  // Replace with a scan for [class*="wb-ready"] or similar v3.0 indicator
  content = content.replace(
    /querySelectorAll\(\s*'\[data-wb\]'\s*\)/g,
    (match) => {
      fileChanges++;
      return `querySelectorAll('.wb-ready')`;
    }
  );
  
  // ─── Pattern 5: getAttribute('data-wb') ───
  content = content.replace(
    /getAttribute\(\s*['"]data-wb['"]\s*\)/g,
    (match, offset) => {
      // This is trickier — the test is reading the value of data-wb
      // In v3.0 there's no single attribute to read. Flag for manual review.
      report.push(`  MANUAL REVIEW: ${relPath} — getAttribute('data-wb') needs case-by-case fix`);
      return match; // Don't auto-fix
    }
  );
  
  // ─── Pattern 6: toHaveAttribute('data-wb', ...) ───
  content = content.replace(
    /toHaveAttribute\(\s*['"]data-wb['"]\s*,\s*(['"].*?['"]|\/.*?\/)\s*\)/g,
    (match) => {
      report.push(`  MANUAL REVIEW: ${relPath} — toHaveAttribute('data-wb') needs case-by-case fix`);
      return match;
    }
  );
  
  // ─── Pattern 7: toHaveAttribute('data-wb') (no value) ───
  content = content.replace(
    /toHaveAttribute\(\s*['"]data-wb['"]\s*\)/g,
    (match) => {
      report.push(`  MANUAL REVIEW: ${relPath} — toHaveAttribute('data-wb') needs case-by-case fix`);
      return match;
    }
  );

  // ─── Pattern 8: el.getAttribute('data-wb') in evaluate blocks ───
  // Already covered by Pattern 5
  
  // ─── Pattern 9: `data-wb="${behavior}"` in template literals with variable ───
  content = content.replace(
    /`data-wb="\$\{(\w+)\}"`/g,
    (match, varName) => {
      fileChanges++;
      return `\`x-\${${varName}}=""\``;
    }
  );
  
  // ─── Pattern 10: `[data-wb="${variable}"]` selector with variable ───
  content = content.replace(
    /\[data-wb="\$\{(\w+)\}"\]/g,
    (match, varName) => {
      fileChanges++;
      return `[x-\${${varName}}]`;
    }
  );
  
  // ─── Pattern 11: return `[data-wb="${behavior}"]`; in functions ───
  content = content.replace(
    /return\s+`\[data-wb="\$\{(\w+)\}"\]`/g,
    (match, varName) => {
      fileChanges++;
      return `return \`[x-\${${varName}}]\``;
    }
  );
  
  // ─── Pattern 12: data-wb="value value" (space-separated behaviors) ───
  // These shouldn't exist in v3.0, but handle gracefully
  content = content.replace(
    /data-wb="(\w+)\s+(\w+)"/g,
    (match, v1, v2) => {
      fileChanges++;
      return `x-${v1}="" x-${v2}=""`;
    }
  );
  
  // ─── Pattern 13: let attrs = `data-wb="${behavior}"`; ───
  content = content.replace(
    /let\s+(\w+)\s*=\s*`data-wb="\$\{(\w+)\}"`;/g,
    (match, varName, behaviorVar) => {
      fileChanges++;
      return `let ${varName} = \`x-\${${behaviorVar}}=""\`;`;
    }
  );

  if (fileChanges > 0) {
    stats.modified++;
    stats.changes += fileChanges;
    report.push(`MODIFIED (${fileChanges} changes): ${relPath}`);
    
    if (!DRY_RUN) {
      writeFileSync(filepath, content, 'utf8');
    }
  }
});

console.log('═══════════════════════════════════════════════════');
console.log(`  data-wb → x-{name} Migration Report`);
console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (no files changed)' : 'LIVE'}`);
console.log('═══════════════════════════════════════════════════');
console.log(`  Files scanned:  ${stats.files}`);
console.log(`  Files skipped:  ${stats.skipped} (intentional legacy tests)`);
console.log(`  Files modified: ${stats.modified}`);
console.log(`  Total changes:  ${stats.changes}`);
console.log('───────────────────────────────────────────────────');
for (const line of report) {
  console.log(`  ${line}`);
}
console.log('═══════════════════════════════════════════════════');
