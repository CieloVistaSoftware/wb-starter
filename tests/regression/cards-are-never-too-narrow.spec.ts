import { test, expect } from '@playwright/test';

/**
 * A card is a layout container, so it never collapses to its text width.
 *
 * John, on <div x-cardpricing plan="Starter" …>: "once again these are too
 * narrow. this is the 3rd or 4th time I've seen this."
 *
 * Why it keeps coming back: demo.css §7 shrinks a SINGLE-ITEM <div x-demo>
 * to `width: fit-content` (#486). That is right for a control -- a button
 * should hug its label -- and wrong for a card, whose intrinsic width is
 * whatever its shortest line of text happens to be. A pricing card listing
 * "1 GB Storage" measured a couple of hundred pixels and rendered as a
 * sliver. Every previous fix targeted one card in one demo, so the next
 * card in the next wrapper reproduced it.
 *
 * This asserts the floor for EVERY card behavior in a real page, in the
 * wrapper that causes it, rather than for the one variant last complained
 * about.
 */

/** Below this a card stops reading as a card and starts reading as a column. */
const MIN_CARD_WIDTH = 260;

type Row = { id: string; behavior: string; width: number; available: number; sized: boolean };

test.describe('cards are never too narrow', () => {
  let rows: Row[];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/demos/site/cards.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
    // Cards below the fold initialise on scroll under the lazy runtime.
    await page.evaluate(async () => {
      await (window as any).WB.scan(document.body, { eager: true });
      await new Promise((r) => setTimeout(r, 800));
    });

    rows = await page.evaluate(() => {
      const out: any[] = [];
      const seen = new Set<string>();
      document.querySelectorAll('*').forEach((n) => {
        const el = n as HTMLElement;
        const behavior = Array.from(el.attributes)
          .map((a) => a.name)
          .find((name) => /^x-card/.test(name));
        if (!behavior) return;

        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return; // not laid out / hidden

        // The width the card COULD have taken: its nearest ancestor that is
        // itself full-width, so a genuinely narrow column is not reported.
        let available = r.width;
        let p: HTMLElement | null = el.parentElement;
        while (p && p !== document.body) {
          const pr = p.getBoundingClientRect();
          if (pr.width > available) available = pr.width;
          p = p.parentElement;
        }

        const id = el.id || `${behavior}#${out.length}`;
        if (seen.has(id)) return;
        seen.add(id);
        out.push({
          id, behavior,
          width: Math.round(r.width),
          available: Math.round(available),
          // `size="xs"` is an author asking for a narrow card on purpose.
          // The defect is the DEFAULT collapsing, not a declared size.
          sized: el.hasAttribute('size') && el.getAttribute('size') !== 'auto',
        });
      });
      return out;
    });

    await page.close();
  });

  test('the sweep actually ran', () => {
    // A page that rendered no cards would report perfect compliance forever.
    expect(rows.length, 'no cards were found on demos/site/cards.html').toBeGreaterThan(10);
  });

  test('no card collapses below a readable width', () => {
    const narrow = rows
      // Only fault a card that had room and did not take it. A card inside a
      // deliberately narrow column is not this bug, and neither is one the
      // author explicitly sized down with size="xs".
      .filter((r) => !r.sized)
      .filter((r) => r.width < MIN_CARD_WIDTH && r.available >= MIN_CARD_WIDTH)
      .map((r) => `${r.id} (${r.behavior}) is ${r.width}px wide with ${r.available}px available`);
    expect(
      narrow,
      `a card must be at least ${MIN_CARD_WIDTH}px when its container allows it — ` +
      'shrink-to-fit belongs to controls, not to layout containers',
    ).toEqual([]);
  });

  test('pricing cards specifically', () => {
    // The variant John reported, called out by name so a regression here is
    // legible without reading the full list.
    const pricing = rows.filter((r) => r.behavior === 'x-cardpricing');
    expect(pricing.length, 'no pricing cards rendered').toBeGreaterThan(0);
    const narrow = pricing
      .filter((r) => !r.sized)
      .filter((r) => r.width < MIN_CARD_WIDTH)
      .map((r) => `${r.id} is ${r.width}px`);
    expect(narrow, 'pricing cards collapsed to their text width again').toEqual([]);
  });
});
