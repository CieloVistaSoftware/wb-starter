/**
 * Card Image Rendering Test
 * =========================
 * Verifies x-cardimage actually displays images
 */

import { test, expect } from '@playwright/test';

test.describe('x-cardimage Rendering', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/cards-showcase.html');
    await page.waitForTimeout(1500);
  });

  test('x-cardimage should have img elements', async ({ page }) => {
    // Find all cardimage elements
    const cardImages = await page.locator('x-cardimage').all();
    expect(cardImages.length).toBeGreaterThan(0);
    
    console.log(`Found ${cardImages.length} x-cardimage elements`);
    
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

  test('x-cardimage should have title rendered', async ({ page }) => {
    // Find Mountain Vista card
    const mountainCard = page.locator('x-cardimage[title="Mountain Vista"]');
    await expect(mountainCard).toBeVisible();
    
    // Should have title text
    const title = mountainCard.locator('.x-card__title, h3');
    const titleText = await title.textContent();
    expect(titleText).toContain('Mountain Vista');
  });

  test('x-cardimage with aspect ratio', async ({ page }) => {
    const cards = await page.locator('x-cardimage').all();
    
    for (const card of cards) {
      const figure = card.locator('figure, .x-card__figure');
      const figureCount = await figure.count();
      
      if (figureCount > 0) {
        const aspectRatio = await figure.first().evaluate(el => {
          return window.getComputedStyle(el).aspectRatio;
        });
        console.log(`Figure aspect-ratio: ${aspectRatio}`);
      }
    }
  });

  test('x-cardvideo should have video elements', async ({ page }) => {
    const cardVideos = await page.locator('x-cardvideo').all();
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
    
    // Check x-cardimage
    const cardImages = await page.locator('x-cardimage').all();
    for (let i = 0; i < cardImages.length; i++) {
      const imgCount = await cardImages[i].locator('img').count();
      if (imgCount === 0) {
        issues.push(`x-cardimage #${i} has no img element`);
      }
    }
    
    // Check x-cardproduct (should have product images)
    const productCards = await page.locator('x-cardproduct').all();
    for (let i = 0; i < productCards.length; i++) {
      const imgCount = await productCards[i].locator('img').count();
      if (imgCount === 0) {
        issues.push(`x-cardproduct #${i} has no img element`);
      }
    }
    
    // Check x-cardprofile (should have avatars)
    const profileCards = await page.locator('x-cardprofile').all();
    for (let i = 0; i < profileCards.length; i++) {
      const imgCount = await profileCards[i].locator('img').count();
      if (imgCount === 0) {
        issues.push(`x-cardprofile #${i} has no avatar img`);
      }
    }
    
    // Check x-cardtestimonial (optional avatars)
    const testimonialCards = await page.locator('x-cardtestimonial').all();
    for (let i = 0; i < testimonialCards.length; i++) {
      const hasAvatar = await testimonialCards[i].getAttribute('avatar');
      if (hasAvatar) {
        const imgCount = await testimonialCards[i].locator('img').count();
        if (imgCount === 0) {
          issues.push(`x-cardtestimonial #${i} has avatar attr but no img element`);
        }
      }
    }
    
    // Check x-cardhorizontal
    const horizCards = await page.locator('x-cardhorizontal').all();
    for (let i = 0; i < horizCards.length; i++) {
      const hasImage = await horizCards[i].getAttribute('image');
      if (hasImage) {
        const imgCount = await horizCards[i].locator('img').count();
        if (imgCount === 0) {
          issues.push(`x-cardhorizontal #${i} has image attr but no img element`);
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
