/**
 * EVERY x-* NAME A BEHAVIOR DOC SHOWS IS ONE THE RUNTIME KNOWS
 * ============================================================
 * #1185 -- John, 2026-09-18: password.md "still shows x-password as an option.
 * ... Also check every other behavior doc for x-* names that no longer exist,
 * and add a guard test: every x-* name shown in docs/behaviors/*.md is a
 * registered behavior."
 *
 * Measured on 4.0.6, five docs taught names the runtime logs as "matches no
 * behavior":
 *
 *   x-ul, x-ol, x-dl     ul.js/ol.js/dl.js were finished modules, but only the
 *                        <wb-ul>/<wb-ol>/<wb-dl> tags ever loaded them. 4.0.0
 *                        removed the tags and renamed the docs to x-*, and
 *                        nothing registered the attribute. Registered now.
 *   x-as-articles        the wb- -> x- rename turned the old tag forms into
 *   x-as-timeline        attributes that never existed (morphing was removed
 *                        in #783). The docs now show what the code adds.
 *
 * Only real markup is read: attributes inside `<tag ...>` in the doc, the same
 * text a reader copies. x-ignore and x-behavior are runtime directives, not
 * behaviors.
 */
import { test, expect } from '../fixtures/offline';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DOCS = 'docs/behaviors';
const DIRECTIVES = new Set(['ignore', 'behavior']);

function registered(): Set<string> {
  const src = readFileSync('src/wb-viewmodels/index.js', 'utf8');
  const block = /const behaviorModules = \{([\s\S]*?)\n\};/.exec(src);
  if (!block) throw new Error('behaviorModules block not found');
  const body = block[1].replace(/\/\/.*$/gm, '');
  return new Set([...body.matchAll(/(['"]?[A-Za-z0-9_-]+['"]?)\s*:\s*'[^']+'/g)]
    .map((m) => m[1].replace(/['"]/g, '')));
}

test('every x-* attribute in docs/behaviors/*.md names a registered behavior (#1185)', () => {
  const known = registered();
  // A parse that matched nothing would pass vacuously (#863).
  expect(known.size, 'behaviorModules parsed').toBeGreaterThan(150);

  const unknown: string[] = [];
  for (const file of readdirSync(DOCS).filter((f) => f.endsWith('.md'))) {
    const text = readFileSync(join(DOCS, file), 'utf8');
    for (const tag of text.matchAll(/<[a-z][a-z0-9-]*\b[^>]*>/g)) {
      // Attribute NAMES only: a quoted value such as class="x-container
      // x-container--grid" holds class names, not behaviors.
      const names = tag[0].replace(/"[^"]*"|'[^']*'/g, '""');
      for (const attr of names.matchAll(/\sx-([a-z][a-z0-9-]*)/g)) {
        const name = attr[1];
        if (!known.has(name) && !DIRECTIVES.has(name)) unknown.push(`${file}: x-${name}  in  ${tag[0].slice(0, 70)}`);
      }
    }
  }
  expect([...new Set(unknown)], 'the runtime logs these as "matches no behavior"').toEqual([]);
});
