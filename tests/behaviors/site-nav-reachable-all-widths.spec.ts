import { test, expect } from '../fixtures/offline';
import { wbIdle } from '../base';

/**
 * The site nav must be reachable at every width — never just disappear
 * (#276, Standard §10 mobile-first). Below the mobile breakpoint it's
 * behind a hamburger toggle (#navToggle); above it, it's the always-visible
 * sidebar. Confirmed no gap between the two across the full range.
 */
const WIDTHS = [320, 375, 480, 600, 640, 700, 768, 900, 1200];

test.describe('site nav reachability across widths (#276)', () => {
  for (const width of WIDTHS) {
    test(`nav or hamburger toggle is visible at ${width}px`, async ({ page }) => {
      await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
      await wbIdle(page);
      await page.setViewportSize({ width, height: 800 });

      const nav = page.locator('.site__nav');
      const toggle = page.locator('#navToggle');

      // Polled while the layout reflows to the new width (#1516: not 400ms).
      await expect.poll(async () => (await nav.isVisible().catch(() => false)) || (await toggle.isVisible().catch(() => false)), {
        message: `at ${width}px, neither the sidebar nor the hamburger toggle is visible — nav is unreachable`,
      }).toBe(true);
    });
  }

  test('hamburger toggle at mobile width actually reveals the nav', async ({ page }) => {
    await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
    await wbIdle(page);
    await page.setViewportSize({ width: 375, height: 800 });
    // #1456: wait for the site to finish booting (main.js publishes WBSite
    // after the first navigation) instead of sleeping 400ms and hoping.
    await page.waitForFunction(() => 'WBSite' in window, undefined, { timeout: 30000 });

    await page.click('#navToggle');

    const nav = page.locator('.site__nav');
    await expect(nav).toBeVisible();
    const box = await nav.boundingBox();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });
});
