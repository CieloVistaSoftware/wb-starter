/**
 * Compliance Test: No x-ready class pollution
 * -----------------------------------------------------------------------------
 * RULE: Behavior functions must NOT add 'x-ready' to elements.
 * The init system tracks processed elements internally via WeakMap.
 * x-ready is DOM pollution — it's not a styling class, not semantic,
 * and creates a false dependency in tests.
 *
 * This test scans all behavior JS source files for classList.add('x-ready')
 * and fails if any are found.
 * -----------------------------------------------------------------------------
 */
import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';

const SRC_DIR = 'src/wb-viewmodels';

function findJsFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findJsFiles(full));
    } else if (entry.name.endsWith('.js')) {
      results.push(full);
    }
  }
  return results;
}

test.describe('No x-ready pollution', () => {
  const files = findJsFiles(SRC_DIR);

  // #1092: with no behavior files the per-file tests below are never generated
  test('behavior source files were found to scan', () => {
    expect(files.length, `no .js files found under ${SRC_DIR}, so nothing was checked`).toBeGreaterThan(0);
  });

  for (const file of files) {
    test(`${path.relative(SRC_DIR, file)} - no x-ready`, () => {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      const violations = [];

      lines.forEach((line, i) => {
        if (line.includes('x-ready') && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
          violations.push({ line: i + 1, text: line.trim() });
        }
      });

      // #1092: assert unconditionally; the if() only built the report text
      const report = violations.map(v => `  Line ${v.line}: ${v.text}`).join('\n');
      expect(violations.length, `x-ready found in ${file}:\n${report}`).toBe(0);
    });
  }
});
