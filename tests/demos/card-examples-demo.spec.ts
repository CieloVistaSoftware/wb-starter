import { test, expect } from '@playwright/test';

// This test checks that all <div x-demo> blocks in the cards.html demo render both the live card and the code sample

test.describe('Card Examples Demo', () => {
  test('All card demos render live and show code', async ({ page }) => {
    await page.goto('/demos/site/cards.html');

    // Wait for WB to initialize and for at least one x-demo to appear
    await page.waitForSelector('[x-demo]');

    // Get all x-demo blocks
    const demos = await page.$$('[x-demo]');
    expect(demos.length).toBeGreaterThan(0);

    for (const demo of demos) {
      // Blocks past x-demo.js's EAGER_BUILD_COUNT (5) build lazily via
      // IntersectionObserver, only once scrolled near the viewport -- must
      // scroll to each one before checking, or its .x-demo__grid/code
      // panel simply doesn't exist yet (see #374).
      await demo.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      // Each demo should contain a .x-demo__grid with a card element
      const grid = await demo.$('.x-demo__grid');
      expect(grid).not.toBeNull();
      // There should be at least one child card element in the grid
      const card = await grid.$('.x-card, [x-cardimage], [x-cardvideo], [x-cardbutton], [x-cardhero], [x-cardprofile], [x-cardpricing], [x-cardstats], [x-cardtestimonial], [x-cardproduct], [x-cardnotification], [x-cardfile], [x-cardlink], [x-cardhorizontal], [x-carddraggable], [x-cardexpandable], [x-cardminimizable], [x-cardoverlay], [x-cardportfolio]');
      expect(card).not.toBeNull();
      // Each demo should also show a code sample
      const code = await demo.$('pre.x-demo__code');
      expect(code).not.toBeNull();
      // The code sample should contain the card tag
      const codeText = await code.textContent();
      expect(codeText).toMatch(/<article|<card-|<div x-cardnotification/);
    }
  });
});
