/**
 * ASSETS MUST RESOLVE WHERE THE PUBLIC ACTUALLY LOADS THE SITE
 * ===========================================================
 * #1047. John, from the deployed site:
 *
 *   Image failed to load after 5 attempt(s):
 *   https://cielovistasoftware.github.io/images/placeholder.svg
 *
 * GitHub Pages serves this project under `/wb-starter/`. `npm start` serves it
 * at `/`. Every example that writes a ROOT-ABSOLUTE asset path — and
 * data/behavior-examples.json has 20+ of them — is therefore correct locally
 * and a 404 in the only place visitors ever see it.
 *
 * That asymmetry is the whole bug. No local test could catch it, because
 * locally the wrong path is the right path. So this test does not run against
 * `/`: it puts the real server behind a prefix-stripping proxy, so the page is
 * loaded from `/wb-starter/` exactly as it is deployed, and fails on any 404.
 *
 * Deliberately a NETWORK assertion, not a source grep. The source looked
 * completely fine while the site was broken; only the request tells the truth.
 */

import { test, expect, type Page } from '../fixtures/offline';
import { readFileSync } from 'node:fs';

import { mountUnderSubPath, PREFIX } from '../helpers/sub-path';

/** A root-absolute path ending in a media extension, wherever it appears. */
const ROOT_ABSOLUTE_ASSET = /(?:^|["'\s=])\/(?!\/)[^"'\s]*\.(?:svg|png|jpe?g|gif|webp|avif|mp4|webm|mp3)/;

function referencesAnAsset(value: unknown): boolean {
  if (typeof value === 'string') return ROOT_ABSOLUTE_ASSET.test(value);
  if (Array.isArray(value)) return value.some(referencesAnAsset);
  if (value && typeof value === 'object') return Object.values(value).some(referencesAnAsset);
  return false;
}

// Which rows to exercise is DERIVED, never listed. The first version of this
// test hand-listed nine behaviours and PASSED -- while the deployed site was
// still 404ing on every x-cardportfolio row, because that name was not on the
// list. Any catalogue entry whose example references a root-absolute asset is
// a row that must be checked, forever, including ones added tomorrow.
const ASSET_ROWS: string[] = Object.entries(
  JSON.parse(readFileSync(new URL('../../data/behavior-examples.json', import.meta.url), 'utf8')).examples as Record<string, unknown>,
).filter(([, entry]) => referencesAnAsset(entry)).map(([token]) => token);

/** Load the behaviors page through the sub-path proxy, collecting every 404. */
async function openUnderSubPath(page: Page, baseURL: string) {
  const mount = await mountUnderSubPath(baseURL);
  const notFound: string[] = [];
  page.on('response', (r) => {
    if (r.status() !== 404) return;
    // Missing SCHEMAS are a separate, tracked defect (#1048) and would
    // otherwise mask the asset failures this test exists to see.
    if (/\.schema\.json$/.test(r.url())) return;
    if (/favicon/i.test(r.url())) return;
    notFound.push(r.url());
  });
  await page.goto(mount.base + '?page=behaviors', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.behaviors-search-results__row', { timeout: 20_000 });
  return { mount, notFound };
}

// #1482: this was ONE serial sweep over every row in a single 240s budget,
// and the work grows with the catalogue (#1056 added ~39 rows; the budget had
// already been raised from 90s once). On a slow CI runner it ran out of time
// with nothing wrong. Now each row is its own test with its own budget, and
// the 300ms sleep after each click is a wait for the picked example to apply.
test('the catalogue still has asset-bearing rows, and the page lists them (#1047, #1482)', async ({ page, baseURL }) => {
  expect(
    ASSET_ROWS.length,
    'No catalogue entry was found to reference an asset. The DERIVATION is broken, ' +
    'which would silently reduce these tests to checking nothing.',
  ).toBeGreaterThan(5);
  const { mount } = await openUnderSubPath(page, baseURL!);
  try {
    const listed: string[] = await page.evaluate(() =>
      [...document.querySelectorAll('.behaviors-search-results__token')].map((s) => (s.textContent || '').trim()));
    const missing = ASSET_ROWS.filter((t) => !listed.includes(t));
    // A token with no row is skipped by its own test below, which is correct
    // for one -- but if MOST had no row, these tests would check almost nothing.
    expect(
      ASSET_ROWS.length - missing.length,
      `Only ${ASSET_ROWS.length - missing.length} of ${ASSET_ROWS.length} asset-bearing behaviours have a row ` +
      `(${missing.join(', ')}). Either the row markup changed or the catalogue and the page have drifted apart.`,
    ).toBeGreaterThanOrEqual(Math.ceil(ASSET_ROWS.length * 0.7));
  } finally {
    await mount.close();
  }
});

for (const token of ASSET_ROWS) {
  test(`${token} loads its assets when the site is served under a sub-path (#1047)`, async ({ page, baseURL }) => {
    const { mount, notFound } = await openUnderSubPath(page, baseURL!);
    try {
      const hit = await page.evaluate((t) => {
        const span = [...document.querySelectorAll('.behaviors-search-results__token')]
          .find((s) => (s.textContent || '').trim() === t);
        if (!span) return false;
        (window as any).__subpathPrevious = document.querySelector('#behaviors-live-example > *');
        (span.closest('button') as HTMLElement | null)?.click();
        return true;
      }, token);
      test.skip(!hit, `${token} has no row on the page (the coverage test above bounds how many may be missing)`);

      // The picked example is in the panel and its behavior applied -- a
      // signal, not the old 300ms guess (#1457's shape). An example that never
      // applies still has its requests checked below.
      await page.waitForFunction(() => {
        const el = document.querySelector('#behaviors-live-example > *');
        return !!el && el !== (window as any).__subpathPrevious && el.hasAttribute('x-ready');
      }, null, { timeout: 15_000 }).catch(() => {});
      await page.evaluate(() => (window as any).WB?.settled?.({ timeout: 15_000 })).catch(() => {});

      // Nothing rendered anywhere may point at the ORIGIN root.
      const rootAbsolute = await page.evaluate((prefix) => {
        const out: string[] = [];
        const ATTRS = ['src', 'poster', 'image', 'avatar', 'cover', 'thumbnail', 'background', 'logo'];
        document.querySelectorAll('*').forEach((e) => {
          for (const a of ATTRS) {
            const v = e.getAttribute(a);
            if (!v) continue;
            if (v.startsWith('/') && !v.startsWith('//') && !v.startsWith(prefix + '/')) {
              out.push(`<${e.tagName.toLowerCase()} ${a}="${v.split('?')[0]}">`);
            }
          }
        });
        return [...new Set(out)];
      }, PREFIX);

      expect(
        rootAbsolute,
        'These resolve against the ORIGIN root, not the deployed sub-path, so they 404 for\n' +
        'every visitor while looking correct on localhost. Re-root them through siteRoot().',
      ).toEqual([]);
      expect(
        [...new Set(notFound)],
        'Requests that 404 when the site is served under /wb-starter/ -- exactly what the\n' +
        'deployed site does. A green run at "/" proves nothing about this.',
      ).toEqual([]);
    } finally {
      await mount.close();
    }
  });
}

/**
 * THE DOC PANEL IS A SECOND WAY THE SAME MARKUP REACHES THE PAGE
 * ==============================================================
 * The panel renders docs/behaviors/<name>.md straight into the DOM, and a doc
 * may carry a live `<div x-demo>` of its own — blockquote.md does, with
 * avatar="/images/placeholder.svg". Re-rooting the catalogue never touches it.
 *
 * This is asserted at the FUNCTION, not through the page, and the first draft
 * of it is the reason why. That draft opened every doc with a live root-
 * absolute asset and asserted the panel came out clean. It failed — not because
 * the code was wrong, but because `blockquote` is in neither extensionMap nor
 * nativeMap, so the page never builds a row for it, never selects it, and never
 * fetches that doc. The only doc that qualifies is unreachable, so the test
 * could only ever report that it had opened nothing.
 *
 * Weakening it to "check whatever docs happen to be reachable" would have made
 * it pass today by checking nothing, which is the failure mode this file's
 * other test exists to warn about. So the reachability question is left to
 * #1055 (the orphan doc), and what is gated here is the rewriter's actual
 * contract: live markup is re-rooted, fenced sample code is not.
 *
 * The viewer's own version of this path — docs opened through
 * /public/doc-viewer.html, whose base is /public/ — is #1053, and separate.
 */
test('a doc is re-rooted where it renders and left alone where it is quoted', async () => {
  const page = readFileSync(new URL('../../pages/behaviors.html', import.meta.url), 'utf8');

  /** Lifts a function out of the page by brace-matching from its declaration. */
  function extract(name: string): string {
    const start = page.indexOf(`function ${name}(`);
    expect(start, `${name}() is gone from pages/behaviors.html`).toBeGreaterThan(-1);
    let depth = 0;
    let open = false;
    for (let i = start; i < page.length; i++) {
      if (page[i] === '{') { depth++; open = true; }
      else if (page[i] === '}') { depth--; if (open && depth === 0) return page.slice(start, i + 1); }
    }
    throw new Error(`unbalanced braces reading ${name}()`);
  }

  const consts = page.slice(page.indexOf('const ASSET_ATTRS'), page.indexOf('function rootRelativeAssets('));
  expect(consts, 'the ASSET_ATTRS/ASSET_FILE pair is gone').toContain('ASSET_FILE');

  const build = new Function(`
    let BASE = '/wb-starter/';
    function siteRoot() { return BASE; }
    ${consts}
    ${extract('rootRelativeAssets')}
    ${extract('rootRelativeAssetsInMarkdown')}
    return {
      md: rootRelativeAssetsInMarkdown,
      attrs: rootRelativeAssets,
      setBase: (b) => { BASE = b; },
    };
  `);
  const wb = build() as {
    md: (s: string) => string;
    attrs: (s: string) => string;
    setBase: (b: string) => void;
  };

  // The live demo in a doc is markup: it renders, it requests, it must be rooted.
  expect(wb.md('<article avatar="/images/placeholder.svg"></article>'))
    .toBe('<article avatar="/wb-starter/images/placeholder.svg"></article>');

  // Fenced code is DISPLAYED, for a reader to copy into their own project where
  // "/images/..." is the correct thing to copy. Rewriting it would hand every
  // reader a path that only works on this deployment.
  expect(wb.md('```html\n<img src="/images/placeholder.svg">\n```'))
    .toBe('```html\n<img src="/images/placeholder.svg">\n```');

  // Both in one file, and the fences themselves survive the round trip — a
  // split that dropped them would silently delete every code block on the page.
  const mixed = wb.md('<img src="/images/a.svg">\n```html\n<img src="/images/b.svg">\n```\n<img src="/images/c.svg">');
  expect(mixed).toBe(
    '<img src="/wb-starter/images/a.svg">\n```html\n<img src="/images/b.svg">\n```\n<img src="/wb-starter/images/c.svg">',
  );

  // Applying it twice would give /wb-starter/wb-starter/..., which is broken in
  // a way that looks exactly like the fix having run.
  expect(wb.md('<img src="/wb-starter/images/a.svg">')).toBe('<img src="/wb-starter/images/a.svg">');

  // href has its own handling; re-rooting it here would double-apply.
  expect(wb.attrs('<a href="/docs/x">x</a>')).toBe('<a href="/docs/x">x</a>');

  // Locally the root IS "/", so every one of these must be a no-op — otherwise
  // the fix for the deploy becomes a bug for `npm start`.
  wb.setBase('/');
  const local = '<img src="/images/a.svg">\n```\n<img src="/images/b.svg">\n```';
  expect(wb.md(local)).toBe(local);
  wb.setBase('/wb-starter/');

  // Finally the real file the panel would render, so this cannot pass on
  // hand-written strings while the actual doc still leaks.
  const doc = readFileSync(new URL('../../docs/behaviors/blockquote.md', import.meta.url), 'utf8');
  const rendered = wb.md(doc);
  expect(
    (rendered.match(/^[ \t]*```/gm) || []).length,
    'code fences were lost, which would swallow the doc’s code blocks',
  ).toBe((doc.match(/^[ \t]*```/gm) || []).length);

  let inFence = false;
  const leaked: string[] = [];
  rendered.split(/\r?\n/).forEach((line, i) => {
    if (/^[ \t]*```/.test(line)) { inFence = !inFence; return; }
    if (!inFence && /=["']\/(?!wb-starter\/)images\//.test(line)) leaked.push(`${i + 1}: ${line.trim()}`);
  });
  expect(leaked, 'live markup in blockquote.md still points at the ORIGIN root').toEqual([]);
});
