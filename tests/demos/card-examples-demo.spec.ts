import { test, expect } from '@playwright/test';

// This test checks that all <wb-demo> blocks in the card-examples.html demo render both the live card and the code sample

test.describe('Card Examples Demo', () => {
  test('All card demos render live and show code', async ({ page }) => {
    await page.goto('http://localhost:3000/demos/card-examples.html');

    // Wait for WB to initialize and for at least one wb-demo to appear
    await page.waitForSelector('wb-demo');

    // Get all wb-demo blocks
    const demos = await page.$$('wb-demo');
    expect(demos.length).toBeGreaterThan(0);

    for (const demo of demos) {
      // Each demo should contain a .wb-demo__grid with a card element
      const grid = await demo.$('.wb-demo__grid');
      expect(grid).not.toBeNull();
      // There should be at least one child card element in the grid
      const card = await grid.$('wb-card, card-image, card-video, card-button, card-hero, card-profile, card-pricing, card-stats, card-testimonial, card-product, wb-cardnotification, card-file, card-link, card-horizontal, card-draggable, card-expandable, card-minimizable, card-overlay, card-portfolio');
      expect(card).not.toBeNull();
      // Each demo should also show a code sample
      const code = await demo.$('pre.wb-demo__code');
      expect(code).not.toBeNull();
      // The code sample should contain the card tag
      const codeText = await code.textContent();
      expect(codeText).toMatch(/<wb-card|<card-|<wb-cardnotification/);
    }
  });
});
