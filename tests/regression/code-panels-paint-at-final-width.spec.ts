import { test, expect } from '../fixtures/offline';
import { wbIdle } from '../base';

/**
 * #985: code panels painted at 40-52% of their final width and snapped out
 * ~1.3s later (366 -> 933px, 489 -> 933px on a cold load), because demo.js
 * committed each width poll as it went. 4278fcf7 commits once. Measured
 * 2026-10-05: on layout.html every panel settles within 2px; on cards.html all
 * but one do (that one narrows 995 -> 877 when measured: #1579).
 *
 * This holds what #985 was about -- no panel GROWS visibly after it first
 * paints -- with a ResizeObserver on every .x-pre__wrapper.
 *
 * #1757: Windows CI recorded `card-card: 407 -> 418 -> 420` on the "Large
 * Card" demo. Before the commit a single-item demo is fit-content, so its code
 * panel follows the control, and <article size="lg"> reaches its 420px only
 * when the card behavior adds .x-card--lg (min-width, animated by the card's
 * 0.2s `transition: all`). Holding card.js until that panel existed reproduced
 * it here: 351 -> 407 -> 417 -> 418 -> 420, the 407 included. Those widths were
 * PAINTED: .x-demo__code--pending hid only the <pre>, while its .x-pre__wrapper
 * (dark background, border, gutter, copy button) was visible from the moment
 * pre.js built it. demo.css now hides the whole panel while the block is
 * .x-demo--measuring, so the first frame a reader sees is the committed width.
 *
 * Two consequences for what is recorded here:
 *   - widths count only while the wrapper is visible. A ResizeObserver also
 *     reports a visibility:hidden box, and the hidden panel now legitimately
 *     changes width before its reveal. Before #1757 the wrapper was never
 *     hidden, so this is the same contract, not a looser one.
 *   - "shown while measuring" is asserted directly. The card has to land
 *     inside the measuring window for the growth itself to show, and whether
 *     it does is load timing (under parallel workers it usually lands after the
 *     commit). A panel painted while its block is still measuring is painted at
 *     a provisional width on every load, which is the defect itself.
 */
test.describe.configure({ timeout: 90_000 });

for (const url of ['/demos/site/layout.html', '/demos/site/cards.html']) {
  test(`${url}: no code panel changes width after it first paints (#985, #1579, #1757)`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.addInitScript(() => {
      const seen = new Map<Element, number[]>();
      const shownWhileMeasuring = new Set<Element>();
      const last = new Map<Element, number>();
      (window as any).__panelWidths = seen;
      (window as any).__shownWhileMeasuring = shownWhileMeasuring;
      // false for a visibility:hidden box (its own or inherited) and for one
      // under a display:none ancestor.
      const shown = (el: Element) => el.checkVisibility({ visibilityProperty: true } as any);
      const record = (el: Element) => {
        const w = last.get(el);
        if (!w || !shown(el)) return;
        if (el.parentElement?.matches('[x-demo].x-demo--measuring')) shownWhileMeasuring.add(el);
        const list = seen.get(el) || [];
        if (list[list.length - 1] !== w) list.push(w);
        seen.set(el, list);
      };
      const ro = new ResizeObserver((entries) => entries.forEach((e) => {
        const w = Math.round(e.contentRect.width);
        if (!w) return;
        last.set(e.target, w);
        record(e.target);
      }));
      // A reveal is a class change and need not resize anything, so every
      // class change re-reads each observed panel as well.
      new MutationObserver((ms) => {
        ms.forEach((m) => m.addedNodes.forEach((n) => {
          if (!(n instanceof Element)) return;
          if (n.classList.contains('x-pre__wrapper')) ro.observe(n);
          n.querySelectorAll('.x-pre__wrapper').forEach((el) => ro.observe(el));
        }));
        if (ms.some((m) => m.type === 'attributes')) last.forEach((_, el) => record(el));
      }).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    });
    await page.goto(url);
    await wbIdle(page, { timeout: 60_000 });
    // Until every built demo has committed its width (the signal, not a sleep).
    await page.waitForFunction(() => !document.querySelector('[x-demo].x-demo--measuring'), undefined, { timeout: 30_000 });

    const observed = await page.evaluate(() => (window as any).__panelWidths.size);
    expect(observed, 'no code panel was observed -- the page or the observer is broken').toBeGreaterThan(10);

    const moved = await page.evaluate(() => [...(window as any).__panelWidths.entries()]
      .filter(([, l]: [Element, number[]]) => l.length > 1 && Math.abs(l[l.length - 1] - l[0]) > 10)
      .map(([el, l]: [Element, number[]]) => `${el.closest('section[id]')?.id || '?'}: ${l.join(' -> ')}`));
    expect(moved, 'code panels that changed width after they first painted (#985, #1579)').toEqual([]);

    const early = await page.evaluate(() => [...(window as any).__shownWhileMeasuring]
      .map((el: Element) => `${el.closest('section[id]')?.id || '?'}: ${Math.round(el.getBoundingClientRect().width)}px`));
    expect(early, 'code panels painted before their demo committed its width (#1757)').toEqual([]);
  });
}
