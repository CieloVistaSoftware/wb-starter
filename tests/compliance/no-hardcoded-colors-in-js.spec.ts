/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Hardcoded colours in JavaScript (#790)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The rule is zero hardcoded colours outside the theme system.
 * css-oop-compliance.spec.ts enforces it, but only for .css files. A colour
 * literal inside a JS template string -- the stylesheets behaviors inject at
 * runtime, or an inline style -- was invisible to it: 360 of them in 2026-09,
 * most of them `var(--text-primary, #f9fafb)`-style fallbacks.
 *
 * A fallback is not harmless. It only fires when the variable is undefined,
 * and then it paints a fixed colour (usually a dark-theme one) into whatever
 * theme is active, turning a loud missing-token bug into a quiet wrong-colour
 * one. themes.css defines every token these used, so the fallbacks are gone.
 *
 * Two checks:
 *   1. `var(--x, #hex)` -- the unambiguous form. None, anywhere in src/.
 *   2. Every other hex colour literal in src/ JS, counted per file against the
 *      register below. The register only shrinks: a file not in it may hold
 *      none, and a file in it may not hold more than its entry. When you move a
 *      file's colours into themes.css, lower (or delete) its entry.
 */

import { test, expect } from '../fixtures/offline';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const root = process.cwd();

/**
 * Hex colour literals still in src/ JS on 2026-10-06, by file. Shrink only.
 * Most are self-contained dev-tool overlays (error display, event toasts, dev
 * console) and decorative palettes (confetti, fireworks); a few are values,
 * not styles (the colour picker's default, the black/white contrast result).
 */
const REGISTER: Record<string, number> = {
  'src/core/events.js': 2,   // console.error %c styling: console output, which no theme reaches
  'src/core/theme.js': 5,
  'src/core/x-devconsole.js': 31,   // a standalone script injected on ANY page, themes.css or not: tokens would not resolve there
  'src/wb-viewmodels/colorpicker.js': 1,
  'src/wb-viewmodels/effects.js': 15,
  'src/wb-viewmodels/semantics/inline.js': 2,
};

/** Comments are not code: blank them out, keeping offsets and line numbers. */
function stripComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, (m, p) => p + ' '.repeat(m.length - p.length));
}

/** Hex colour literals in `code`. Not `&#039;` entities, ids, or issue refs like "(#1642)". */
function hexColors(code: string): string[] {
  const found: string[] = [];
  for (const m of code.matchAll(/#([0-9a-fA-F]{3,8})\b/g)) {
    if (![3, 4, 6, 8].includes(m[1].length)) continue;
    const prev = code[m.index! - 1] ?? '';
    if (/[\w&-]/.test(prev)) continue;                 // &#039; entity, an-id#frag
    // "(#1642)", "#1108: removed", "see #724/#730." -- an issue number, not a
    // colour. A digits-only colour (#333, #111827) is a CSS value, so it ends
    // the declaration or the string: ; ' " ` , or !important. (One inside a
    // `var(--x, #333)` fallback ends in a paren; the check below catches that
    // form on its own.)
    if (/^\d+$/.test(m[1]) && !/^\s*[;'"`,!]/.test(code.slice(m.index! + m[0].length))) continue;
    found.push(m[0]);
  }
  return found;
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (/\.(js|mjs)$/.test(name)) acc.push(full);
  }
  return acc;
}

const FILES = walk(join(root, 'src'));

test.describe('No hardcoded colours in src/ JavaScript (#790)', () => {
  test('the detectors find what they should, and skip what they should', () => {
    expect(hexColors('color: #fff;')).toEqual(['#fff']);
    expect(hexColors("'#ff6b6b', '#4ecdc4'")).toEqual(['#ff6b6b', '#4ecdc4']);
    expect(hexColors('background: var(--x, #1f2937);')).toEqual(['#1f2937']);
    expect(hexColors("replace(/'/g, '&#039;')"), 'an HTML entity').toEqual([]);
    expect(hexColors('wb-starter, #813) turns'), 'an issue reference').toEqual([]);
    expect(hexColors('deprecated (#1642). Write'), 'an issue reference').toEqual([]);
    expect(hexColors("'[sw] #1108: removed'"), 'an issue reference').toEqual([]);
    expect(hexColors('background: #333;'), 'a digits-only colour').toEqual(['#333']);
    expect(FILES.length, 'no src/ JS found -- the check would pass vacuously').toBeGreaterThan(50);
  });

  test('no var(--token, #hex) fallback anywhere in src/ JS', () => {
    const failures: string[] = [];
    for (const file of FILES) {
      const code = stripComments(readFileSync(file, 'utf8'));
      for (const m of code.matchAll(/var\(\s*--[\w-]+\s*,\s*#[0-9a-fA-F]{3,8}\s*\)/g)) {
        const line = code.slice(0, m.index).split('\n').length;
        failures.push(`${relative(root, file)}:${line}: ${m[0]}`);
      }
    }
    expect(
      failures,
      `A hex fallback hides a missing theme token behind a fixed colour. Drop it -- themes.css defines the token -- or add the token there:\n  ${failures.join('\n  ')}`,
    ).toEqual([]);
  });

  test('every other hex colour in src/ JS stays within the shrink-only register', () => {
    const over: string[] = [];
    const actual: Record<string, number> = {};
    for (const file of FILES) {
      const rel = relative(root, file).replace(/\\/g, '/');
      const n = hexColors(stripComments(readFileSync(file, 'utf8'))).length;
      if (n) actual[rel] = n;
      const allowed = REGISTER[rel] ?? 0;
      if (n > allowed) over.push(`${rel}: ${n} hex colours, register allows ${allowed}`);
    }
    expect(
      over,
      `New hardcoded colours in JS. Use a theme token (src/styles/themes.css) instead:\n  ${over.join('\n  ')}`,
    ).toEqual([]);

    // Shrink-only: an entry above the real count is slack a regression could
    // hide in. Lower it to what the file holds now.
    const slack = Object.entries(REGISTER)
      .filter(([rel, allowed]) => (actual[rel] ?? 0) < allowed)
      .map(([rel, allowed]) => `${rel}: register says ${allowed}, file now holds ${actual[rel] ?? 0} -- lower the entry`);
    expect(slack, slack.join('\n')).toEqual([]);
  });
});
