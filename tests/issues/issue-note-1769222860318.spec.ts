/**
 * Issue Test: note-1769222860318
 * Generated: 2026-01-24T21:30:47.101Z
 * Category: general
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769222860318: Test issue from header 1769222', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
  });

  test('verify issue is fixed - Test issue from header 1769222', async ({ page }) => {
    // Fallback heuristic: verify the target page loads and shows a top-level header
    test.info().annotations.push({ type: 'generated', description: 'auto-heuristic: smoke' });
    await page.goto('http://localhost:3000/\nTime: 2026-01-24T02:47:39.500Z\nTest issue from header 1769222859872');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible();

  });

});
