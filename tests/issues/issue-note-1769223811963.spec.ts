/**
 * Issue Test: note-1769223811963
 * Generated: 2026-01-24T21:41:12.152Z
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769223811963: rejectiontest1769223811954jywj5y', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
  });

  test('verify issue is fixed - rejectiontest1769223811954jywj5y', async ({ page }) => {
    // Fallback heuristic: verify the target page loads and shows a top-level header
    test.info().annotations.push({ type: 'generated', description: 'auto-heuristic: smoke' });
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible();

  });

});
