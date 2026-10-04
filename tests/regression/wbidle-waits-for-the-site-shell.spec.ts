import { test, expect } from '../fixtures/offline';
import { wbIdle } from '../base';

/**
 * #1466: wbIdle() -- the suite's "the page is ready" -- answered before the
 * site shell had booted. WB.settled() covers the injections WB knows about;
 * on index.html the site is still mid-boot after that (site.init(), then
 * WB.init()'s scan, then navigateTo(), then window.WBSite). CI read the nav
 * with zero items, tapped controls before they were wired, and probed a page
 * still booting -- three flakes in one day.
 *
 * Here the boot is held open on purpose: ripple.js, which the boot scan needs
 * for the nav toggle's own x-ripple, is held 3s. wbIdle() must not return until
 * the site has booted, and then every declared menu item is rendered.
 */
test.use({ serviceWorkers: 'block' }); // #1349: this spec holds a request with page.route

test('wbIdle() returns only after the site shell has booted (#1466)', async ({ page }) => {
  test.setTimeout(60_000);
  await page.route('**/src/wb-viewmodels/ripple.js*', async (route) => {
    await new Promise((r) => setTimeout(r, 3000));
    await route.continue();
  });

  await page.goto('/?page=home', { waitUntil: 'domcontentloaded' });
  await wbIdle(page);

  // Read at once: this is the moment every caller of wbIdle() starts reading.
  const state = await page.evaluate(() => ({
    booted: 'WBSite' in window,
    navItems: document.querySelectorAll('.site__nav a').length,
  }));
  expect(state.booted, 'wbIdle() returned while the site was still booting').toBe(true);
  expect(state.navItems, 'the nav had no items when wbIdle() returned').toBeGreaterThan(0);
});

test('wbIdle() on a page without the site shell does not wait for one (#1466)', async ({ page }) => {
  await page.goto('/demos/test-harness.html');
  const t0 = Date.now();
  await wbIdle(page, { timeout: 15000 });
  expect(Date.now() - t0, 'a shell-less page must not wait out the timeout for WBSite').toBeLessThan(10000);
});
