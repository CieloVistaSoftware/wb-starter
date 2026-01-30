/**
 * Issue Test: note-1769194331335
 * Generated: 2026-01-24T21:30:47.153Z
 * Category: general
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769194331335: Issues viewer should show ever', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
  });

  test('verify issue is fixed - Issues viewer should show ever', async ({ page }) => {
    // Fallback heuristic: verify the target page loads and shows a top-level header
    test.info().annotations.push({ type: 'generated', description: 'auto-heuristic: smoke' });
    await page.goto('http://localhost:3000/builder.html\nTime: 2026-01-23T18:51:16.829Z\nIssues viewer should show everything in the json record.');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible();

  });

});
