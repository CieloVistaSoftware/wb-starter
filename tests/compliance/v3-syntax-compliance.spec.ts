/**
 * V3.0 SYNTAX COMPLIANCE
 * ======================
 * Validates that codebase uses v3.0 syntax standards.
 * 
 * RATIONALE: We moved away from `data-wb` because:
 * 1. The `data-` prefix is verbose and clutters HTML
 * 2. `<article>` is cleaner and more semantic
 * 3. `x-ripple` for behaviors avoids the data- prefix entirely
 * 
 * ✅ CURRENT (4.0.0+):
 *   - a semantic tag IS its behavior: <article>, <dialog>, <audio> (nativeMap)
 *   - everything else is an x-* attribute: x-ripple, x-draggable (extensionMap)
 *
 * ❌ RETIRED (4.0.0) -- John: "we don't use wb-* any more" (#1144):
 *   - <wb-*> tags, data-wb="..." and the "component" tier
 *
 * This test fails on any data-wb left in pages/, demos/ or public/.
 */

import { test, expect } from '../fixtures/offline';
import * as fs from 'fs';
import * as path from 'path';
import { isLegacySyntaxFixture } from '../utils/legacy-syntax-fixtures';

const PAGES_DIR = 'pages';
const DEMOS_DIR = 'demos';
const PUBLIC_DIR = 'public';

// Files allowed to use data-wb: only the pages that carry it on purpose,
// named by path in tests/utils/legacy-syntax-fixtures.ts (#1173). This list
// used to match by bare file name, and data-x-demo.html, migration-guide.html
// and legacy-syntax.html exist nowhere in the repo.

interface SyntaxViolation {
  file: string;
  line: number;
  content: string;
  suggestion: string;
}

function scanHtmlFile(filePath: string): SyntaxViolation[] {
  const violations: SyntaxViolation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  // Skip allowed legacy files
  if (isLegacySyntaxFixture(path.relative(process.cwd(), path.resolve(filePath)))) {
    return violations;
  }
  
  // Skip code examples (inside <pre> or <code> tags)
  let inCodeBlock = false;
  
  lines.forEach((line, index) => {
    // Track code blocks
    if (line.includes('<pre') || line.includes('<code')) {
      inCodeBlock = true;
    }
    if (line.includes('</pre>') || line.includes('</code>')) {
      inCodeBlock = false;
      return;
    }
    
    // Skip if in code block
    if (inCodeBlock) return;
    
    // Check for data-wb="component" pattern (not data-wb="behavior behavior")
    // This catches: data-wb="card", data-wb="button", etc.
    const dataWbMatch = line.match(/data-wb="(\w+)"/);
    if (dataWbMatch) {
      const value = dataWbMatch[1];
      // Single word = a retired "component" marker
      if (!value.includes(' ')) {
        violations.push({
          file: filePath,
          line: index + 1,
          content: line.trim().substring(0, 80),
          suggestion: `Use the semantic tag for ${value}, or x-${value} on a native element, instead of data-wb="${value}"`
        });
      }
    }
  });
  
  return violations;
}

function scanDirectory(dir: string): SyntaxViolation[] {
  const violations: SyntaxViolation[] = [];
  
  if (!fs.existsSync(dir)) return violations;
  
  const files = fs.readdirSync(dir, { recursive: true }) as string[];
  
  for (const file of files) {
    if (typeof file !== 'string') continue;
    if (!file.endsWith('.html')) continue;
    
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isFile()) {
      violations.push(...scanHtmlFile(filePath));
    }
  }
  
  return violations;
}

test.describe('v3.0 Syntax Compliance', () => {
  
  // #1144: these used to say "use <wb-*> tags instead", and allowed up to 200,
  // 300 and 10 data-wb usages while the migration ran. The migration is done
  // (0 left, 2026-10-02), so the ceiling is 0 -- tightened, never loosened.
  for (const [label, dir] of [['pages/', PAGES_DIR], ['demos/', DEMOS_DIR], ['public/', PUBLIC_DIR]] as const) {
    test(`${label} has no retired data-wb markers`, () => {
      const violations = scanDirectory(dir);
      const report = violations.map((v) => `  ${v.file}:${v.line} → ${v.suggestion}`).join('\n');
      expect(violations, `data-wb is retired (#1144):\n${report}`).toEqual([]);
    });
  }
});
