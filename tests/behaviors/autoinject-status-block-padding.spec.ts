import { test, expect } from '@playwright/test';

/**
 * demos/autoinject.html's Status / theme-control header row must have at
 * least 1rem padding (Standard §13 — every example has proper margins &
 * padding). Checked on both desktop and mobile viewports. (#289)
 */
test.describe('autoinject.html status block padding (#289, §13)', () => {
  test('status block has >= 1rem padding on desktop', async ({ page }) => {
    await page.goto('/demos/autoinject.html', { waitUntil: 'domcontentloaded' });
    const padding = await page.locator('#autoinject-div-15').evaluate((el) => parseFloat(getComputedStyle(el).paddingTop));
    expect(padding, 'status block padding should be at least 1rem (16px)').toBeGreaterThanOrEqual(16);
  });

  test('status block has >= 1rem padding on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/demos/autoinject.html', { waitUntil: 'domcontentloaded' });
    const padding = await page.locator('#autoinject-div-15').evaluate((el) => parseFloat(getComputedStyle(el).paddingTop));
    expect(padding, 'status block padding should hold at >= 1rem on mobile too').toBeGreaterThanOrEqual(16);
  });
});
