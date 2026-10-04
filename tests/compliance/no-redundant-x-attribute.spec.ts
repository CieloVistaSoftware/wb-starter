/**
 * ═══════════════════════════════════════════════════════════════════════════
 * No x-{behavior} on an element that already auto-injects it (#753)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John: "write a unit test that finds all x-* then it must ensure it is not
 * improper for example x-figure does not belong in figure element."
 *
 * `<figure x-figure>` is redundant: autoInject applies `figure` to a <figure>
 * from the tag alone. It is also actively dangerous — #746 showed the
 * redundant form SUPPRESSED the button behavior for three releases, so this
 * is not a style rule.
 *
 * Two passes, because the two earlier fixes each closed only one of them:
 *
 *   1. AUTHORED sources — the seeded examples, pages, demos and docs. 3.0.70
 *      fixed the JSON data and its test read only that file, so it could not
 *      see the generator.
 *   2. GENERATED examples — the showcase builds markup at render time. That
 *      path emitted `<figure x-figure>` until 3.0.75, invisible to any test
 *      that reads files.
 *
 * The tag→behavior pairs come from tag-map.js's own nativeMap, so a mapping
 * added there is enforced here without touching this file.
 *
 * NOT flagged, deliberately:
 *   - `x-{behavior}` on a DIFFERENT host — `<button x-dialog>` is a button
 *     that opens a dialog; that is the point of the example.
 *   - `x-behavior="name"` — the generic escape hatch, not a tag-named attr.
 *   - `x-eager`, `x-ignore`, `x-hydrated` and friends — framework directives
 *     that name no behavior.
 */

import { test, expect } from '../fixtures/offline';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';
import { nativeRules, nativeBehaviorOf, typeAttrOf } from '../base';

const root = process.cwd();

// The tag->behavior rule is tests/base.ts's nativeRules(): EVERY nativeMap
// entry, typed inputs included (#1141). Plain tags alone let
// <input type="range" x-range> and <input type="password" x-password> through,
// because their behavior is not their tag's name.
const RULES = nativeRules();

/**
 * Comments are not markup. A comment that DOCUMENTS the anti-pattern — and
 * several in pages/behaviors.html quote `<button x-button>` and
 * `<figure x-figure>` precisely to say they must never be emitted — is not an
 * instance of it. Scanning raw text made writing about the rule a violation
 * of the rule.
 *
 * `//` is only treated as a comment when preceded by start-of-line or
 * whitespace, so the `//` in `https://…` inside a real attribute survives.
 */
function stripComments(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1');
}

/** Every `<tag …>` in `html` whose own tag already auto-injects the x- attr it carries. */
function offendersIn(html: string): string[] {
  html = stripComments(html);
  const bad: string[] = [];
  for (const m of html.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)((?:\s[^<>]*?)?)(\/?>)/gs)) {
    const behavior = nativeBehaviorOf(m[1], typeAttrOf(m[2]));
    if (!behavior) continue;
    if (new RegExp(`\\sx-${behavior}(?=[\\s/>=]|$)`).test(m[2])) {
      bad.push(`<${m[1]} … x-${behavior}>`);
    }
  }
  return bad;
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

test.describe('No redundant x-{behavior} attribute', () => {
  test('the tag→behavior map parsed — the rule is not silently empty', () => {
    // A rule that matches nothing passes every time and protects nothing.
    expect(RULES.length).toBeGreaterThan(5);
    expect(nativeBehaviorOf('figure', null), 'figure should map to the figure behavior').toBe('figure');
    // #1141: typed inputs and article are part of the rule, not skipped.
    expect(nativeBehaviorOf('input', 'range')).toBe('range');
    expect(nativeBehaviorOf('input', 'password')).toBe('password');
    expect(nativeBehaviorOf('article', null)).toBe('card');
    expect(offendersIn('<input type="range" x-range>')).toHaveLength(1);
    expect(offendersIn('<input x-password type="password">')).toHaveLength(1);
    expect(offendersIn('<article x-card>')).toHaveLength(1);
    expect(offendersIn('<input type="range" x-colorpicker>'), 'a different behavior is an opt-in').toHaveLength(0);
    expect(offendersIn('<article x-cardimage>'), 'a variant is not a duplicate').toHaveLength(0);
    expect(offendersIn('<ul x-ul>'), 'ul is not in nativeMap; x-ul is how it opts in').toHaveLength(0);
  });

  test('no authored source writes x-{behavior} on that behavior\'s own element', () => {
    // #1141: README, the src/ markup strings and the create-wb-starter
    // template are copied from as much as docs are; they held most of the
    // duplicates this gate could not see.
    const files = [
      ...walk(join(root, 'pages'), ['.html']),
      ...walk(join(root, 'demos'), ['.html']),
      ...walk(join(root, 'docs'), ['.md', '.html']),
      ...walk(join(root, 'src'), ['.html', '.js']),
      ...walk(join(root, 'packages/create-wb-starter/template'), ['.html', '.md', '.js']),
      join(root, 'index.html'),
      join(root, 'README.md'),
    ];

    const failures: string[] = [];
    for (const file of files) {
      let text: string;
      try { text = readFileSync(file, 'utf8'); } catch { continue; }
      for (const bad of offendersIn(text)) {
        failures.push(`${relative(root, file)}: ${bad}`);
      }
    }

    // The seeded example data is JSON-encoded HTML; scan its raw text so the
    // escaped markup is covered by the same rule.
    const jsonFiles = [
      join(root, 'data/behavior-examples.json'),
      ...walk(join(root, 'src/wb-models'), ['.json']),
    ];
    for (const dataFile of jsonFiles) {
      const raw = readFileSync(dataFile, 'utf8').replace(/\\"/g, '"').replace(/\\n/g, '\n');
      for (const bad of offendersIn(raw)) {
        failures.push(`${relative(root, dataFile)}: ${bad}`);
      }
    }

    expect(failures, `Redundant dispatch attributes:\n  ${failures.join('\n  ')}`).toEqual([]);
  });

  test('no GENERATED example writes x-{behavior} on that behavior\'s own element', async ({ page }) => {
    // The file-reading test above is structurally blind to this: the showcase
    // builds these in the browser at render time. That is exactly how
    // <figure x-figure> survived 3.0.70 and reached John (#753).
    // The ROUTED url, not /pages/behaviors.html. That fragment's first script is
    // `location.replace('?page=behaviors')` — opened directly it redirects
    // immediately, so waiting for WB.behaviors can succeed on the document that
    // is about to be replaced, and the evaluate then runs on a fresh page where
    // the generator is not defined yet. The sweep found 0 behaviors and this
    // test failed on its own vacuity guard, which is the guard working.
    await page.goto('/?page=behaviors');
    // Wait for the generator ITSELF, not for a sibling global: it is what the
    // sweep calls, and it is the last of the two to appear.
    await page.waitForFunction(
      () => typeof (window as any).__wbGeneratedExample === 'function'
        && Object.keys((window as any).WB?.behaviors ?? {}).length > 0,
      null,
      { timeout: 30000 },
    );
    // The generator is defined at parse time, but the tag->behavior map it
    // consults arrives by a later dynamic import. Sweeping before then asks
    // it about an empty map -- every native host looks attribute-driven. The
    // browse list renders from that same import, so its rows mean the map is
    // in. (The `null` above matters too: without it the options object was
    // taken as the function ARGUMENT and the 30s timeout never applied.)
    await expect(page.locator('#behaviors-search-results > *').first()).toBeAttached({ timeout: 30000 });

    const rendered: string[] = await page.evaluate(() => {
      // Call the generator directly rather than clicking every row: rows
      // contain links, and a stray navigation destroyed the page context
      // mid-sweep. A flaky test guarding a real rule is worse than no test.
      const gen = (window as any).__wbGeneratedExample;
      if (typeof gen !== 'function') return [];
      const names = Object.keys((window as any).WB?.behaviors ?? {});
      const out: string[] = [];
      for (const name of names) {
        try {
          out.push(String(gen('x-' + name, '', '', '', false)));
        } catch {
          // A generator throw is a different defect; this test is about the
          // markup it produces when it does produce some.
        }
      }
      return out;
    });

    expect(rendered.length, 'no examples rendered — the sweep would pass vacuously')
      .toBeGreaterThan(0);

    const failures: string[] = [];
    for (const html of rendered) {
      for (const bad of offendersIn(html)) failures.push(bad);
    }
    expect([...new Set(failures)],
      `Generated examples emitted redundant attributes:\n  ${[...new Set(failures)].join('\n  ')}`)
      .toEqual([]);
  });
});
