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
 * paints -- with a ResizeObserver on every .x-pre-wrapper from first paint.
 */
test.describe.configure({ timeout: 90_000 });

for (const url of ['/demos/site/layout.html', '/demos/site/cards.html']) {
  test(`${url}: no code panel grows after it first paints (#985)`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.addInitScript(() => {
      const seen = new Map<Element, number[]>();
      (window as any).__panelWidths = seen;
      const ro = new ResizeObserver((entries) => entries.forEach((e) => {
        const w = Math.round(e.contentRect.width);
        if (!w) return;
        const list = seen.get(e.target) || [];
        if (list[list.length - 1] !== w) list.push(w);
        seen.set(e.target, list);
      }));
      new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => {
        if (!(n instanceof Element)) return;
        if (n.classList.contains('x-pre-wrapper')) ro.observe(n);
        n.querySelectorAll('.x-pre-wrapper').forEach((el) => ro.observe(el));
      }))).observe(document, { childList: true, subtree: true });
    });
    await page.goto(url);
    await wbIdle(page, { timeout: 60_000 });
    // Until every built demo has committed its width (the signal, not a sleep).
    await page.waitForFunction(() => !document.querySelector('[x-demo].x-demo--measuring'), undefined, { timeout: 30_000 });

    const grew = await page.evaluate(() => [...(window as any).__panelWidths.values()]
      .filter((l: number[]) => l.length > 1 && l[l.length - 1] - l[0] > 10)
      .map((l: number[]) => l.join(' -> ')));
    const observed = await page.evaluate(() => (window as any).__panelWidths.size);
    expect(observed, 'no code panel was observed -- the page or the observer is broken').toBeGreaterThan(10);
    expect(grew, 'code panels that painted narrow and then widened (#985)').toEqual([]);
  });
}
