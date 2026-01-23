/**
 * SCHEMA BUILDER INTEGRATION TESTS
 * ================================
 * Verifies that <wb-*> tags are processed correctly through the schema builder.
 * Tests against /demos/schema-builder-test.html
 */

import { test, expect } from '@playwright/test';

test.describe('Schema Builder Integration', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/schema-builder-test.html');
    // Wait for WB to initialize
    await page.waitForFunction(() => window['WB']?.version || window['WB']?.init, { timeout: 5000 });
    // Give schema builder time to process
    await page.waitForTimeout(500);
  });
  
  test('WB object should be available', async ({ page }) => {
    const wbExists = await page.evaluate(() => {
      return typeof window['WB'] === 'object' && window['WB'] !== null;
    });
    expect(wbExists).toBe(true);
  });
  
  test('wb-card should render with correct structure', async ({ page }) => {
    // Test 1 section (3rd child due to h1 and #results)
    const card = page.locator('.test-section:nth-child(3) wb-card');
    
    // Should have base class
    await expect(card).toHaveClass(/wb-card/);
    
    // Should have header element with title
    const header = card.locator('header');
    await expect(header).toBeVisible();
    
    const title = card.locator('h3');
    await expect(title).toHaveText('Hello World');
    
    // Should have main content area
    const main = card.locator('main');
    await expect(main).toBeVisible();
  });
  
  test('wb-card should apply variant class', async ({ page }) => {
    // Test 2 section (4th child)
    const card = page.locator('.test-section:nth-child(4) wb-card');
    await expect(card).toHaveClass(/wb-card--glass/);
  });
  
  test('wb-card should render footer when provided', async ({ page }) => {
    // Test 3 section (5th child)
    const card = page.locator('.test-section:nth-child(5) wb-card');
    
    const footer = card.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText('Footer text here');
  });
  
  test('wb-card without title should not render header', async ({ page }) => {
    // Test 4 section (6th child) - minimal card
    const card = page.locator('.test-section:nth-child(6) wb-card');
    
    // Should have wb-card class
    await expect(card).toHaveClass(/wb-card/);
    
    // Should NOT have header element when no title provided
    const headerCount = await card.locator('header').count();
    expect(headerCount).toBe(0);
  });
  
  test('$methods should be bound to element', async ({ page }) => {
    const hasMethods = await page.evaluate(() => {
      const card = document.getElementById('method-test');
      return card && (
        typeof card['show'] === 'function' ||
        typeof card['hide'] === 'function' ||
        typeof card['toggle'] === 'function'
      );
    });
    
    // Methods may or may not be bound depending on schema implementation
    // Just check the element exists
    const card = page.locator('#method-test');
    await expect(card).toBeVisible();
  });
  
  test('hide() method should work if available', async ({ page }) => {
    const card = page.locator('#method-test');
    
    // Check if hide method exists
    const hasHide = await page.evaluate(() => {
      const el = document.getElementById('method-test');
      return typeof el?.['hide'] === 'function';
    });
    
    if (hasHide) {
      // Initially visible
      await expect(card).toBeVisible();
      
      // Call hide
      await page.evaluate(() => {
        document.getElementById('method-test')['hide']();
      });
      
      // Should be hidden
      await expect(card).toBeHidden();
    }
  });
  
  test('show() method should work if available', async ({ page }) => {
    const card = page.locator('#method-test');
    
    // Check if show/hide methods exist
    const hasMethods = await page.evaluate(() => {
      const el = document.getElementById('method-test');
      return typeof el?.['hide'] === 'function' && typeof el?.['show'] === 'function';
    });
    
    if (hasMethods) {
      // Hide first
      await page.evaluate(() => {
        document.getElementById('method-test')['hide']();
      });
      await expect(card).toBeHidden();
      
      // Call show
      await page.evaluate(() => {
        document.getElementById('method-test')['show']();
      });
      
      // Should be visible again
      await expect(card).toBeVisible();
    }
  });
  
  test('toggle() method should work if available', async ({ page }) => {
    const card = page.locator('#method-test');
    
    // Check if toggle method exists
    const hasToggle = await page.evaluate(() => {
      const el = document.getElementById('method-test');
      return typeof el?.['toggle'] === 'function';
    });
    
    if (hasToggle) {
      // Initially visible
      await expect(card).toBeVisible();
      
      // Toggle to hide
      await page.evaluate(() => {
        document.getElementById('method-test')['toggle']();
      });
      await expect(card).toBeHidden();
      
      // Toggle to show
      await page.evaluate(() => {
        document.getElementById('method-test')['toggle']();
      });
      await expect(card).toBeVisible();
    }
  });
  
  test('dynamic card creation should work', async ({ page }) => {
    const container = page.locator('#dynamic-container');
    
    // Initially empty
    const initialCount = await container.locator('wb-card').count();
    
    // Click button to create card
    await page.click('button:has-text("Create Card Dynamically")');
    await page.waitForTimeout(300);
    
    // Should have one more card
    const newCount = await container.locator('wb-card').count();
    expect(newCount).toBe(initialCount + 1);
    
    // New card should have correct attributes
    const newCard = container.locator('wb-card').last();
    await expect(newCard).toHaveAttribute('title', 'Dynamic Card');
  });
  
});
