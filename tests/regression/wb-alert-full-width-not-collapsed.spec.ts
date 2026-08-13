import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * John, live report: "no x-alert text has proper layout/padding." Confirmed
 * live -- every alert demo collapsed to a ~101x70px near-square sliver,
 * crushing the icon/title/message layout instead of rendering as a banner.
 *
 * Same root cause as #568 (cardhero): wb-alert/.wb-alert has no declared
 * width of its own, so demo.js's single-item shrink-to-fit measurement
 * collapses it to its own tiny natural content width. Fixed by adding the
 * `full-width` attribute to every alert demo's <wb-demo> wrapper (same
 * escape hatch cardhero uses).
 */
test.describe('wb-alert renders as a full-width banner, not a collapsed sliver', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('inside a full-width demo, the alert is wider than it is tall', async ({ page }) => {
    const el = await setupTestContainer(
      page,
      '<wb-demo columns="1" full-width><wb-alert variant="info" message="Test"></wb-alert></wb-demo>'
    );
    const alert = el.locator('wb-alert');
    const box = await alert.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(box!.height * 2);
  });

  test('icon, title, and message are all visible with real spacing between them', async ({ page }) => {
    const el = await setupTestContainer(
      page,
      '<wb-demo columns="1" full-width><wb-alert variant="warning" title="Warning" message="Be careful"></wb-alert></wb-demo>'
    );
    const alert = el.locator('wb-alert');
    const icon = alert.locator('.wb-alert__icon');
    const title = alert.locator('.wb-alert__title');
    const message = alert.locator('.wb-alert__message');
    await expect(icon).toBeVisible();
    await expect(title).toHaveText('Warning');
    await expect(message).toHaveText('Be careful');

    const gap = await alert.evaluate(el => parseFloat(getComputedStyle(el).gap));
    expect(gap).toBeGreaterThan(0);
  });
});
