import { test, expect } from '@playwright/test';

/**
 * #511 — "site-engine navigateTo() throws on null config:
 * Cannot read properties of null (reading 'navigationMenu')"
 *
 * Root cause (traced, not guessed): commit 2e0ebc4 added an early return to
 * WBSite.init() so standalone demo pages — which have no #app container and
 * therefore no site shell — skip config loading and shell rendering. That
 * guard was only half the fix: both boot callers (src/index.js and
 * src/main.js) still called site.navigateTo(site.currentPage) unconditionally
 * once init() resolved. On demos/intellisense-check.html (which loads
 * ../src/index.js directly) navigateTo() therefore ran with this.config still
 * null, and `this.config.navigationMenu` threw on every single page load —
 * 12 of the 100 entries in data/errors.json.
 *
 * The fix makes init() report whether it actually initialized, and the callers
 * only navigate when it did. A null-config guard inside navigateTo() is kept
 * as defense in depth because navigateTo is public API (window.WBSite).
 */

const DEMO_PAGE = '/demos/intellisense-check.html';

test('demos/intellisense-check.html boots without an unhandled rejection from navigateTo()', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto(DEMO_PAGE, { waitUntil: 'domcontentloaded' });
  // The throw happened in the .then() of site.init(), i.e. after the config
  // fetch would have resolved. Give the boot promise chain time to settle.
  await page.waitForFunction(() => (window as any).WBSite !== undefined, { timeout: 20000 });
  await page.waitForTimeout(1500);

  expect(
    pageErrors.join('\n'),
    'no page error may mention navigationMenu — that is the #511 null-config throw'
  ).not.toMatch(/navigationMenu/);
  expect(pageErrors, `demo page booted with errors: ${pageErrors.join(' | ')}`).toHaveLength(0);

  // src/index.js's own handlers persist every uncaught error / unhandled
  // rejection to localStorage — that store is what fed data/errors.json and
  // the triage that produced this issue, so assert it stayed clean too.
  const logged = await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('wb_error_logs') || '[]');
    } catch {
      return [];
    }
  });
  expect(
    JSON.stringify(logged),
    'wb_error_logs must not record the null-config TypeError'
  ).not.toMatch(/navigationMenu/);
});

test('WBSite deliberately stays uninitialized on a page with no #app shell', async ({ page }) => {
  await page.goto(DEMO_PAGE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WBSite !== undefined, { timeout: 20000 });
  await page.waitForTimeout(500);

  // Skipping the shell is the intended behavior here — the assertion is that
  // it is skipped cleanly, not that config somehow gets loaded.
  const state = await page.evaluate(() => ({
    hasApp: !!document.getElementById('app'),
    config: (window as any).WBSite?.config ?? null,
    currentPage: (window as any).WBSite?.currentPage ?? null,
  }));
  expect(state.hasApp, 'this demo page has no site shell by design').toBe(false);
  expect(state.config).toBeNull();
  expect(state.currentPage).toBe('home');
});

test('navigateTo() called directly with no config bails instead of throwing', async ({ page }) => {
  await page.goto(DEMO_PAGE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WBSite !== undefined, { timeout: 20000 });

  // Defense in depth: window.WBSite is public API, so a direct call must not
  // throw even though this page has neither config nor a #main container.
  const threw = await page.evaluate(async () => {
    try {
      await (window as any).WBSite.navigateTo('home');
      return null;
    } catch (e: any) {
      return e?.message || String(e);
    }
  });
  expect(threw, 'navigateTo() must not throw when config is absent').toBeNull();
});

test('the real site shell still loads and navigates (fix must not break normal boot)', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => (window as any).WBSite && (window as any).WBSite.config,
    { timeout: 20000 }
  );

  const state = await page.evaluate(() => ({
    hasNav: Array.isArray((window as any).WBSite.config?.navigationMenu),
    currentPage: (window as any).WBSite.currentPage,
    mainHtmlLength: document.getElementById('main')?.innerHTML.length ?? 0,
  }));
  expect(state.hasNav, 'site shell must still load config/site.json').toBe(true);
  expect(state.currentPage).toBeTruthy();
  expect(state.mainHtmlLength, 'navigateTo() must still render page content').toBeGreaterThan(0);
});
