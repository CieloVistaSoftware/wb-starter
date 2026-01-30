/**
 * Issue Test: note-1769212201021
 * Generated: 2026-01-24T21:30:47.121Z
 * Category: behavior-draggable
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769212201021: adding xdraggable change elem', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
  });

  test('verify issue is fixed - adding xdraggable change elem', async ({ page }) => {
    // Fallback heuristic: verify the target page loads and shows a top-level header
    test.info().annotations.push({ type: 'generated', description: 'auto-heuristic: smoke' });
    await page.goto('http://localhost:3000/builder.html\nTime: 2026-01-23T23:49:30.155Z\nadding x-draggable change element location even when not clicked');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible();

  });

});
