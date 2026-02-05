import { test, expect } from '@playwright/test';

test.describe('wb-page component', () => {
  test('renders header, main and footer and respects attributes', async ({ page }) => {
    await page.goto('/demos/wb-page-demo.html');
    await expect(page.locator('wb-page')).toBeVisible();
    await expect(page.locator('wb-page > header.site__header')).toBeVisible();
    await expect(page.locator('wb-page > main.site__main')).toBeVisible();
    await expect(page.locator('wb-page > footer.site__footer')).toBeVisible();
    // attribute passthrough
    await expect(page.locator('wb-page[keep-header-at-top]')).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    // enforcement: no legacy slot usage allowed
    const slotCount = await page.evaluate(() => document.querySelectorAll('wb-page [slot], wb-page slot').length);
    expect(slotCount).toBe(0);

    // the source HTML should NOT include a data-theme on the <html> tag (wb-page enforces default)
    const res = await page.request.get('/demos/wb-page-demo.html');
    const text = await res.text();
    expect(text).not.toContain('data-theme="');

    // regression: wb-page sets dark by default even if localStorage had a different theme
    await page.evaluate(() => localStorage.setItem('wb-theme', 'light'));
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.evaluate(() => localStorage.removeItem('wb-theme'));
  });
});