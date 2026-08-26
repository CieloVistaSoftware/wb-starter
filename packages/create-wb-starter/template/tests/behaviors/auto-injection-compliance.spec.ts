import { test, expect } from '@playwright/test';

/**
 * Auto-injection compliance. (#277)
 *
 * Two defects fixed here:
 *
 * 1. WB never loaded. The old version called page.setContent() with a
 *    <script type="module">import WB from '/src/core/wb.js'</script> WITHOUT
 *    first navigating the page to the server, so the base URL was
 *    about:blank and the absolute import never resolved. Every "should have
 *    class" assertion failed with class "", and every "should NOT have
 *    class" assertion passed vacuously (WB never ran at all).
 *
 *    Fix: navigate to tests/fixtures/blank.html FIRST (not '/' — the real
 *    site root runs its own site-engine.js WB.init() call, which races/leaks
 *    into this test's own later, isolated WB.init() call; see
 *    tests/compliance/autoinject-default-false.spec.ts for the same fix).
 *    blank.html is script-free and served from the same origin as the app,
 *    so the absolute '/src/core/wb.js' import resolves correctly.
 *
 * 2. Assertions contradicted the implementation/contract. See tag-map.js's
 *    nativeMap for the ground truth of what native tags auto-inject as.
 *    nativeMap maps 'article' -> 'card' and 'dialog' -> 'dialog'; 'nav' is
 *    deliberately NOT in nativeMap (see the "Native <nav>" test below for
 *    why), so a <nav> must NOT become a navbar under autoInject.
 */
async function renderWithWB(page, bodyHtml: string, initOptions = '{ autoInject: true }') {
  await page.goto('/tests/fixtures/blank.html');
  await page.setContent(`
    ${bodyHtml}
    <script type="module">
      import WB from '/src/core/wb.js';
      window.__wbDone = false;
      WB.init(${initOptions}).then(() => WB.scan(document.body)).then(() => { window.__wbDone = true; });
    </script>
  `);
  await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 15000 });
  // Settle time so async behavior-processing that completes after scan()'s
  // own promise resolves (e.g. schema/behavior module loading) has landed
  // before assertions run — matches the wait used in
  // tests/compliance/autoinject-default-false.spec.ts for the same reason.
  await page.waitForTimeout(800);
}

test.describe('Auto-Injection Compliance', () => {
  test('Explicit <article> IS a Card', async ({ page }) => {
    await renderWithWB(page, `<article id="explicit-card"><header><h1>Title</h1></header><p>Content</p></article>`);
    await expect(page.locator('#explicit-card')).toHaveClass(/x-card/, { timeout: 10000 });
  });

  test('Native <dialog> is auto-injected with x-dialog (nativeMap: dialog -> dialog)', async ({ page }) => {
    await renderWithWB(page, `<dialog id="auto-dialog">Content</dialog>`);
    await expect(page.locator('#auto-dialog')).toHaveClass(/x-dialog/, { timeout: 10000 });
  });

  test('Native <article> IS auto-injected as Card (nativeMap: article -> card)', async ({ page }) => {
    await renderWithWB(page, `<article id="auto-article"><header><h1>Title</h1></header><p>Content</p></article>`);
    await expect(page.locator('#auto-article')).toHaveClass(/x-card/, { timeout: 10000 });
  });

  // Contract decision (#277): <nav> does NOT auto-inject as navbar, even with
  // autoInject:true. 'nav' is intentionally absent from tag-map.js's
  // nativeMap. site-engine.js renders the real site's own navigation as
  // <nav class="site__nav" id="siteNav"> and drives it with hand-rolled
  // toggle/resize/mobile logic in site-engine.js itself, NOT via WB's navbar
  // behavior. If 'nav' were added to nativeMap, every autoInject:true page
  // (including the real site, now that config/site.json's
  // autoInjectComponents defaults to true — #279) would have its own
  // site__nav silently reclassified/re-enhanced as a x-navbar underneath
  // site-engine.js's unrelated logic. Native <nav> auto-inject is therefore
  // out of scope for #277; a page that wants navbar behavior on a <nav> must
  // opt in explicitly (e.g. <div x-navbar> or an x-as-navbar style extension),
  // not receive it implicitly.
  test('Native <nav> is NOT auto-injected as Navbar (nav intentionally absent from nativeMap)', async ({ page }) => {
    await renderWithWB(page, `<nav id="auto-nav"><ul><li><a href="#">Link</a></li></ul></nav>`);
    await expect(page.locator('#auto-nav')).not.toHaveClass(/x-navbar/);
  });
});
