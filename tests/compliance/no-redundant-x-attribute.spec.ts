/**
 * ═══════════════════════════════════════════════════════════════════════════
 * No x-{behavior} on an element that already auto-injects it (#754)
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

import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';

const root = process.cwd();

/** Bare-tag entries of tag-map.js's nativeMap: tag → behavior. */
function nativeMap(): Record<string, string> {
  const src = readFileSync(join(root, 'src/core/tag-map.js'), 'utf8');
  const block = src.match(/export const nativeMap = \{([\s\S]*?)\n\};/);
  if (!block) throw new Error('nativeMap not found in tag-map.js');
  const out: Record<string, string> = {};
  for (const m of block[1].matchAll(/'([^']+)':\s*'([^']+)'/g)) {
    // Selector keys (input[type="checkbox"]) have no single tag to compare a
    // bare `<tag x-attr>` against; the plain-tag entries are this rule.
    if (/^[a-z][a-z0-9]*$/.test(m[1])) out[m[1]] = m[2];
  }
  return out;
}

const MAP = nativeMap();

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
    const behavior = MAP[m[1].toLowerCase()];
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
    expect(Object.keys(MAP).length).toBeGreaterThan(5);
    expect(MAP['figure'], 'figure should map to the figure behavior').toBe('figure');
  });

  test('no authored source writes x-{behavior} on that behavior\'s own element', () => {
    const files = [
      ...walk(join(root, 'pages'), ['.html']),
      ...walk(join(root, 'demos'), ['.html']),
      ...walk(join(root, 'docs'), ['.md']),
      join(root, 'index.html'),
      join(root, 'project-index.html'),
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
    const dataFile = join(root, 'data/behavior-examples.json');
    const raw = readFileSync(dataFile, 'utf8').replace(/\\"/g, '"').replace(/\\n/g, '\n');
    for (const bad of offendersIn(raw)) {
      failures.push(`${relative(root, dataFile)}: ${bad}`);
    }

    expect(failures, `Redundant dispatch attributes:\n  ${failures.join('\n  ')}`).toEqual([]);
  });

  test('no GENERATED example writes x-{behavior} on that behavior\'s own element', async ({ page }) => {
    // The file-reading test above is structurally blind to this: the showcase
    // builds these in the browser at render time. That is exactly how
    // <figure x-figure> survived 3.0.70 and reached John (#754).
    await page.goto('/pages/behaviors.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 15000 });

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
