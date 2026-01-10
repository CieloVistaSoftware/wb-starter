/**
 * SCHEMA BUILDER INTEGRATION TESTS
 * ================================
 * Verifies that <wb-*> tags are processed correctly through the schema builder.
 */

import { test, expect } from '@playwright/test';

test.describe('Schema Builder Integration', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/schema-builder-test.html');
    // Wait for WB to initialize
    await page.waitForFunction(() => window.WB?.version, { timeout: 5000 });
    // Give schema builder time to process
    await page.waitForTimeout(300);
  });
  
  test('schemas are loaded', async ({ page }) => {
    const schemaCount = await page.evaluate(() => window.WB.schema.registry.size);
    expect(schemaCount).toBeGreaterThan(50);
  });
  
  test('wb-card renders with correct structure', async ({ page }) => {
    const card = page.locator('.test-section:nth-of-type(1) wb-card');
    
    // Should have base class
    await expect(card).toHaveClass(/wb-card/);
    
    // Should have header with title
    const header = card.locator('.wb-card__header');
    await expect(header).toBeVisible();
    
    const title = card.locator('.wb-card__title');
    await expect(title).toHaveText('Hello World');
    
    // Should have main content
    const main = card.locator('.wb-card__main');
    await expect(main).toBeVisible();
  });
  
  test('wb-card applies variant class', async ({ page }) => {
    const card = page.locator('.test-section:nth-of-type(2) wb-card');
    await expect(card).toHaveClass(/wb-card--glass/);
  });
  
  test('wb-card renders subtitle when provided', async ({ page }) => {
    const card = page.locator('.test-section:nth-of-type(3) wb-card');
    
    const title = card.locator('.wb-card__title');
    await expect(title).toHaveText('Main Title');
    
    const subtitle = card.locator('.wb-card__subtitle');
    await expect(subtitle).toHaveText('Subtitle here');
  });
  
  test('wb-alert renders with variant', async ({ page }) => {
    const alert = page.locator('.test-section:nth-of-type(4) wb-alert');
    
    await expect(alert).toHaveClass(/wb-alert/);
    await expect(alert).toHaveClass(/wb-alert--success/);
  });
  
  test('wb-badge renders with variants', async ({ page }) => {
    const badges = page.locator('.test-section:nth-of-type(5) wb-badge');
    
    await expect(badges.nth(0)).toHaveClass(/wb-badge--info/);
    await expect(badges.nth(1)).toHaveClass(/wb-badge--success/);
    await expect(badges.nth(2)).toHaveClass(/wb-badge--warning/);
  });
  
  test('wb-button renders with variant', async ({ page }) => {
    const buttons = page.locator('.test-section:nth-of-type(6) wb-button');
    
    await expect(buttons.nth(0)).toHaveClass(/wb-button--primary/);
  });
  
  test('$methods are bound to element', async ({ page }) => {
    const hasMethods = await page.evaluate(() => {
      const card = document.getElementById('method-test-card');
      return typeof card?.show === 'function' &&
             typeof card?.hide === 'function' &&
             typeof card?.toggle === 'function';
    });
    
    expect(hasMethods).toBe(true);
  });
  
  test('hide() method works', async ({ page }) => {
    const card = page.locator('#method-test-card');
    
    // Initially visible
    await expect(card).toBeVisible();
    
    // Call hide
    await page.evaluate(() => {
      document.getElementById('method-test-card').hide();
    });
    
    // Should be hidden
    await expect(card).toBeHidden();
  });
  
  test('show() method works', async ({ page }) => {
    const card = page.locator('#method-test-card');
    
    // Hide first
    await page.evaluate(() => {
      document.getElementById('method-test-card').hide();
    });
    await expect(card).toBeHidden();
    
    // Call show
    await page.evaluate(() => {
      document.getElementById('method-test-card').show();
    });
    
    // Should be visible again
    await expect(card).toBeVisible();
  });
  
  test('toggle() method works', async ({ page }) => {
    const card = page.locator('#method-test-card');
    
    // Initially visible
    await expect(card).toBeVisible();
    
    // Toggle to hide
    await page.evaluate(() => {
      document.getElementById('method-test-card').toggle();
    });
    await expect(card).toBeHidden();
    
    // Toggle to show
    await page.evaluate(() => {
      document.getElementById('method-test-card').toggle();
    });
    await expect(card).toBeVisible();
  });
  
});
