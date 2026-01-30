/**
 * Issue: note-1769445369305-p0
 * Title: doc button from builder doesn't navigate
 * Goal: clicking the docs button in builder should navigate to documentation page (or open in new tab)
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769445369305-p0 — builder docs button navigates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForLoadState('networkidle');
  });

  test('docs button triggers navigation to docs', async ({ page }) => {
    const docsBtn = page.locator('[data-test="builder-docs-button"], a:has-text("Docs"), button:has-text("Docs")').first();
    await expect(docsBtn).toBeVisible({ timeout: 2000 });
    const href = await docsBtn.getAttribute('href');
    if (href) {
      // anchor: click and assert navigation
      await Promise.all([
        page.waitForURL(/\/articles|\/docs|\/pages\//, { timeout: 5000 }),
        docsBtn.click()
      ]);
      expect(page.url()).toMatch(/articles|docs|pages/);
    } else {
      // button case: ensure click opens a new tab or triggers navigation link in UI
      await docsBtn.click();
      await page.waitForTimeout(500);
      expect(await page.url()).toMatch(/articles|docs|pages/);
    }
  });
});