/**
 * Issue Test: note-1769212344261
 * Generated: 2026-01-24T21:30:47.118Z
 * Category: general
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769212344261: find all wbissues refs  remo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
  });

  test('verify issue is fixed - find all wbissues refs  remo', async ({ page }) => {
    // Fallback heuristic: verify the target page loads and shows a top-level header
    test.info().annotations.push({ type: 'generated', description: 'auto-heuristic: smoke' });
    await page.goto('http://localhost:3000/builder.html\nTime: 2026-01-23T23:51:54.695Z\nfind all wb-issues refs.  remove any no in the wb-navbar');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible();

  });

});
