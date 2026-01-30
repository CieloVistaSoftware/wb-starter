/**
 * Test: Issues Button on Home Page
 * 
 * Verifies that the issues button (🐛) in the navbar opens the issues dialog.
 */
import { test, expect } from '@playwright/test';

test.describe('Home Page Issues Button', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait for site to fully render
    await page.waitForSelector('wb-navbar', { timeout: 10000 });
  });

  test('issues button exists in navbar', async ({ page }) => {
    const issuesBtn = page.locator('#issuesToggle');
    await expect(issuesBtn).toBeVisible({ timeout: 5000 });
    await expect(issuesBtn).toHaveText('🐛');
  });

  test('clicking issues button opens issues dialog', async ({ page }) => {
    // Click the issues button
    const issuesBtn = page.locator('#issuesToggle');
    await expect(issuesBtn).toBeVisible();
    
    // Log console messages for debugging
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('issues')) {
        console.log(`[Browser ${msg.type()}] ${msg.text()}`);
      }
    });

    await issuesBtn.click();
    
    // Wait for the issues dialog to appear
    // The dialog is created dynamically via issues-helper.js
    const issuesDialog = page.locator('.wb-issues-dialog');
    await expect(issuesDialog).toBeVisible({ timeout: 5000 });
  });

  test('issues dialog has form elements', async ({ page }) => {
    // Open the issues dialog
    await page.locator('#issuesToggle').click();
    
    // Wait for dialog
    const dialog = page.locator('.wb-issues-dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    
    // Check form elements exist
    await expect(dialog.locator('select[name="type"]')).toBeVisible();
    await expect(dialog.locator('select[name="priority"]')).toBeVisible();
    await expect(dialog.locator('textarea[name="description"]')).toBeVisible();
    await expect(dialog.locator('button[type="submit"]')).toBeVisible();
  });

  test('issues dialog can be closed', async ({ page }) => {
    // Open the dialog
    await page.locator('#issuesToggle').click();
    
    const dialog = page.locator('.wb-issues-dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    
    // Close via X button
    await page.locator('.wb-issues-close').click();
    
    // Dialog should be hidden
    await expect(dialog).not.toBeVisible({ timeout: 2000 });
  });

  test('issues dialog can be closed with Escape key', async ({ page }) => {
    // Open the dialog
    await page.locator('#issuesToggle').click();
    
    const dialog = page.locator('.wb-issues-dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // Dialog should be hidden
    await expect(dialog).not.toBeVisible({ timeout: 2000 });
  });

  test('issues dialog captures current page URL', async ({ page }) => {
    // Open the dialog
    await page.locator('#issuesToggle').click();
    
    const dialog = page.locator('.wb-issues-dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    
    // Check that page input has value
    const pageInput = page.locator('input[name="page"]');
    const pageValue = await pageInput.inputValue();
    expect(pageValue).toBeTruthy();
  });

  test('issues dialog captures timestamp', async ({ page }) => {
    // Open the dialog
    await page.locator('#issuesToggle').click();
    
    const dialog = page.locator('.wb-issues-dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    
    // Check that timestamp input has ISO date value
    const timestampInput = page.locator('input[name="timestamp"]');
    const timestampValue = await timestampInput.inputValue();
    expect(timestampValue).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format
  });

});
