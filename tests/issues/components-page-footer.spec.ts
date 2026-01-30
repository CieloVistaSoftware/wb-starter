/**
 * Test: Components Page Footer
 * Issue: note-1769305982098-p0
 * Bug: Components page header/footer card only shows header section
 * Expected: Card should show both header and footer sections
 */
import { test, expect } from '@playwright/test';

test.describe('Components Page Footer Card', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/pages/components.html');
    await page.waitForLoadState('networkidle');
  });

  test('header/footer card should show both sections', async ({ page }) => {
    await test.step('Navigate to components page', async () => {
      await expect(page).toHaveURL(/components/);
    });

    await test.step('Find header/footer category card', async () => {
      const card = page.locator('[data-category="header-footer"], .category-card:has-text("Header"), .category-card:has-text("Footer")').first();
      await expect(card).toBeVisible();
    });

    await test.step('Verify header section is displayed', async () => {
      const headerRef = page.locator('text=/header/i').first();
      await expect(headerRef).toBeVisible();
    });

    await test.step('Verify footer section is displayed', async () => {
      const footerRef = page.locator('text=/footer/i').first();
      await expect(footerRef).toBeVisible();
    });
  });
});
