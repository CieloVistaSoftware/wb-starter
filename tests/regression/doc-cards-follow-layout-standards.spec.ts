import { test, expect } from '../fixtures/offline';

/**
 * THE GUIDE'S AND THE CARD DOCS' CARDS FOLLOW THE LAYOUT STANDARDS (#468, #469)
 * ============================================================================
 * John, on the V3 guide's Quick start card (title "Hello", body "It just
 * works."): "too stubby, follow all of our standards on layout" (#468); and on
 * the card doc: "all cards ... must follow our standard on layouts. create a
 * test which shows they are not right now, fix, retest add to regression"
 * (#469).
 *
 * Both were fixed in passing -- the card floor (#391) and the guide's md Quick
 * start card -- and on 2026-10-07 every card on these pages measured inside
 * the standards. But nothing held the pages to them, so the next short
 * example could shrink back unseen. Every card in their live demos, on
 * desktop and on a phone, after scrolling so lazy demos upgrade:
 *   - §7: at least MIN_CARD_WIDTH wide when its column has the room
 *     (tests/regression/cards-are-never-too-narrow.spec.ts, same floor), and
 *   - §13: at least 1rem of padding inside it.
 *
 * Seen to fail: a card forced to 120px wide with 4px padding is reported.
 *
 * See it by hand: open the doc viewer on docs/V3-GUIDE.md. The Quick start
 * card fills a 400px md card on desktop and the whole column on a phone.
 */

/** Same floor as cards-are-never-too-narrow.spec.ts: below it a card reads as a column. */
const MIN_CARD_WIDTH = 260;
/** §13: 1rem at the default root size. */
const MIN_PADDING = 16;

const DOCS = ['docs/V3-GUIDE.md', 'docs/card.md', 'docs/behaviors/card.md'];

for (const doc of DOCS) {
  for (const width of [1280, 375]) {
    test(`${doc}: cards are neither stubby nor cramped at ${width}px (#468, #469)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/public/doc-viewer.html?file=${encodeURIComponent(doc)}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[x-demo] .x-demo__grid [x-ready]', { timeout: 20_000 });

      // Demos below the fold upgrade lazily; walk the page so every card does.
      await page.evaluate(async () => {
        for (let y = 0; y <= document.documentElement.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => requestAnimationFrame(() => r(null)));
        }
      });
      await expect(page.locator('[x-demo] .x-demo__grid article:not([x-ready])')).toHaveCount(0, { timeout: 10_000 });

      const cards = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('[x-demo] .x-demo__grid :is(article, [class*="x-card"]):not([class*="x-card__"])')].map((el) => {
          const cs = getComputedStyle(el);
          const column = el.closest('.x-demo__grid')!.parentElement!.getBoundingClientRect().width;
          return {
            title: el.getAttribute('title') || el.textContent!.trim().slice(0, 30),
            width: Math.round(el.getBoundingClientRect().width),
            available: Math.round(column),
            padding: Math.min(...['Top', 'Right', 'Bottom', 'Left'].map((s) => parseFloat(cs[`padding${s}` as any]))),
          };
        }),
      );
      expect(cards.length, `${doc} renders no live cards -- the check would pass vacuously`).toBeGreaterThan(0);

      const stubby = cards
        .filter((c) => c.width < MIN_CARD_WIDTH && c.available >= MIN_CARD_WIDTH)
        .map((c) => `"${c.title}" is ${c.width}px wide with ${c.available}px available`);
      expect(stubby, `§7: a card is at least ${MIN_CARD_WIDTH}px when its column allows it`).toEqual([]);

      const cramped = cards.filter((c) => c.padding < MIN_PADDING).map((c) => `"${c.title}" has ${c.padding}px padding`);
      expect(cramped, `§13: a card has at least ${MIN_PADDING}px (1rem) of padding`).toEqual([]);
    });
  }
}
