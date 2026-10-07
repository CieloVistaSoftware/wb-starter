/**
 * ═══════════════════════════════════════════════════════════════════════════
 * No !important in src/ (#1014)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The rule says none, ever: an !important declaration beats every normal rule
 * regardless of specificity, so a theme, a variant or a page override can only
 * win by escalating to !important itself. #1014 counted 181 in 2026-09.
 *
 * Nothing stopped new ones, so the count could only grow. This register holds
 * what is left, by file, and only shrinks: a file not in it may hold none, a
 * file in it may not hold more than its entry, and an entry ABOVE the file's
 * real count fails too -- lower it when you clean the file. Comments are not
 * counted: writing about !important is not using it.
 */

import { test, expect } from '../fixtures/offline';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const root = process.cwd();

/** !important declarations still in src/ on 2026-10-07, by file. Shrink only. */
const REGISTER: Record<string, number> = {
  'src/styles/behaviors/card.css': 10,
  'src/styles/behaviors/demo.css': 7,
  'src/styles/normalize.css': 5,
  'src/styles/pages/about.css': 6,
  'src/styles/pages/ai-permutation-test.css': 6,
  'src/styles/pages/behaviors.css': 8,
  'src/styles/pages/components.css': 5,
  'src/styles/pages/contact.css': 11,
  'src/styles/pages/docs.css': 5,
  'src/styles/pages/services.css': 7,
  'src/styles/pages/themes-showcase.css': 10,
  'src/styles/safari-fixes.css': 3,
  'src/styles/site.css': 28,
  'src/styles/transitions.css': 4,
  'src/styles/x-signature.css': 5,
};

/** Remove comments. CSS has only block comments; JS also has line comments. */
function stripComments(text: string, js: boolean): string {
  let out = text.replace(/\/\*[\s\S]*?\*\//g, '');
  if (js) out = out.replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
  return out;
}

function countImportant(text: string, js: boolean): number {
  return (stripComments(text, js).match(/!\s*important\b/gi) || []).length;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(css|js)$/.test(name)) out.push(full);
  }
  return out;
}

test.describe('no !important in src/ (#1014)', () => {
  test('the counter finds declarations and skips comments', () => {
    // A counter that matches nothing passes every time and protects nothing.
    expect(countImportant('a { color: red !important; }', false)).toBe(1);
    expect(countImportant('a { color: red ! important; }', false)).toBe(1);
    expect(countImportant('/* never use !important */ a { color: red; }', false)).toBe(0);
    expect(countImportant("el.style.cssText = 'color: red !important'; // not !important here", true)).toBe(1);
  });

  test('each file holds no more !important than its register entry, and the entry is exact', () => {
    const found: Record<string, number> = {};
    for (const file of walk(join(root, 'src'))) {
      // src/lib holds vendored libraries; highlight.js's CSS grammar names
      // "!important" as a token to colour, which is not a declaration.
      if (/[\\/]src[\\/]lib[\\/]/.test(file)) continue;
      const n = countImportant(readFileSync(file, 'utf8'), file.endsWith('.js'));
      if (n) found[relative(root, file).replace(/\\/g, '/')] = n;
    }
    const over = Object.entries(found)
      .filter(([f, n]) => n > (REGISTER[f] ?? 0))
      .map(([f, n]) => `${f}: ${n} (register allows ${REGISTER[f] ?? 0})`);
    expect(over, 'new !important declarations -- win with a more specific selector instead').toEqual([]);
    const stale = Object.entries(REGISTER)
      .filter(([f, n]) => (found[f] ?? 0) < n)
      .map(([f, n]) => `${f}: register says ${n}, file holds ${found[f] ?? 0} -- lower the entry`);
    expect(stale, 'the register only shrinks: lower each entry to what is left').toEqual([]);
  });
});
