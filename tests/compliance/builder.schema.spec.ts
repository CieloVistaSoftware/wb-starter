import { test, expect } from '@playwright/test';

/**
 * Builder Schema Compliance Tests
 * 
 * Note: Main builder tests are in tests/behaviors/ui/:
 * - builder-permutations.spec.ts: Component library and canvas tests
 * - builder-api.spec.ts: Global functions tests
 * - builder-sidebar.spec.ts: Drawer panel tests
 * 
 * This file contains additional schema-related compliance checks.
 */

test.describe('Builder Page Schema Compliance', () => {
  
  test('builder.html should be valid HTML', async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(300);
    
    // Check basic HTML structure
    const hasDoctype = await page.evaluate(() => {
      return document.doctype !== null;
    });
    expect(hasDoctype).toBe(true);
    
    const hasHtml = await page.evaluate(() => {
      return document.documentElement.tagName === 'HTML';
    });
    expect(hasHtml).toBe(true);
  });
  
  test('builder should have proper semantic structure', async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForTimeout(300);
    
    // Should have title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    
    // Should have main heading
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
  });
  
  test('builder should have meta viewport', async ({ page }) => {
    await page.goto('/builder.html');
    
    const hasViewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta !== null;
    });
    
    expect(hasViewport).toBe(true);
  });
  
  test('builder should load required stylesheets', async ({ page }) => {
    const responses: string[] = [];
    
    page.on('response', response => {
      if (response.url().endsWith('.css') && response.status() === 200) {
        responses.push(response.url());
      }
    });
    
    await page.goto('/builder.html');
    await page.waitForTimeout(500);
    
    // Should have loaded at least some CSS files
    expect(responses.length).toBeGreaterThan(0);
  });
});
