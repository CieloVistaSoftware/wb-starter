import { test, expect } from '@playwright/test';

test.describe('Doc Viewer Compliance', () => {
  test('should load without errors', async ({ page }) => {
    await page.goto('/public/viewers/doc-viewer.html');
    
    // Should have the doc-viewer body
    await expect(page.locator('#doc-viewer-body')).toBeVisible();
    
    // Should have content container
    await expect(page.locator('#content')).toBeVisible();
  });

  test('should load default documentation', async ({ page }) => {
    await page.goto('/public/viewers/doc-viewer.html');
    
    // Wait for mdhtml to load
    await page.waitForFunction(() => {
      const content = document.getElementById('content');
      return content && !content.querySelector('#loading-message');
    }, { timeout: 10000 });
    
    // Content should have loaded (either success or error)
    const content = page.locator('#content');
    await expect(content).not.toContainText('Loading documentation...');
  });

  test('should load specific file via query param', async ({ page }) => {
    await page.goto('/public/viewers/doc-viewer.html?file=/docs/architecture.md');
    
    // Wait for content to load
    await page.waitForFunction(() => {
      const content = document.getElementById('content');
      return content && content.textContent && content.textContent.length > 100;
    }, { timeout: 10000 });
    
    // Should have architecture content
    const content = page.locator('#content');
    const text = await content.textContent();
    expect(text?.length).toBeGreaterThan(100);
  });

  test('should not have auto-refresh behavior', async ({ page }) => {
    // Track page reloads
    let reloadCount = 0;
    page.on('load', () => reloadCount++);
    
    await page.goto('/public/viewers/doc-viewer.html');
    
    // Wait for initial load
    await page.waitForLoadState('networkidle');
    
    // Wait 5 seconds and verify no additional reloads
    await page.waitForTimeout(5000);
    
    expect(reloadCount).toBe(1); // Only initial load
  });

  test('should hide close button when not opened via script', async ({ page }) => {
    await page.goto('/public/viewers/doc-viewer.html');
    
    // Close button should be hidden (no window.opener)
    const closeBtn = page.locator('#close-button');
    await expect(closeBtn).toHaveCSS('display', 'none');
  });

  test('should apply syntax highlighting to code blocks', async ({ page }) => {
    await page.goto('/public/viewers/doc-viewer.html?file=/docs/architecture.md');
    
    // Wait for content
    await page.waitForFunction(() => {
      const content = document.getElementById('content');
      return content && content.querySelector('pre code');
    }, { timeout: 15000 });
    
    // Code blocks should have hljs class after highlighting
    const codeBlock = page.locator('pre code').first();
    await expect(codeBlock).toHaveClass(/language-/);
  });
});
