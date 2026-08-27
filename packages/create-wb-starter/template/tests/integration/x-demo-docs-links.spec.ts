import { test, expect, request as pwRequest } from '@playwright/test';

/**
 * #262: the `Docs: wb-<comp>` links under every <div x-demo> must WORK. The old
 * '?page=docs#wb-…' hrefs were dead on every surface (page-relative + no such
 * anchors). Now each link opens the behavior's REAL doc in the doc-viewer,
 * resolved from docs/manifest.json; behaviors with no doc get NO link.
 *
 * #388: cards no longer use the shared '.x-demo__links' line at all — each
 * card grid child gets its OWN link attached directly to it
 * ('.x-demo__card-doc-link', demo.js's attachCardDocLink). Non-card content
 * (badges, alerts, buttons, ...) is unchanged and still uses the shared
 * line. Collect BOTH kinds here so this test keeps covering its real intent
 * (no dead doc-reference link of either kind), not just the pre-#388 shape.
 *
 * Effect-based (§19/§14): every rendered doc-reference link's ?file target must
 * GET 200, and no '?page=docs#' href may remain — checked on BOTH surfaces
 * (SPA page and a doc rendered in the doc-viewer).
 */
async function collectDocsLinks(page: import('@playwright/test').Page) {
  const SELECTOR = '.x-demo__links a, .x-demo__card-doc-link';
  // Cold-start under a parallel run: wb.js + the docs manifest fetch can take a
  // while before the async links fill in — wait for demo upgrade first, then links.
  await expect
    .poll(() => page.locator('x-demo .x-demo__grid').count(), { timeout: 30000 })
    .toBeGreaterThan(0);
  await expect
    .poll(() => page.locator(SELECTOR).count(), { timeout: 30000 })
    .toBeGreaterThan(0);
  return page.$$eval(SELECTOR, (as) => as.map((a) => a.getAttribute('href') || ''));
}

async function assertAllResolve(hrefs: string[], baseURL: string | undefined) {
  const req = await pwRequest.newContext({ baseURL });
  const broken: string[] = [];
  for (const href of [...new Set(hrefs)]) {
    if (href.includes('?page=docs#')) { broken.push(`${href} → legacy dead anchor link`); continue; }
    const fileParam = new URL(href, 'http://localhost:3000/').searchParams.get('file');
    if (!fileParam) { broken.push(`${href} → no ?file target`); continue; }
    const res = await req.get('/' + fileParam.replace(/^\/+/, ''));
    if (res.status() >= 400) broken.push(`${href} → HTTP ${res.status()}`);
  }
  await req.dispose();
  expect(broken, `dead Docs: links:\n  ${broken.join('\n  ')}`).toEqual([]);
}

test.describe('x-demo Docs: links resolve to real docs (#262)', () => {
  test('SPA behaviors page: every Docs: link opens a real doc', async ({ page, baseURL }) => {
    await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
    const hrefs = await collectDocsLinks(page);
    await assertAllResolve(hrefs, baseURL);
  });

  test('doc-viewer surface: every Docs: link opens a real doc', async ({ page, baseURL }) => {
    await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/behaviors/x-demo.md'), {
      waitUntil: 'domcontentloaded',
    });
    const hrefs = await collectDocsLinks(page);
    await assertAllResolve(hrefs, baseURL);
    // Root-awareness: from /public/… the href must point back to site root, not nest under /public/.
    for (const h of hrefs) {
      expect(h, 'href must not nest doc-viewer under /public/public/').not.toMatch(/public\/public\//);
    }
  });

  // #454: siteRoot() (demo.js) only recognized public/, demos/, pages/,
  // articles/ as site-root-relative directories. Pages under tests/fixtures/
  // (e.g. this one) fell through to a fallback that left siteRoot() as
  // '/tests/fixtures/' instead of '/', 404ing the docs/manifest.json fetch
  // and silently suppressing every x-demo Docs: link/badge on the page even
  // though the markup was correctly wrapped in <div x-demo>...</div> (fixed
  // by adding 'tests/fixtures' to siteRoot()'s regex). Covers the per-card
  // badge form specifically ('.x-demo__card-doc-link') since every example
  // on this fixture is a real wb-* grid child, not the shared-line fallback.
  test('tests/fixtures/cards-permutation-matrix.html: every card doc-link badge opens a real doc', async ({
    page,
    baseURL,
  }) => {
    await page.goto('/tests/fixtures/cards-permutation-matrix.html', { waitUntil: 'domcontentloaded' });
    await expect
      .poll(() => page.locator('x-demo .x-demo__grid').count(), { timeout: 30000 })
      .toBeGreaterThan(0);
    await expect
      .poll(() => page.locator('.x-demo__card-doc-link').count(), { timeout: 30000 })
      .toBeGreaterThan(0);
    const hrefs = await page.$$eval('.x-demo__card-doc-link', (as) => as.map((a) => a.getAttribute('href') || ''));
    // Every one of the 65 <div x-demo> blocks on this page wraps a card, so this
    // must produce a real per-instance badge count, not just a nonzero one.
    expect(hrefs.length).toBeGreaterThanOrEqual(65);
    await assertAllResolve(hrefs, baseURL);
    for (const h of hrefs) {
      expect(h, 'href must point back to site root, not nest under /tests/fixtures/').not.toMatch(
        /tests\/fixtures\/(public|docs)\//
      );
    }
  });
});
