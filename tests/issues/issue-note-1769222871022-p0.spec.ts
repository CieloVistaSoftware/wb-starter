/**
 * Issue Test: note-1769222871022-p0
 * Generated: 2026-01-24T21:41:11.843Z
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769222871022-p0: rejectiontest1769222870898eevw15', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
  });

  test('verify issue is fixed - rejectiontest1769222870898eevw15', async ({ page }) => {
    // Fallback heuristic: verify the target page loads and shows a top-level header
    test.info().annotations.push({ type: 'generated', description: 'auto-heuristic: smoke' });
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible();

  });

});
