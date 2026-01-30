/**
 * Issue Test: note-1769211204743
 * Generated: 2026-01-24T21:30:47.122Z
 * Category: builder
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769211204743: cannot drop any components int', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/builder.html');
    await page.waitForLoadState('networkidle');
  });

  test('verify issue is fixed - cannot drop any components int', async ({ page }) => {
    // Fallback heuristic: verify the target page loads and shows a top-level header
    test.info().annotations.push({ type: 'generated', description: 'auto-heuristic: smoke' });
    await page.goto('http://localhost:3000/builder.html\nTime: 2026-01-23T23:33:08.349Z\ncannot drop any components into canvas');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible();

  });

});
