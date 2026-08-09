import { test, expect } from '@playwright/test';

/**
 * Image Card Sizing — REGRESSION TEST
 *
 * Ensures image and video cards render at reasonable sizes.
 * Issue: Image cards rendering as tiny vertical slivers, nearly invisible,
 * with huge empty whitespace.
 */

test.describe('Image Card Sizing', () => {
  test('image cards render at reasonable width', async ({ page }) => {
    await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });

    const imageCards = page.locator('wb-cardimage');
    const cardCount = await imageCards.count();

    expect(cardCount, 'Page should have image cards').toBeGreaterThan(0);

    const violations: string[] = [];

    for (let i = 0; i < Math.min(cardCount, 5); i++) {
      const card = imageCards.nth(i);
      const isVisible = await card.isVisible();

      if (!isVisible) continue;

      const box = await card.boundingBox();
      expect(box, `Image card ${i} should have bounding box`).toBeTruthy();

      if (box) {
        // Image cards should be at least 150px wide (not tiny slivers)
        expect(box.width, `Image card ${i} is only ${box.width}px wide, should be >= 150px`).toBeGreaterThanOrEqual(150);

        // Image cards should be at least 100px tall
        expect(box.height, `Image card ${i} is only ${box.height}px tall, should be >= 100px`).toBeGreaterThanOrEqual(100);

        // Aspect ratio should be reasonable (not extremely tall or wide)
        const aspectRatio = box.width / box.height;
        expect(aspectRatio, `Image card ${i} has aspect ${aspectRatio.toFixed(2)}, should be 0.4-2.5`).toBeGreaterThan(0.4);
        expect(aspectRatio, `Image card ${i} has aspect ${aspectRatio.toFixed(2)}, should be 0.4-2.5`).toBeLessThan(2.5);
      }
    }
  });

  test('video cards render at reasonable width', async ({ page }) => {
    await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });

    const videoCards = page.locator('wb-cardvideo');
    const cardCount = await videoCards.count();

    if (cardCount === 0) {
      // Skip if no video cards on this page
      return;
    }

    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      const card = videoCards.nth(i);
      const isVisible = await card.isVisible();

      if (!isVisible) continue;

      const box = await card.boundingBox();

      if (box) {
        // Video cards should not be tiny
        expect(box.width, `Video card ${i} is ${box.width}px wide, should be >= 150px`).toBeGreaterThanOrEqual(150);
        expect(box.height, `Video card ${i} is ${box.height}px tall, should be >= 100px`).toBeGreaterThanOrEqual(100);
      }
    }
  });

  test('card grid layout is not broken with huge gaps', async ({ page }) => {
    await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });

    // Find card containers/grids
    const cardSections = page.locator('section');
    const sectionCount = await cardSections.count();

    expect(sectionCount, 'Page should have sections').toBeGreaterThan(0);

    for (let i = 0; i < Math.min(sectionCount, 5); i++) {
      const section = cardSections.nth(i);
      const sectionBox = await section.boundingBox();

      if (!sectionBox) continue;

      // Section should not have excessive height for its width (indicating broken layout)
      const heightToWidthRatio = sectionBox.height / sectionBox.width;

      // For a multi-card section, height:width ratio should be reasonable
      // (If it's extremely tall and narrow, cards are stacking weirdly or broken)
      expect(heightToWidthRatio, `Section ${i} height:width is ${heightToWidthRatio.toFixed(2)}, may indicate layout breakage`).toBeLessThan(5);
    }
  });

  test('card images are actually loaded and visible', async ({ page }) => {
    await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });

    const images = page.locator('wb-cardimage img, .wb-card__figure img');
    const imageCount = await images.count();

    expect(imageCount, 'Cards should have images').toBeGreaterThan(0);

    // Check that images have reasonable dimensions (not 0x0 or 1x1)
    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const img = images.nth(i);
      const box = await img.boundingBox();

      if (box) {
        expect(box.width, `Image ${i} width is ${box.width}px, should be > 20px`).toBeGreaterThan(20);
        expect(box.height, `Image ${i} height is ${box.height}px, should be > 20px`).toBeGreaterThan(20);
      }
    }
  });
});
