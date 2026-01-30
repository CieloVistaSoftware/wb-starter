/**
 * Test: Issues Button - Home Page Fix (2026-01-25)
 * 
 * Issue: Clicking issues button (🐛) on home page did nothing
 * Root Cause: issues-helper.js used WB.scan() which does lazy loading,
 *             but dynamically created elements not in viewport never got initialized
 * Fix: Changed to WB.inject() for direct injection
 */
import { test, expect } from '@playwright/test';

test.describe('Issues Button Fix', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait for WB framework to initialize
    await page.waitForFunction(() => window.WB !== undefined, { timeout: 10000 });
  });

  test('issues button opens dialog when clicked', async ({ page }) => {
    // Click the issues button
    const issuesBtn = page.locator('#issuesToggle');
    await expect(issuesBtn).toBeVisible({ timeout: 5000 });
    await issuesBtn.click();
    
    // Dialog should appear
    const dialog = page.locator('.wb-issues-dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    
    // Verify it has the form
    await expect(dialog.locator('textarea[name="description"]')).toBeVisible();
  });

  test('issues dialog closes on X button', async ({ page }) => {
    // Open
    await page.locator('#issuesToggle').click();
    const dialog = page.locator('.wb-issues-dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    
    // Close
    await page.locator('.wb-issues-close').click();
    await expect(dialog).not.toBeVisible({ timeout: 2000 });
  });

  test('issues dialog closes on Escape', async ({ page }) => {
    // Open
    await page.locator('#issuesToggle').click();
    const dialog = page.locator('.wb-issues-dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    
    // Press Escape
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 2000 });
  });

});
