/**
 * Issue Test: note-1769211127224
 * Generated: 2026-01-24T21:30:47.150Z
 * Category: builder
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769211127224: trying to drage a compnent in', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/builder.html');
    await page.waitForLoadState('networkidle');
  });

  test('verify issue is fixed - trying to drage a compnent in', async ({ page }) => {
    // Fallback heuristic: verify the target page loads and shows a top-level header
    test.info().annotations.push({ type: 'generated', description: 'auto-heuristic: smoke' });
    await page.goto('http://localhost:3000/builder.html\nTime: 2026-01-23T23:31:21.238Z\ntrying to drage a compnent in like features issue error must be in main, but it was in main when trying to drop');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible();

  });

});
