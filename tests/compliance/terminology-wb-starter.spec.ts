/**
 * Terminology Compliance — Only "WB-Starter" Allowed
 *
 * This test ensures that only "WB-Starter" is used as the framework name.
 * Any usage of "Web Behaviors (WB)" or "WB Framework" is forbidden.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const allowedTerm = 'WB-Starter';
const forbiddenTerms = [
  'Web Behaviors (WB)',
  'WB Framework'
];
const searchDirs = [
  'docs',
  'src',
  'pages',
  'tests',
  'data',
  'public'
];

function scanFiles(dir, results) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanFiles(fullPath, results);
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.js') || entry.name.endsWith('.ts') || entry.name.endsWith('.json') || entry.name.endsWith('.html')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const term of forbiddenTerms) {
        if (content.includes(term)) {
          results.push({ file: fullPath, term });
        }
      }
    }
  }
}

test('Only WB-Starter is allowed as framework name', () => {
  const violations = [];
  const baseDir = path.dirname(new URL(import.meta.url).pathname);
  for (const dir of searchDirs) {
    const absDir = path.resolve(baseDir, '../../', dir);
    if (fs.existsSync(absDir)) {
      scanFiles(absDir, violations);
    }
  }
  expect(violations, `Forbidden terms found:
${violations.map(v => `${v.file}: ${v.term}`).join('\n')}`).toEqual([]);
});
