/**
 * Card Image Rendering Test
 * Tests that wb-cardimage actually displays images
 */
import { test, expect } from '@playwright/test';

test.describe('Card Image Rendering', () => {
  test('wb-cardimage should display images on cards-showcase', async ({ page }) => {
    await page.goto('/demos/cards-showcase.html');
    await page.waitForTimeout(2000);
    
    // Find the cardimage section
    const cardimageSection = page.locator('#cardimage');
    await expect(cardimageSection).toBeVisible();
    
    // Find all wb-cardimage elements
    const cardImages = page.locator('wb-cardimage');
    const count = await cardImages.count();
    console.log(`Found ${count} wb-cardimage elements`);
    
    expect(count).toBeGreaterThan(0);
    
    // Check each cardimage has an actual <img> inside
    for (let i = 0; i < count; i++) {
      const card = cardImages.nth(i);
      const img = card.locator('img');
      
      // Should have an img element
      const imgCount = await img.count();
      console.log(`Card ${i}: found ${imgCount} img elements`);
      
      if (imgCount === 0) {
        // Dump the card's HTML for debugging
        const html = await card.innerHTML();
        console.log(`Card ${i} innerHTML:`, html.substring(0, 500));
      }
      
      expect(imgCount, `wb-cardimage ${i} should contain an <img> element`).toBeGreaterThan(0);
      
      // Check img has a src
      const src = await img.first().getAttribute('src');
      console.log(`Card ${i} img src:`, src);
      expect(src, `wb-cardimage ${i} img should have a src`).toBeTruthy();
    }
  });

  test('wb-cardimage should have 1rem padding', async ({ page }) => {
    await page.goto('/demos/cards-showcase.html');
    await page.waitForTimeout(2000);
    
    const cardImages = page.locator('wb-cardimage');
    const count = await cardImages.count();
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const card = cardImages.nth(i);
      
      // Check if card itself or its content containers have padding
      const hasPadding = await card.evaluate(el => {
        const computed = getComputedStyle(el);
        const cardPadding = parseFloat(computed.paddingLeft);
        
        // Check card itself
        if (cardPadding >= 16) return true;
        
        // Check main content area
        const main = el.querySelector('.wb-card__main, main');
        if (main) {
          const mainPadding = parseFloat(getComputedStyle(main).paddingLeft);
          if (mainPadding >= 16) return true;
        }
        
        // Check header
        const header = el.querySelector('.wb-card__header, header');
        if (header) {
          const headerPadding = parseFloat(getComputedStyle(header).paddingLeft);
          if (headerPadding >= 16) return true;
        }
        
        return false;
      });
      
      expect(hasPadding, `wb-cardimage ${i} should have proper padding`).toBe(true);
    }
  });
});
