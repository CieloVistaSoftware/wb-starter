/**
 * #299 — pre.js show/hide toggle on code-block chrome. Clicking .x-pre__toggle
 * must collapse the <pre> (and its line-numbers gutter) down to just the
 * header row, and clicking again must restore it — the header controls
 * (toggle/badge/copy) stay reachable in both states since they're
 * absolutely-positioned siblings of <pre>, not children of it.
 */
import { test, expect } from '@playwright/test';

test.describe('#299 — pre.js collapse/expand toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/?page=behaviors');
    await page.waitForSelector('#mainPage-behaviors', { timeout: 20000 });
    await page.waitForTimeout(2500);
  });

  test('clicking the toggle hides the code and restores it on a second click', async ({ page }) => {
    const toggle = page.locator('.x-pre__toggle').first();
    await expect(toggle).toBeVisible();

    const wrapper = page.locator('.x-pre-wrapper').first();
    const pre = wrapper.locator('pre.x-pre').first();

    const openHeight = await wrapper.evaluate((el) => el.getBoundingClientRect().height);

    await toggle.click();
    await expect(pre).toHaveCSS('display', 'none');
    const collapsedHeight = await wrapper.evaluate((el) => el.getBoundingClientRect().height);
    expect(collapsedHeight, 'wrapper should shrink once <pre> is hidden').toBeLessThan(openHeight);
    // Header controls must stay reachable while collapsed — that's the
    // entire point of the wrapper's explicit min-height.
    await expect(toggle).toBeVisible();

    await toggle.click();
    await expect(pre).not.toHaveCSS('display', 'none');
    const restoredHeight = await wrapper.evaluate((el) => el.getBoundingClientRect().height);
    expect(restoredHeight, 'wrapper should restore to its original height').toBeGreaterThanOrEqual(openHeight - 2);
  });

  test('toggle button never leaves the DOM/visible area in either state', async ({ page }) => {
    const toggle = page.locator('.x-pre__toggle').first();
    for (let i = 0; i < 3; i++) {
      await toggle.click();
      await expect(toggle).toBeVisible();
      await expect(toggle).toBeInViewport();
    }
  });
});
