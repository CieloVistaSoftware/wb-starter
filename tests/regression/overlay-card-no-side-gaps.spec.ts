/**
 * ═══════════════════════════════════════════════════════════════════════════
 * An overlay card leaves no gap at either side of its host (#761)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John, twice, with screenshots: "all overlays must fill 100vw this has gaps
 * on both sides."
 *
 * Twice is the reason this test exists. The first fix set `width: 100%` on the
 * card and looked right in the CSS — but a child fills its parent's CONTENT
 * box, and the gap he was pointing at was the parent's own padding
 * (#pg-preview { padding: 1.25rem }). The card was already flush against
 * everything it could reach. Nothing failed, so the same screenshot came back.
 *
 * WHAT IS MEASURED
 *
 * Rendered geometry, not a declaration. Asserting `width: 100%` in the
 * stylesheet would have passed against the broken build — that property was
 * present and correct the whole time. The question is where the card's painted
 * edges land relative to its host's, which only a laid-out page can answer.
 */

import { test, expect } from '@playwright/test';

const OVERLAY = `<article x-cardoverlay
  image="https://picsum.photos/seed/city/480/320"
  title="Night shift"
  subtitle="City desk, 02:00"
  position="bottom"></article>`;

test.describe('Overlay card fills its host', () => {
  test('no gap at either side of the playground preview', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/demos/playground.html');
    await page.waitForSelector('#pg-preview', { timeout: 30_000 });

    const box = await page.evaluate(async (markup) => {
      const host = document.getElementById('pg-preview')!;
      host.innerHTML = markup;
      await (window as any).WB.scan(host, { eager: true });
      await new Promise((r) => setTimeout(r, 400));

      const card = host.querySelector('.wb-card--overlay-card') as HTMLElement | null;
      if (!card) return null;
      const h = host.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      return { hostLeft: h.left, hostRight: h.right, cardLeft: c.left, cardRight: c.right };
    }, OVERLAY);

    expect(box, 'the overlay card never rendered — nothing to measure').not.toBeNull();

    // Sub-pixel layout rounding is not a gap; a border is 1px each side at most.
    const TOLERANCE = 1.5;
    expect(
      box!.cardLeft - box!.hostLeft,
      `${(box!.cardLeft - box!.hostLeft).toFixed(1)}px of host showing to the LEFT of the ` +
      `overlay card. This is the gap John screenshotted twice — it comes from the ` +
      `host's padding, not the card's width.`,
    ).toBeLessThanOrEqual(TOLERANCE);

    expect(
      box!.hostRight - box!.cardRight,
      `${(box!.hostRight - box!.cardRight).toFixed(1)}px of host showing to the RIGHT of the ` +
      `overlay card.`,
    ).toBeLessThanOrEqual(TOLERANCE);
  });

  test('filling the host does not push the page sideways', async ({ page }) => {
    // The tempting fix is a 100vw breakout. It also produces a horizontal
    // scrollbar (100vw counts the vertical scrollbar's width), which
    // DEMOS-AND-DOCS-STANDARDS.md §15 forbids at any width. Closing the gap and
    // keeping the page still are one requirement, so they are asserted together.
    test.setTimeout(60_000);
    await page.goto('/demos/playground.html');
    await page.waitForSelector('#pg-preview', { timeout: 30_000 });

    const overflow = await page.evaluate(async (markup) => {
      const host = document.getElementById('pg-preview')!;
      host.innerHTML = markup;
      await (window as any).WB.scan(host, { eager: true });
      await new Promise((r) => setTimeout(r, 400));
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    }, OVERLAY);

    expect(
      overflow,
      `the page scrolls ${overflow}px horizontally with an overlay card on it`,
    ).toBeLessThanOrEqual(1);
  });
});
