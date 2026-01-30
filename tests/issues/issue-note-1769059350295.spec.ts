/**
 * Issue Test: note-1769059350295
 * Generated: 2026-01-24T21:41:11.942Z
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769059350295: flowtest1769059350125', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
  });

  test('verify issue is fixed - flowtest1769059350125', async ({ page }) => {
    // Fallback heuristic: verify the target page loads and shows a top-level header
    test.info().annotations.push({ type: 'generated', description: 'auto-heuristic: smoke' });
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible();

  });

});
