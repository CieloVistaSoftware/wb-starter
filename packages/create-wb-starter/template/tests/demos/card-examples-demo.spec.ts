import { test, expect } from '../fixtures/offline';
import { buildInView } from '../base';

// This test checks that all <div x-demo> blocks in the cards.html demo render both the live card and the code sample

// Every card host the page can contain. <article> is the card's own form -- a
// base card carries NO .x-card class since a8a7362e (card.css matches the tag),
// so `.x-card` stopped matching the plain cards and read them as missing.
const CARD_HOST = 'article, [x-card], [x-cardimage], [x-cardvideo], [x-cardbutton], [x-cardhero], [x-cardprofile], [x-cardpricing], [x-cardstats], [x-cardtestimonial], [x-cardproduct], [x-cardnotification], [x-cardfile], [x-cardlink], [x-cardhorizontal], [x-carddraggable], [x-cardexpandable], [x-cardminimizable], [x-cardoverlay], [x-cardportfolio]';

test.describe('Card Examples Demo', () => {
  test('All card demos render live and show code', async ({ page }) => {
    // cards.html carries ~300 x-demo blocks, each built only once scrolled to.
    test.setTimeout(240_000);
    await page.goto('/demos/site/cards.html');

    // Wait for WB to initialize and for at least one x-demo to appear
    await page.waitForSelector('[x-demo]');

    // Get all x-demo blocks
    const demos = await page.locator('[x-demo]').all();
    expect(demos.length).toBeGreaterThan(0);

    const problems: string[] = [];
    for (const [i, demo] of demos.entries()) {
      // Blocks past x-demo.js's EAGER_BUILD_COUNT build lazily, only once
      // scrolled near the viewport (#374, #491). A fixed 200ms after the
      // scroll was a guess at how long that takes; wait for the demo's own
      // x-ready instead, which is stamped once its grid and code panel exist.
      await buildInView(demo);
      const id = (await demo.getAttribute('id')) || `#${i}`;
      const summary = await demo.evaluate((el, hostSel) => {
        // Each demo should contain a .x-demo__grid with a card element
        const grid = el.querySelector('.x-demo__grid');
        const code = el.querySelector('pre.x-demo__code');
        return {
          grid: !!grid,
          card: !!grid?.querySelector(hostSel),
          code: code ? code.textContent || '' : null,
        };
      }, CARD_HOST);
      if (!summary.grid) { problems.push(`${id}: no .x-demo__grid`); continue; }
      if (!summary.card) problems.push(`${id}: no card in its grid`);
      // Each demo should also show a code sample containing the card's markup
      if (summary.code === null) problems.push(`${id}: no pre.x-demo__code`);
      // Any tag carrying an x-card* attribute, not just <div>: heroes are
      // authored as <section x-cardhero>. And whitespace, not a space: the
      // code panel pretty-prints a long tag with each attribute on its own
      // line (`<div\n  x-cardimage\n  src=...`).
      else if (!/<article\b|<[a-z][\w-]*\s[^>]*\bx-card/.test(summary.code)) problems.push(`${id}: code sample shows no card markup`);
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });
});
