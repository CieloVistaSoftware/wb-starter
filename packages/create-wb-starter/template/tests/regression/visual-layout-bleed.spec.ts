import { test, expect } from '@playwright/test';

/**
 * Visual Layout Bleed Detection — REGRESSION TEST
 *
 * Catches full-width container overflow and hero/content bleed issues.
 * Issue: Hero cards and content sections stretching full viewport width
 * when they should be constrained to max-width containers.
 */

test.describe('Visual Layout Bleed', () => {
  test('home page hero is constrained, not full-width bleed', async ({ page }) => {
    await page.goto('/pages/home.html', { waitUntil: 'domcontentloaded' });

    const hero = page.locator('[id*="hero"]').first();
    const heroBox = await hero.boundingBox();
    const viewportWidth = page.viewportSize()?.width || 1280;

    // Hero should NOT be full viewport width
    expect(heroBox?.width, 'Hero should be constrained, not full width').toBeLessThan(viewportWidth - 10);
    expect(heroBox?.width, 'Hero should have reasonable max-width').toBeGreaterThan(300);
  });

  test('components page content is constrained, not full-width', async ({ page }) => {
    await page.goto('/pages/components.html', { waitUntil: 'domcontentloaded' });

    const main = page.locator('main').first();
    const mainBox = await main.boundingBox();
    const viewportWidth = page.viewportSize()?.width || 1280;

    // Main content should NOT stretch full viewport
    expect(mainBox?.width, 'Main content should be constrained').toBeLessThan(viewportWidth - 10);
  });

  test('wb-cardhero components have max-width constraint', async ({ page }) => {
    await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });

    const cardHeroes = page.locator('wb-cardhero');
    const count = await cardHeroes.count();

    expect(count, 'Page should have wb-cardhero components').toBeGreaterThan(0);

    // Check each cardhero is not full-width
    for (let i = 0; i < Math.min(count, 3); i++) {
      const hero = cardHeroes.nth(i);
      const box = await hero.boundingBox();
      const viewportWidth = page.viewportSize()?.width || 1280;

      expect(box?.width, `cardhero ${i} should be constrained, not ${box?.width}px wide`).toBeLessThan(viewportWidth - 20);
    }
  });

  test('page body has no horizontal scroll overflow', async ({ page }) => {
    await page.goto('/pages/components.html');

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 1280;

    // scrollWidth should not exceed viewport (no horizontal overflow)
    expect(bodyWidth, 'Body should not overflow horizontally').toBeLessThanOrEqual(viewportWidth + 1);
  });
});
