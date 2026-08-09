import { test, expect } from '@playwright/test';

/**
 * demos/registry-browser.html (#263):
 * 1. No horizontal overflow / dead space at any width — the table stacks
 *    into labeled cards below 700px instead of silently clipping
 *    (`.registry-table { overflow: hidden }` was hiding the Template
 *    Source column entirely at narrow widths).
 * 2. An intro + working "how to use" live example — this page never
 *    called initViews(), so the wb-views template system that renders
 *    registered custom tags (<wb-badge>, <alert-box>, etc.) was never
 *    initialized at all.
 */
test.describe('registry-browser.html (#263)', () => {
  test('no horizontal overflow at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto('/demos/registry-browser.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    expect(overflow, 'page should not scroll horizontally at 375px').toBe(false);
  });

  test('table stacks into cards at mobile width, no hidden columns', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto('/demos/registry-browser.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const firstRow = page.locator('.registry-table tbody tr').first();
    // All 3 cells (View Name, Description & Attributes, Template Source)
    // must be visible and reachable, not clipped.
    const cellCount = await firstRow.locator('td').count();
    expect(cellCount).toBe(3);
    for (let i = 0; i < cellCount; i++) {
      await expect(firstRow.locator('td').nth(i)).toBeVisible();
    }
  });

  test('usage example renders a real, working registered view', async ({ page }) => {
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(String(e)));
    await page.goto('/demos/registry-browser.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const badge = page.locator('#usage-example wb-badge');
    await expect(badge).toBeVisible();
    await expect(badge.locator('.badge')).toHaveText('New');
    expect(errs, 'no page errors while rendering the usage example').toEqual([]);
  });

  test('has an intro explaining what a registered view is', async ({ page }) => {
    await page.goto('/demos/registry-browser.html', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('What is a registered view?')).toBeVisible();
    await expect(page.getByText('How to use a registered view')).toBeVisible();
  });
});
