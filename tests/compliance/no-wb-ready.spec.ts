/**
 * Compliance Test: No wb-ready class pollution
 * -----------------------------------------------------------------------------
 * RULE: Behavior functions must NOT add 'wb-ready' to elements.
 * The init system tracks processed elements internally via WeakMap.
 * wb-ready is DOM pollution — it's not a styling class, not semantic,
 * and creates a false dependency in tests.
 *
 * This test scans all behavior JS source files for classList.add('wb-ready')
 * and fails if any are found.
 * -----------------------------------------------------------------------------
 */
import { test, expect } from '@playwright/test';
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

test.describe('No wb-ready pollution', () => {
  const files = findJsFiles(SRC_DIR);

  for (const file of files) {
    test(`${path.relative(SRC_DIR, file)} - no wb-ready`, () => {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      const violations = [];

      lines.forEach((line, i) => {
        if (line.includes('wb-ready') && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
          violations.push({ line: i + 1, text: line.trim() });
        }
      });

      if (violations.length > 0) {
        const report = violations.map(v => `  Line ${v.line}: ${v.text}`).join('\n');
        expect(violations.length, `wb-ready found in ${file}:\n${report}`).toBe(0);
      }
    });
  }
});
