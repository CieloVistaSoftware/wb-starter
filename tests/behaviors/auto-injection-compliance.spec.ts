import { test, expect } from '../fixtures/offline';

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
      WB.init(${initOptions}).then(() => WB.scan(document.body)).then(() => WB.settled({ timeout: 10000 }).catch(() => {})).then(() => { window.__wbDone = true; });
    </script>
  `);
  await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 15000 });
  // __wbDone is set only after WB.settled(), which waits for each lazily observed
  // element's first IntersectionObserver report (#1516: no fixed 800ms settle).
}

test.describe('Auto-Injection Compliance', () => {
  test('Explicit <article> IS a Card', async ({ page }) => {
    await renderWithWB(page, `<article id="explicit-card"><header><h1>Title</h1></header><p>Content</p></article>`);
    // Cards stopped stamping .x-card onto an <article> (a8a7362e: card.css
    // matches the tag). "Became a card" is the behavior settling (x-ready)
    // and owning its header: the page-level header behavior must NOT claim it
    // (component-landmark.js).
    const card = page.locator('#explicit-card');
    await expect(card).toHaveAttribute('x-ready', '', { timeout: 10000 });
    await expect(card.locator(':scope > header')).not.toHaveClass(/x-header/);
  });

  test('Native <dialog> is auto-injected with .x-dialog (nativeMap: dialog -> dialog)', async ({ page }) => {
    await renderWithWB(page, `<dialog id="auto-dialog">Content</dialog>`);
    await expect(page.locator('#auto-dialog')).toHaveClass(/x-dialog/, { timeout: 10000 });
  });

  test('Native <article> IS auto-injected as Card (nativeMap: article -> card)', async ({ page }) => {
    await renderWithWB(page, `<article id="auto-article"><header><h1>Title</h1></header><p>Content</p></article>`);
    // Cards stopped stamping .x-card onto an <article> (a8a7362e: card.css
    // matches the tag). "Became a card" is the behavior settling (x-ready)
    // and owning its header: the page-level header behavior must NOT claim it
    // (component-landmark.js).
    const card = page.locator('#auto-article');
    await expect(card).toHaveAttribute('x-ready', '', { timeout: 10000 });
    await expect(card.locator(':scope > header')).not.toHaveClass(/x-header/);
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
  // #958 -- John, 2026-09-10, decided the opposite: "in html5 there is a nav
  // element, when we created the navbar our intent was to give the nav links a
  // look and feel of our site". nativeMap now maps nav -> navbar, and the
  // concern above is met another way: a PLAIN <nav> gets classes and the link
  // look only, never the header layout or a rebuilt structure, so site__nav
  // is not re-enhanced (tests/regression/nav-picks-up-navbar.spec.ts).
  test('Native <nav> picks up navbar as a plain nav: classes only, structure untouched (#958)', async ({ page }) => {
    await renderWithWB(page, `<nav id="auto-nav"><ul><li><a href="#">Link</a></li></ul></nav>`);
    const nav = page.locator('#auto-nav');
    await expect(nav).toHaveClass(/x-navbar--plain/);
    await expect(nav.locator('.x-navbar__menu')).toHaveCount(0);
    await expect(nav.locator(':scope > ul > li > a')).toHaveCount(1);
  });
});
