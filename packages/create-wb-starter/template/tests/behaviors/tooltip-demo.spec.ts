import { test, expect } from '@playwright/test';

// feedback.html is now a large consolidated category page (750+ demos,
// many remote <img> placeholders) — these tooltip trigger buttons sit far
// down it. Two things must settle before hover() reliably lands: (1)
// wb-lazy.js's IntersectionObserver-driven behavior attachment (wait for
// the tooltip() setup's own init marker, element._wbTooltip — see
// src/wb-viewmodels/tooltip.js), and (2) layout — ongoing image loads
// elsewhere on the page shift content (CLS), which raced Playwright's
// hover() coordinates and made this flaky. Waiting for networkidle before
// interacting fixed it.
async function hoverEnhancedButton(page, id: string) {
  await page.waitForLoadState('networkidle');
  const btn = page.locator(id);
  await btn.scrollIntoViewIfNeeded();
  await page.waitForFunction(
    (sel) => !!(document.querySelector(sel) as any)?._wbTooltip,
    id,
    { timeout: 10000 }
  );
  await btn.hover();
}

test.describe('Tooltip Button Showcase', () => {
  test('shows tooltip on hover (top)', async ({ page }) => {
    await page.goto('http://localhost:3000/demos/site/feedback.html');
    await hoverEnhancedButton(page, '#btn-top');
    const tooltip = page.locator('.wb-tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText('Tooltip text');
  });

  test('shows tooltip on hover (bottom)', async ({ page }) => {
    await page.goto('http://localhost:3000/demos/site/feedback.html');
    await hoverEnhancedButton(page, '#btn-bottom');
    const tooltip = page.locator('.wb-tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText('Tooltip text');
  });

  test('shows tooltip on hover (left)', async ({ page }) => {
    await page.goto('http://localhost:3000/demos/site/feedback.html');
    await hoverEnhancedButton(page, '#btn-left');
    const tooltip = page.locator('.wb-tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText('Tooltip text');
  });

  test('shows tooltip on hover (right)', async ({ page }) => {
    await page.goto('http://localhost:3000/demos/site/feedback.html');
    await hoverEnhancedButton(page, '#btn-right');
    const tooltip = page.locator('.wb-tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText('Tooltip text');
  });
});
