/**
 * Test: Issues Button on Home Page
 * 
 * Issue: Clicking issues button on home page does nothing
 * Expected: Should open the issues dialog
 */
import { test, expect } from '@playwright/test';

test.describe('Issues Button - Home Page', () => {
  
  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('issues') || msg.text().includes('Issues')) {
        console.log(`[Browser ${msg.type()}] ${msg.text()}`);
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait for WB framework to initialize
    await page.waitForFunction(() => window.WB !== undefined, { timeout: 10000 });
  });

  test('issues button exists in navbar', async ({ page }) => {
    const issuesBtn = page.locator('#issuesToggle');
    await expect(issuesBtn).toBeVisible({ timeout: 5000 });
    
    // Verify it has the bug emoji
    await expect(issuesBtn).toContainText('🐛');
  });

  test('issues button has click handler attached', async ({ page }) => {
    const hasHandler = await page.evaluate(() => {
      const btn = document.getElementById('issuesToggle');
      if (!btn) return { found: false };
      
      // Check if onclick is set
      return {
        found: true,
        hasOnclick: typeof btn.onclick === 'function',
        hasEventListeners: true // Can't directly check, assume true if button exists
      };
    });
    
    expect(hasHandler.found).toBe(true);
    expect(hasHandler.hasOnclick).toBe(true);
  });

  test('clicking issues button opens issues dialog', async ({ page }) => {
    // Click the issues button
    const issuesBtn = page.locator('#issuesToggle');
    await issuesBtn.click();
    
    // Wait for issues dialog to appear
    const dialog = page.locator('.wb-issues-dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    
    // Verify dialog has expected content
    await expect(dialog.locator('.wb-issues-title')).toContainText('Report Issue');
  });

  test('issues dialog can be closed', async ({ page }) => {
    // Open
    await page.locator('#issuesToggle').click();
    const dialog = page.locator('.wb-issues-dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    
    // Close via close button
    await page.locator('.wb-issues-close').click();
    await expect(dialog).not.toBeVisible({ timeout: 2000 });
  });

  test('issues dialog form has required fields', async ({ page }) => {
    await page.locator('#issuesToggle').click();
    
    const dialog = page.locator('.wb-issues-dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    
    // Check form fields exist
    await expect(dialog.locator('select[name="type"]')).toBeVisible();
    await expect(dialog.locator('select[name="priority"]')).toBeVisible();
    await expect(dialog.locator('textarea[name="description"]')).toBeVisible();
    await expect(dialog.locator('button[type="submit"]')).toBeVisible();
  });

  test('debug: trace issues button click', async ({ page }) => {
    // This test helps debug what happens when button is clicked
    
    const result = await page.evaluate(async () => {
      const btn = document.getElementById('issuesToggle');
      if (!btn) return { error: 'Button not found' };
      
      const debugInfo = {
        buttonFound: true,
        buttonId: btn.id,
        buttonText: btn.textContent,
        hasOnclick: typeof btn.onclick === 'function',
        parentElement: btn.parentElement?.className
      };
      
      // Check if wb-issues element exists before click
      debugInfo.issuesElementBeforeClick = !!document.querySelector('wb-issues');
      
      // Try to manually trigger the onclick
      if (btn.onclick) {
        try {
          await btn.onclick();
          debugInfo.onclickExecuted = true;
        } catch (e) {
          debugInfo.onclickError = e.message;
        }
      }
      
      // Wait a bit for async operations
      await new Promise(r => setTimeout(r, 500));
      
      // Check after click
      const issuesEl = document.querySelector('wb-issues');
      debugInfo.issuesElementAfterClick = !!issuesEl;
      
      if (issuesEl) {
        debugInfo.issuesElementId = issuesEl.id;
        debugInfo.hasOpenMethod = typeof issuesEl.open === 'function';
        debugInfo.dialogVisible = issuesEl.querySelector('.wb-issues-dialog')?.style.display !== 'none';
      }
      
      return debugInfo;
    });
    
    console.log('Debug info:', JSON.stringify(result, null, 2));
    
    // The onclick should execute without error
    expect(result.buttonFound).toBe(true);
    expect(result.hasOnclick).toBe(true);
    expect(result.onclickExecuted).toBe(true);
    expect(result.issuesElementAfterClick).toBe(true);
  });

});
