/**
 * Issue: note-1769445416198-p0
 * Title: builder.html needs page level theme control
 * Goal: assert that builder UI exposes a page-level theme control and that it toggles page theme
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769445416198-p0 — builder page-level theme control', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForLoadState('networkidle');
  });

  test('page-level theme control exists and toggles theme', async ({ page }) => {
    const pageTheme = page.locator('[data-test="page-theme-control"], [data-test="site-theme-control"]');
    const header = page.locator('header, .site-header').first();

    const exists = await pageTheme.isVisible().catch(() => false);
    expect(exists, 'page-level theme control should be present').toBe(true);

    if (exists) {
      const before = await header.getAttribute('data-theme') || await header.getAttribute('class');
      await pageTheme.click();
      await page.waitForTimeout(200);
      const after = await header.getAttribute('data-theme') || await header.getAttribute('class');
      expect(before === after, 'clicking page-level theme should toggle header theme').toBe(false);
    }
  });
});