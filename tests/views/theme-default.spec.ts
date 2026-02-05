import { test, expect } from '@playwright/test';

test.describe('theme: dark-by-default', () => {
  test('demos without an explicit data-theme should render dark by default (no FOUC)', async ({ page }) => {
    // ensure no persisted preference exists
    await page.goto('/demos/wb-page-demo.html');

    // source HTML must not include an authorial data-theme or an inline theme-guard
    const res = await page.request.get('/demos/wb-page-demo.html');
    const src = await res.text();
    expect(src).not.toContain('data-theme="');
    expect(src).not.toContain('early theme guard');

    // rendered document should compute dark theme variables even when no data-theme attr exists
    const bgVar = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim());
    expect(bgVar).toBe('hsl(220, 25%, 10%)');

    // regression: a persisted 'light' value MUST NOT cause the first paint to be light
    await page.evaluate(() => localStorage.setItem('wb-theme', 'light'));
    await page.reload();
    const bgAfter = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim());
    expect(bgAfter).toBe('hsl(220, 25%, 10%)');
    await page.evaluate(() => localStorage.removeItem('wb-theme'));
  });

  test('standalone demo (kitchen-sink) defaults to dark when no preference exists', async ({ page }) => {
    // clear any persisted key and navigate
    await page.evaluate(() => { try { localStorage.removeItem('wb-theme'); localStorage.removeItem('theme'); } catch(e){} });
    await page.goto('/demos/kitchen-sink.html');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});