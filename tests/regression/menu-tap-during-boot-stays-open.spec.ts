import { test, expect } from '../fixtures/offline';

/**
 * #1456: on a phone, a tap on the menu button while the site was still
 * starting opened the menu, and the site's own first navigation shut it again.
 *
 * src/main.js boots in two steps: site.init() renders the nav and wires
 * #navToggle, then awaits WB.init() -- a full WB.scan(), which loads the
 * module of every behavior on the page; only after that does
 * navigateTo(currentPage) run, and navigateTo closed the mobile nav on every
 * navigation, the boot one included. Traced at 4x CPU throttle:
 *   1450ms toggle(site__nav--mobile-open)  <- toggleNav <- #navToggle onclick
 *   1552ms remove(site__nav--mobile-open)  <- closeMobileNav <- navigateTo <- main.js init
 *
 * The window is held open on purpose -- ripple.js, which the scan needs for
 * the toggle's own x-ripple, is held back -- so the tap lands inside it every
 * time, not only on a slow runner. The precondition proves it did.
 */
test.use({ serviceWorkers: 'block' }); // #1349: this spec holds a request with page.route

test('a menu tap during startup is still open once the site is ready (#1456)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  const consoleLines: string[] = [];
  page.on('console', (m) => consoleLines.push(m.text()));

  let release: () => void = () => {};
  const held = new Promise<void>((r) => { release = r; });
  await page.route('**/src/wb-viewmodels/ripple.js*', async (route) => {
    await held;
    await route.continue();
  });

  await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
  const toggle = page.locator('#navToggle');
  await expect(toggle).toBeVisible({ timeout: 15000 });

  await toggle.click();
  // Precondition: the tap really was during startup -- init() had not
  // returned, so the boot navigation was still to come.
  expect(consoleLines.some((l) => l.includes('site.init() complete')),
    'site.init() had already finished; this tap was not during startup').toBe(false);
  await expect(page.locator('.site__nav')).toHaveClass(/site__nav--mobile-open/);

  release();
  await page.waitForFunction(() => 'WBSite' in window, undefined, { timeout: 30000 });
  expect(consoleLines.some((l) => l.includes('Navigation complete')), 'the boot navigation ran').toBe(true);

  const nav = page.locator('.site__nav');
  await expect(nav, 'the boot navigation closed the menu the reader had opened').toHaveClass(/site__nav--mobile-open/);
  await expect(nav).toBeVisible();
});
