import { test, expect } from '@playwright/test';

// This test checks that all <wb-demo> blocks in the cards.html demo render both the live card and the code sample

test.describe('Card Examples Demo', () => {
  test('All card demos render live and show code', async ({ page }) => {
    await page.goto('http://localhost:3000/demos/site/cards.html');

    // Wait for WB to initialize and for at least one wb-demo to appear
    await page.waitForSelector('wb-demo');

    // Get all wb-demo blocks
    const demos = await page.$$('wb-demo');
    expect(demos.length).toBeGreaterThan(0);

    for (const demo of demos) {
      // Blocks past wb-demo.js's EAGER_BUILD_COUNT (5) build lazily via
      // IntersectionObserver, only once scrolled near the viewport -- must
      // scroll to each one before checking, or its .wb-demo__grid/code
      // panel simply doesn't exist yet (see #374).
      await demo.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      // Each demo should contain a .wb-demo__grid with a card element
      const grid = await demo.$('.wb-demo__grid');
      expect(grid).not.toBeNull();
      // There should be at least one child card element in the grid
      const card = await grid.$('wb-card, wb-cardimage, wb-cardvideo, wb-cardbutton, wb-cardhero, wb-cardprofile, wb-cardpricing, wb-cardstats, wb-cardtestimonial, wb-cardproduct, wb-cardnotification, wb-cardfile, wb-cardlink, wb-cardhorizontal, wb-carddraggable, wb-cardexpandable, wb-cardminimizable, wb-cardoverlay, wb-cardportfolio');
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
