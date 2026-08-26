import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * John, live report: "no x-alert text has proper layout/padding." Confirmed
 * live -- every alert demo collapsed to a ~101x70px near-square sliver,
 * crushing the icon/title/message layout instead of rendering as a banner.
 *
 * Same root cause as #568 (cardhero): x-alert/.x-alert has no declared
 * width of its own, so demo.js's single-item shrink-to-fit measurement
 * collapses it to its own tiny natural content width. Fixed by adding the
 * `full-width` attribute to every alert demo's <div x-demo> wrapper (same
 * escape hatch cardhero uses).
 */
test.describe('[x-alert] renders as a full-width banner, not a collapsed sliver', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('inside a full-width demo, the alert is wider than it is tall', async ({ page }) => {
    const el = await setupTestContainer(
      page,
      '<div x-demo columns="1" full-width><div x-alert variant="info" message="Test"></div></div>'
    );
    const alert = el.locator('[x-alert]');
    const box = await alert.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(box!.height * 2);
  });

  test('icon, title, and message are all visible with real spacing between them', async ({ page }) => {
    const el = await setupTestContainer(
      page,
      '<div x-demo columns="1" full-width><div x-alert variant="warning" title="Warning" message="Be careful"></div></div>'
    );
    const alert = el.locator('[x-alert]');
    const icon = alert.locator('.x-alert__icon');
    const title = alert.locator('.x-alert__title');
    const message = alert.locator('.x-alert__message');
    await expect(icon).toBeVisible();
    await expect(title).toHaveText('Warning');
    await expect(message).toHaveText('Be careful');

    const gap = await alert.evaluate(el => parseFloat(getComputedStyle(el).gap));
    expect(gap).toBeGreaterThan(0);
  });
});
