import { test, expect } from '../fixtures/offline';
import * as fs from 'fs';
import * as path from 'path';

/**
 * A CSS TAG SELECTOR MUST NAME A TAG THAT EXISTS (#857)
 * =====================================================
 * 4.0.0 replaced every custom tag (`<wb-card>`) with an attribute on a real
 * element (`<div x-card>`), and its prefix regex rewrote the tag selectors
 * too: `wb-card { … }` became `x-card { … }`, a tag nothing renders. Such a
 * rule is SILENT -- it matches nothing, so no error, no warning, the styling
 * just never applies. #857 found 300 of them in src/styles/. Most sat beside a
 * live `[x-card]` twin and were merely dead weight; some were the only
 * selector their rule had, so the rule had done nothing since 4.0.0:
 *
 *   @media (prefers-reduced-motion) { x-cardhero::before { animation: none } }
 *     -> the hero sheen kept animating for readers who asked for less motion
 *   .site__loading.loading--error x-spinner { display: none }
 *     -> the spinner kept spinning beside "Error loading"
 *   .x-articles--masonry > x-article { break-inside: avoid; margin-bottom }
 *     -> masonry cards sat flush, with no gap
 *
 * The tags that DO exist are read from the source, not listed here: an `x-*`
 * tag is real when src/ creates it (`createElement('x-…')`) or registers it
 * (`customElements.define('x-…')`). Today that is x-button and x-fix-card.
 *
 * Static, no browser: it reads the stylesheets and every <style> block.
 */

const ROOT = process.cwd();
const SKIP = new Set(['node_modules', '.git', 'archive', 'out', 'dist', '.claude', 'vendor', 'test-results', 'data']);

function walk(dir: string, keep: (p: string) => boolean, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, keep, out);
    else if (keep(p)) out.push(p);
  }
  return out;
}

/** The x-* tags the runtime actually creates or registers. */
function realTags(): Set<string> {
  const tags = new Set<string>();
  const re = /(?:createElement|customElements\.define)\(\s*['"`](x-[a-z][a-z0-9-]*)['"`]/g;
  for (const f of walk(path.join(ROOT, 'src'), (p) => /\.(m?js|ts)$/.test(p))) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(re)) tags.add(m[1]);
  }
  return tags;
}

/** A bare `x-…` used as a type selector: not `[x-…]`, `.x-…`, `--x-…` or part of another name. */
const TAG = /(^|[\s>+~(,])(x-[a-z][a-z0-9-]*)(?=[\s>+~:.[)#,]|$)/g;

type Hit = { file: string; line: number; tag: string; selector: string };

/** Every selector prelude in a stylesheet, with its line, comments blanked. */
function deadTagSelectors(css: string, file: string, real: Set<string>, lineOffset = 0): Hit[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  const hits: Hit[] = [];
  for (const m of text.matchAll(/(?<=^|[{};])([^{};]+)\{/g)) {
    const prelude = m[1];
    if (prelude.trim().startsWith('@')) continue; // @media, @keyframes x-…, @supports
    for (const t of prelude.matchAll(TAG)) {
      if (real.has(t[2])) continue;
      const at = m.index! + (t.index ?? 0) + t[1].length;
      hits.push({
        file: path.relative(ROOT, file),
        line: lineOffset + text.slice(0, at).split('\n').length,
        tag: t[2],
        selector: prelude.trim().replace(/\s+/g, ' ').slice(0, 120),
      });
    }
  }
  return hits;
}

test.describe('CSS tag selectors name tags that exist (#857)', () => {
  test('no stylesheet or <style> block selects an x-* tag nothing renders', () => {
    const real = realTags();
    expect(real.has('x-button'), 'the real-tag scan found nothing -- it is broken, not clean').toBe(true);

    const hits: Hit[] = [];
    for (const f of walk(path.join(ROOT, 'src'), (p) => p.endsWith('.css'))) {
      hits.push(...deadTagSelectors(fs.readFileSync(f, 'utf8'), f, real));
    }
    const html = ['pages', 'demos', 'public', 'templates']
      .filter((d) => fs.existsSync(path.join(ROOT, d)))
      .flatMap((d) => walk(path.join(ROOT, d), (p) => p.endsWith('.html')))
      .concat(fs.existsSync(path.join(ROOT, 'index.html')) ? [path.join(ROOT, 'index.html')] : []);
    for (const f of html) {
      const src = fs.readFileSync(f, 'utf8');
      for (const s of src.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) {
        const offset = src.slice(0, s.index! + s[0].indexOf('>') + 1).split('\n').length - 1;
        hits.push(...deadTagSelectors(s[1], f, real, offset));
      }
    }

    expect(
      hits.map((h) => `${h.file}:${h.line}  ${h.tag}  in  ${h.selector}`),
      `These select an x-* tag that nothing renders, so they match nothing.\n` +
      `Behaviors are attributes on real elements: write [x-name] (the authored\n` +
      `markup) or .x-name (the class the behavior adds). Real x-* tags: ${[...real].join(', ')}.`,
    ).toEqual([]);
  });

  test('the scan catches a dead tag selector and leaves live forms alone', () => {
    const real = new Set(['x-button']);
    const css = `
      x-card, [x-card], .x-card { color: red; }
      .grid > x-article { gap: 1rem; }
      :is(.x-link, x-link) { cursor: pointer; }
      x-button { padding: 0; }
      [x-card] .x-card__title, .x-card--xs { --x-card-gap: 1rem; animation: x-card-sheen 1s; }
      @keyframes x-card-sheen { from { opacity: 0; } to { opacity: 1; } }
      /* x-commented { } */
    `;
    const found = deadTagSelectors(css, path.join(ROOT, 'probe.css'), real).map((h) => h.tag);
    expect(found).toEqual(['x-card', 'x-article', 'x-link']);
  });
});
