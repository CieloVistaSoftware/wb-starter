import { test, expect } from '@playwright/test';

/**
 * #243: docs open from ?page=docs via target="_blank" — a normal
 * user-navigated tab, not one opened via window.open(). Browsers silently
 * block window.close() on tabs like that (it only works on script-opened
 * windows), so the old "✕ Close" button did nothing — there was no way
 * back to the Docs index without browser-back or re-navigating. Replaced
 * with a real "← Back to Docs" href, computed against the site root the
 * same way other cross-page links in this project are (works locally and
 * under a GitHub Pages sub-path).
 */
test('doc-viewer "Back to Docs" link actually returns to the Docs index', async ({ page }) => {
  await page.goto('/public/doc-viewer.html?file=docs/themes.md', { waitUntil: 'domcontentloaded' });
  const link = page.locator('#back-to-docs');
  await expect(link).toHaveText('← Back to Docs');
  await expect(link).toHaveAttribute('href', /\/\?page=docs$/);

  await link.click();
  await expect(page).toHaveURL(/\?page=docs$/);
  await expect(page.locator('.docs-card').first()).toBeVisible({ timeout: 10000 });
});
