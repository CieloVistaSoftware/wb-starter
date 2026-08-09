/**
 * Card Image Rendering Test
 * =========================
 * Verifies wb-cardimage actually displays images
 */

import { test, expect } from '@playwright/test';

test.describe('wb-cardimage Rendering', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/cards-showcase.html');
    await page.waitForTimeout(1500);
  });

  test('wb-cardimage should have img elements', async ({ page }) => {
    // Find all cardimage elements
    const cardImages = await page.locator('wb-cardimage').all();
    expect(cardImages.length).toBeGreaterThan(0);
    
    console.log(`Found ${cardImages.length} wb-cardimage elements`);
    
    for (let i = 0; i < cardImages.length; i++) {
      const card = cardImages[i];
      
      // Each cardimage should have an img element
      const img = card.locator('img');
      const imgCount = await img.count();
      
      console.log(`Card ${i}: found ${imgCount} img elements`);
      expect(imgCount).toBeGreaterThan(0);
      
      // Get the src attribute
      const src = await img.first().getAttribute('src');
      console.log(`Card ${i} image src: ${src}`);
      expect(src).toBeTruthy();
      expect(src?.length).toBeGreaterThan(10); // Should be a real URL
    }
  });

  test('wb-cardimage should have title rendered', async ({ page }) => {
    // Find Mountain Vista card
    const mountainCard = page.locator('wb-cardimage[title="Mountain Vista"]');
    await expect(mountainCard).toBeVisible();
    
    // Should have title text
    const title = mountainCard.locator('.wb-card__title, h3');
    const titleText = await title.textContent();
    expect(titleText).toContain('Mountain Vista');
  });

  test('wb-cardimage with aspect ratio', async ({ page }) => {
    const cards = await page.locator('wb-cardimage').all();
    
    for (const card of cards) {
      const figure = card.locator('figure, .wb-card__figure');
      const figureCount = await figure.count();
      
      if (figureCount > 0) {
        const aspectRatio = await figure.first().evaluate(el => {
          return window.getComputedStyle(el).aspectRatio;
        });
        console.log(`Figure aspect-ratio: ${aspectRatio}`);
      }
    }
  });

  test('wb-cardvideo should have video elements', async ({ page }) => {
    const cardVideos = await page.locator('wb-cardvideo').all();
    expect(cardVideos.length).toBeGreaterThan(0);
    
    for (const card of cardVideos) {
      const video = card.locator('video');
      const videoCount = await video.count();
      console.log(`Video card: found ${videoCount} video elements`);
      expect(videoCount).toBeGreaterThan(0);
      
      const src = await video.first().getAttribute('src');
      expect(src).toBeTruthy();
    }
  });

  test('ALL cards with images should render them', async ({ page }) => {
    const issues: string[] = [];
    
    // Check wb-cardimage
    const cardImages = await page.locator('wb-cardimage').all();
    for (let i = 0; i < cardImages.length; i++) {
      const imgCount = await cardImages[i].locator('img').count();
      if (imgCount === 0) {
        issues.push(`wb-cardimage #${i} has no img element`);
      }
    }
    
    // Check wb-cardproduct (should have product images)
    const productCards = await page.locator('wb-cardproduct').all();
    for (let i = 0; i < productCards.length; i++) {
      const imgCount = await productCards[i].locator('img').count();
      if (imgCount === 0) {
        issues.push(`wb-cardproduct #${i} has no img element`);
      }
    }
    
    // Check wb-cardprofile (should have avatars)
    const profileCards = await page.locator('wb-cardprofile').all();
    for (let i = 0; i < profileCards.length; i++) {
      const imgCount = await profileCards[i].locator('img').count();
      if (imgCount === 0) {
        issues.push(`wb-cardprofile #${i} has no avatar img`);
      }
    }
    
    // Check wb-cardtestimonial (optional avatars)
    const testimonialCards = await page.locator('wb-cardtestimonial').all();
    for (let i = 0; i < testimonialCards.length; i++) {
      const hasAvatar = await testimonialCards[i].getAttribute('avatar');
      if (hasAvatar) {
        const imgCount = await testimonialCards[i].locator('img').count();
        if (imgCount === 0) {
          issues.push(`wb-cardtestimonial #${i} has avatar attr but no img element`);
        }
      }
    }
    
    // Check wb-cardhorizontal
    const horizCards = await page.locator('wb-cardhorizontal').all();
    for (let i = 0; i < horizCards.length; i++) {
      const hasImage = await horizCards[i].getAttribute('image');
      if (hasImage) {
        const imgCount = await horizCards[i].locator('img').count();
        if (imgCount === 0) {
          issues.push(`wb-cardhorizontal #${i} has image attr but no img element`);
        }
      }
    }
    
    if (issues.length > 0) {
      console.error('Image rendering issues:');
      issues.forEach(issue => console.error(`  - ${issue}`));
    }
    
    expect(issues).toHaveLength(0);
  });
});
