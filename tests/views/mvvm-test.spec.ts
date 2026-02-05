import { test, expect } from '@playwright/test';

test.describe('MVVM schema builder demo (mvvm-test.html)', () => {
  test('page has no inline style attributes and is scoped', async ({ page }) => {
    await page.goto('/src/core/mvvm-test.html');
    // ensure body is namespaced
    await expect(page.locator('body.mvvm-test-page')).toHaveCount(1);
    // no elements should have an inline style attribute
    const inlineCount = await page.evaluate(() => document.querySelectorAll('[style]').length);
    expect(inlineCount).toBe(0);
    // basic smoke checks
    await expect(page.locator('.mvvm-test-page .test-section')).toBeVisible();
    await expect(page.locator('.mvvm-test-page .schema-format')).toBeVisible();
    // new: wb-issue component should render and contain the helper text (replaces inline <p>)
    await expect(page.locator('wb-issue')).toHaveText(/CSS styles .*wb-badge/);
    // compatibility: alias `wb-note` remains registered for backwards-compat
    await expect(page.evaluate(() => !!customElements.get('wb-note'))).resolves.toBe(true);
    // theme control should be present and page should keep the dark theme by default
    await expect(page.locator('wb-theme-dropdown')).toBeVisible();
    await expect(await page.locator('html').getAttribute('data-theme')).toBe('dark');
    // runtime checks: demo pages should not initialize the full site shell
    await expect(page.evaluate(() => window.WBSite)).resolves.toBeNull();
    await expect(page.evaluate(() => window.__WB_INITIALIZED__)).resolves.toBe(false);
  });
});
