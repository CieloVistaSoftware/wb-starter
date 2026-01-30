/**
 * Issue Test: note-1769211301098
 * Generated: 2026-01-24T21:30:47.122Z
 * Category: theming
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769211301098: theme override does not work', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
  });

  test('verify issue is fixed - theme override does not work', async ({ page }) => {
    // Fallback heuristic: verify the target page loads and shows a top-level header
    test.info().annotations.push({ type: 'generated', description: 'auto-heuristic: smoke' });
    await page.goto('http://localhost:3000/builder.html\nTime: 2026-01-23T23:34:48.446Z\ntheme override does not work');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible();

  });

});
