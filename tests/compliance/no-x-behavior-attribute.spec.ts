/**
 * ═══════════════════════════════════════════════════════════════════════════
 * x-behavior="name" is deprecated: no authored source writes it (#1642)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John, 2026-10-06: `x-behavior="cardimage"` -- "this format is deprecated in
 * entire project". A behavior has one spelling, its own attribute:
 * `<article x-cardimage>`. Where the tag already IS the behavior (`<pre>`,
 * `<input>`, ... in tag-map.js's nativeMap) it needs no attribute at all.
 *
 * The runtime still dispatches the old form, so old markup keeps working and
 * warns (src/core/x-behavior-deprecation.js). This spec is what stops the
 * project itself writing it again: the pages, demos and src markup people
 * copy from, the seeded JSON examples, and the code that builds elements at
 * runtime (`setAttribute('x-behavior', ...)`).
 *
 * NOT flagged, deliberately:
 *   - comments: writing ABOUT the old form (as this header does) is not using it.
 *   - the runtime's own reads of the attribute (`hasAttribute('x-behavior')`,
 *     `[x-behavior]` selectors): that is the legacy dispatch that keeps old
 *     markup working, and it is what this deprecation keeps.
 *   - docs/ and tests/: docs/behaviors/x-behavior.md documents the deprecated
 *     form, and the legacy-path specs have to author it to test it.
 */

import { test, expect } from '../fixtures/offline';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';

const root = process.cwd();

/** Comments are not markup (same rule as no-redundant-x-attribute.spec.ts). */
function stripComments(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1');
}

/** Each place `text` WRITES x-behavior: an authored attribute or a setAttribute call. */
function usesIn(text: string): string[] {
  const code = stripComments(text);
  const found: string[] = [];
  for (const m of code.matchAll(/\sx-behavior\s*=\s*\\?["']([^"'\\]*)/g)) {
    // A template placeholder is a message QUOTING the old form, e.g. the
    // deprecation warning itself -- not markup that uses it.
    if (!m[1].includes('${')) found.push(`x-behavior="${m[1]}"`);
  }
  for (const m of code.matchAll(/setAttribute\(\s*['"`]x-behavior['"`]/g)) found.push(m[0]);
  return found;
}

function walk(dir: string, exts: string[], acc: string[] = []): string[] {
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return acc; }
  for (const name of entries) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = join(dir, name);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full, exts, acc);
    else if (exts.includes(extname(name))) acc.push(full);
  }
  return acc;
}

test.describe('x-behavior="name" is deprecated (#1642)', () => {
  test('the detector finds both spellings, and skips comments', () => {
    // A detector that matches nothing passes every time and protects nothing.
    expect(usesIn('<article x-behavior="cardimage">')).toEqual(['x-behavior="cardimage"']);
    expect(usesIn('"<input\\r\\n x-behavior=\\"input\\">"'), 'JSON-escaped markup').toHaveLength(1);
    expect(usesIn("pre.setAttribute('x-behavior', 'pre');")).toHaveLength(1);
    expect(usesIn('<!-- <pre x-behavior="pre"> -->')).toHaveLength(0);
    expect(usesIn('// was <code x-behavior="code">')).toHaveLength(0);
    expect(usesIn("if (el.hasAttribute('x-behavior')) {}"), 'reading it is the legacy dispatch').toHaveLength(0);
    expect(usesIn('<article x-cardimage>')).toHaveLength(0);
    expect(usesIn('`<${tag} x-behavior="${value}"> is deprecated`'), 'a message quoting the form').toHaveLength(0);
  });

  test('no page, demo, src file or seeded example writes x-behavior', () => {
    const files = [
      ...walk(join(root, 'pages'), ['.html', '.js']),
      ...walk(join(root, 'demos'), ['.html', '.js']),
      ...walk(join(root, 'src'), ['.html', '.js', '.json']),
      ...walk(join(root, 'packages/create-wb-starter/template'), ['.html', '.js']),
      join(root, 'index.html'),
      join(root, 'data/behavior-examples.json'),
    ];

    const failures: string[] = [];
    for (const file of files) {
      let text: string;
      try { text = readFileSync(file, 'utf8'); } catch { continue; }
      for (const use of usesIn(text)) failures.push(`${relative(root, file)}: ${use}`);
    }

    expect(files.length, 'no files scanned -- the check would pass vacuously').toBeGreaterThan(100);
    expect(
      failures,
      `x-behavior="name" is deprecated. Write x-name instead, or nothing when the tag already is that behavior:\n  ${failures.join('\n  ')}`,
    ).toEqual([]);
  });
});
