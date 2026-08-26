import { test, expect } from '@playwright/test';

/**
 * #647: loading demos/playground.html darkened the ENTIRE page with a
 * mouse-tracking vignette. The source was a single gallery demo far below the
 * fold -- `<div x-stagelight variant="spotlight">` inside `#pg-gallery` --
 * whose overlay was `position: fixed; width: 100vw; height: 100vh;
 * mix-blend-mode: multiply; z-index: 9999`.
 *
 * The first attempt at this bug added `contain: layout` to `#pg-preview`. That
 * could not have worked, for two independent reasons, and this spec pins both:
 *
 *   1. The spotlight was never inside `#pg-preview` -- it lives in the example
 *      gallery. Measured live at the time: `inPreview: false`.
 *   2. Even correctly contained, `100vw/100vh` are absolute viewport units.
 *      Containment can re-anchor a fixed box's origin but cannot shrink one
 *      sized in viewport units, so the overlay kept blanketing the page from
 *      wherever it landed.
 *
 * The fix needs BOTH halves, so this spec asserts both independently -- either
 * one regressing alone brings the bug back:
 *   - `.x-demo__grid { contain: layout }` establishes a containing block, and
 *   - the overlay sizes with `inset: 0` (a child element, so the host stays in
 *     normal flow and the demo box keeps real dimensions).
 */

const PAGES = [
  { url: '/demos/playground.html', label: 'playground gallery' },
  { url: '/demos/site/effects.html', label: 'effects page' },
];

for (const { url, label } of PAGES) {
  test.describe(`x-stagelight spotlight stays inside its demo box — ${label} (#647)`, () => {
    test(`${url}: no spotlight overlay covers the viewport`, async ({ page }) => {
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      // The gallery demos upgrade lazily; scroll them into view and wait.
      await page.evaluate(() => {
        document.querySelectorAll('[x-stagelight], x-stagelight').forEach((e) => e.scrollIntoView());
      });
      await page.waitForFunction(() => !!document.querySelector('.x-stagelight__spot'), null, {
        timeout: 30000,
      });

      const report = await page.evaluate(() => {
        const spots = [...document.querySelectorAll('.x-stagelight__spot')];
        return {
          viewport: { w: window.innerWidth, h: window.innerHeight },
          spots: spots.map((s) => {
            const r = s.getBoundingClientRect();
            const grid = s.closest('.x-demo__grid');
            const gr = grid ? grid.getBoundingClientRect() : null;
            return {
              hasGrid: !!grid,
              gridContain: grid ? getComputedStyle(grid).contain : null,
              w: Math.round(r.width),
              h: Math.round(r.height),
              gridW: gr ? Math.round(gr.width) : null,
              gridH: gr ? Math.round(gr.height) : null,
            };
          }),
        };
      });

      expect(report.spots.length, 'expected at least one spotlight overlay').toBeGreaterThan(0);

      for (const s of report.spots) {
        // (1) the demo box must establish a containing block
        expect(s.hasGrid, 'spotlight overlay should sit inside a .x-demo__grid').toBe(true);
        expect(s.gridContain, '.x-demo__grid must establish a containing block').toContain('layout');

        // (2) the overlay must be sized BY that box, not by the viewport --
        //     this is the assertion that 100vw/100vh would fail
        expect(s.w, 'overlay must not span the viewport width').toBeLessThan(report.viewport.w);
        expect(s.h, 'overlay must not span the viewport height').toBeLessThan(report.viewport.h);
        expect(s.w).toBeLessThanOrEqual((s.gridW ?? 0) + 2);
        expect(s.h).toBeLessThanOrEqual((s.gridH ?? 0) + 2);

        // (3) Standard §1: the example must actually render. Containing the
        //     overlay is not a fix if it collapses the demo box to nothing --
        //     an intermediate version of this fix did exactly that (0 width),
        //     because the host element WAS the overlay and left no in-flow size.
        expect(s.gridW, 'demo box must have real width, not collapse to 0').toBeGreaterThan(50);
        expect(s.gridH, 'demo box must have real height').toBeGreaterThan(10);
      }
    });

    test(`${url}: spotlight tracks the mouse relative to its own box`, async ({ page }) => {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        document.querySelectorAll('[x-stagelight], x-stagelight').forEach((e) => e.scrollIntoView());
      });
      await page.waitForFunction(() => !!document.querySelector('.x-stagelight__spot'), null, {
        timeout: 30000,
      });

      // Once contained, the overlay's origin is no longer 0,0 of the screen.
      // Feeding raw clientX/clientY put the bright spot outside the box and
      // left it rendering as a uniformly dark rectangle.
      const result = await page.evaluate(async () => {
        const spot = document.querySelector('.x-stagelight__spot') as HTMLElement;
        const host = spot.parentElement as HTMLElement;
        const r = spot.getBoundingClientRect();
        window.dispatchEvent(
          new MouseEvent('mousemove', {
            clientX: r.x + r.width / 2,
            clientY: r.y + r.height / 2,
            bubbles: true,
          })
        );
        await new Promise((res) => setTimeout(res, 150));
        const cs = getComputedStyle(host);
        return {
          x: parseFloat(cs.getPropertyValue('--x')),
          y: parseFloat(cs.getPropertyValue('--y')),
          halfW: r.width / 2,
          halfH: r.height / 2,
        };
      });

      // A pointer at the centre of the box must yield box-centre coordinates,
      // NOT the viewport coordinates of that same point.
      expect(Math.abs(result.x - result.halfW), '--x must be box-relative').toBeLessThan(2);
      expect(Math.abs(result.y - result.halfH), '--y must be box-relative').toBeLessThan(2);
    });
  });
}
