import { test, expect } from '@playwright/test';

/**
 * demos/autoinject.html's "Static Theme Variants" select examples used
 * hardcoded rgba() literals in their inline style attribute instead of the
 * theme's own translucent success/danger background variables. (#288,
 * partial — the full page-wide <wb-demo> conversion this issue also asks
 * for is tracked separately alongside #268's larger demos/ initiative.)
 */
test('theme-variant selects use theme vars, not hardcoded rgba() literals', async ({ page }) => {
  await page.goto('/demos/autoinject.html', { waitUntil: 'domcontentloaded' });

  const success = page.locator('#autoinject-select-success');
  const error = page.locator('#autoinject-select-error');

  const successStyle = await success.getAttribute('style');
  const errorStyle = await error.getAttribute('style');

  expect(successStyle, 'success variant should use var(--alert-success-bg), not rgba()').not.toContain('rgba(');
  expect(successStyle).toContain('var(--alert-success-bg)');
  expect(errorStyle, 'error variant should use var(--alert-danger-bg), not rgba()').not.toContain('rgba(');
  expect(errorStyle).toContain('var(--alert-danger-bg)');

  // Still visibly tinted — theme vars produce a real, non-transparent color.
  await expect(success).toBeVisible();
  const bg = await success.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
});
