import { test, expect } from '@playwright/test';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * NO TRACKED FILE CARRIES MERGE CONFLICT MARKERS
 * ==============================================
 * fc4a700e committed pages/themes.html with a resolved-looking conflict still
 * in it: a `<<<<<<< HEAD` line, the stylesheet link twice, and a `>>>>>>>`
 * line, all rendered as text at the top of the Themes page. The version stamp
 * rewrote both links on every release, so every branch that touched the file
 * conflicted with main again, and nothing said why.
 *
 * Only the opening and closing marker lines are checked: a bare `=======` is
 * also a Markdown setext heading underline.
 */
const MARKER = /^(<{7} |>{7} )/m;

test('no tracked text file contains a conflict marker line', () => {
  const root = process.cwd();
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
    .split('\0')
    .filter((f) => f && !f.startsWith('node_modules/') && /\.(html?|m?js|ts|css|json|md|ya?ml)$/.test(f));
  expect(files.length, 'git listed the tracked files, so this can fail').toBeGreaterThan(500);
  const found = files.filter((f) => {
    const full = path.join(root, f);
    return fs.existsSync(full) && MARKER.test(fs.readFileSync(full, 'utf8'));
  });
  expect(found, 'resolve the conflict: keep one side and delete the marker lines').toEqual([]);
});
