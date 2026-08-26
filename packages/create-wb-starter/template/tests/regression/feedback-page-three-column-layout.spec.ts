import { test, expect, type Page } from '@playwright/test';

async function gridTracks(page: Page): Promise<number[]> {
  return page.evaluate(() => Array.from(document.querySelectorAll('x-demo .x-demo__grid')).map((grid) => {
    const columns = getComputedStyle(grid).gridTemplateColumns.trim();
    return columns ? columns.split(/\s+/).length : 0;
  }));
}

test.describe('Feedback page responsive showcase layout', () => {
  test('uses three columns on large screens and collapses to two then one', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/demos/site/feedback.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const demos = Array.from(document.querySelectorAll('x-demo'));
      return demos.length > 0 && demos.every((demo) => demo.querySelector('.x-demo__grid'));
    });
    expect((await gridTracks(page)).every((tracks) => tracks === 3)).toBe(true);

    await page.setViewportSize({ width: 900, height: 900 });
    expect((await gridTracks(page)).every((tracks) => tracks === 2)).toBe(true);

    await page.setViewportSize({ width: 600, height: 900 });
    expect((await gridTracks(page)).every((tracks) => tracks === 1)).toBe(true);
  });
});