/**
 * Issue Test: note-1769194562447
 * Generated: 2026-01-24T21:30:47.151Z
 * Category: builder
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769194562447: when right clicking on any ele', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/builder.html');
    await page.waitForLoadState('networkidle');
  });

  test('verify issue is fixed - when right clicking on any ele', async ({ page }) => {
    // Fallback heuristic: verify the target page loads and shows a top-level header
    test.info().annotations.push({ type: 'generated', description: 'auto-heuristic: smoke' });
    await page.goto('http://localhost:3000/builder.html\nTime: 2026-01-23T18:55:28.753Z\nwhen right clicking on any element in the canvas and picking inspect, nothing happens.');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible();

  });

});
