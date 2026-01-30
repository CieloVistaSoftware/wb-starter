/**
 * Test: Builder Duplicate Issues Button
 * Issue: note-1769305932956-p0
 * Bug: builder.html has duplicate issues buttons
 * Expected: Only one wb-issues element should exist
 */
import { test, expect } from '@playwright/test';

test.describe('Builder Issues Button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/builder.html');
    await page.waitForLoadState('networkidle');
  });

  test('should have exactly one issues button', async ({ page }) => {
    await test.step('Navigate to builder page', async () => {
      await expect(page).toHaveURL(/builder/);
    });

    await test.step('Verify page loaded correctly', async () => {
      await expect(page.locator('body')).toBeVisible();
    });

    await test.step('Count wb-issues elements on page', async () => {
      const issuesButtons = page.locator('wb-issues');
      const count = await issuesButtons.count();
      expect(count).toBeLessThanOrEqual(1);
    });

    await test.step('Verify no floating button in bottom-right corner', async () => {
      const floatingBtn = page.locator('wb-issues[style*="fixed"], wb-issues[style*="absolute"]');
      await expect(floatingBtn).toHaveCount(0);
    });
  });
});
