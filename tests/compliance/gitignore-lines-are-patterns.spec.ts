/**
 * #1191: two lines of npm output ("> wb-starter@4.0.2 ship") were pasted into
 * .gitignore, where git reads each one as an ignore pattern. Every line that
 * is not blank and not a comment must be a pattern someone meant, never
 * captured terminal output.
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Terminal output that has no business being an ignore rule: an npm/shell
// prompt line, an npm banner, or a pasted command.
const TERMINAL_OUTPUT = [
  /^> /,                  // npm script banner / shell prompt
  /^\$ /,                 // shell prompt
  /^PS [A-Z]:\\/,         // PowerShell prompt
  /^npm (ERR!|WARN|run )/, // npm log line or a pasted command
  /@\d+\.\d+\.\d+ \w/,    // "pkg@1.2.3 script" banner
];

test('every non-comment .gitignore line is an ignore pattern, not pasted output (#1191)', () => {
  const lines = fs.readFileSync(path.join(process.cwd(), '.gitignore'), 'utf8').split(/\r?\n/);
  const bad = lines
    .map((line, i) => ({ line, n: i + 1 }))
    .filter(({ line }) => line.trim() && !line.startsWith('#'))
    .filter(({ line }) => TERMINAL_OUTPUT.some((re) => re.test(line)))
    .map(({ line, n }) => '.gitignore:' + n + ': ' + line);
  expect(bad, 'lines that are terminal output, not patterns').toEqual([]);
});
