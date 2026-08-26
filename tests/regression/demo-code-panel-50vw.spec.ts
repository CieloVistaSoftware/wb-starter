import { test, expect } from '@playwright/test';

/**
 * x-demo code panels: show ALL the code, up to 50vw — REGRESSION TEST
 *
 * Owner requirement (2026-08-07): "all x-demo code must show all the code
 * up to 50% vw".
 *
 * The defect this pins: demo.js sized a single-item <div x-demo> to its CONTROL's
 * width and the code panel is width:100% of that box, so a narrow control gave
 * its code panel a narrow window. Measured live on pages/behaviors.html before
 * the fix: a 305px <article> left its code panel a 303px viewport holding 421px
 * of source — a 5-line example only readable by dragging a scrollbar.
 *
 * The contract, precisely:
 *   - A code panel must show its content in full (no horizontal scroll)…
 *   - …UNLESS doing so would exceed 50vw, in which case it sits at the cap and
 *     scrolling is the correct, intended behavior (#390: x-demo code panels
 *     scroll rather than wrap — an explicit owner override of Standard §6).
 *   - No panel may exceed 50vw.
 *
 * Scope: single-item demos only. A multi-item demo legitimately spans the full
 * content column; the 50vw rule is about the single-item shrink-to-fit path.
 */

const PAGES = ['/pages/behaviors.html', '/demos/site/cards.html', '/?page=behaviors'];

// Sub-pixel layout rounding; a panel 1px over its content is not a defect.
const TOL = 2;

for (const path of PAGES) {
  test.describe(`code panel width — ${path}`, () => {
    test('single-item demos show all their code, or sit at the 50vw cap', async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      // The panel is built after an await on the docs manifest, then sized in a
      // rAF. Wait for at least one panel to be measured rather than sleeping.
      await page.waitForSelector('[x-demo] .x-pre', { timeout: 15000 });
      await page.waitForFunction(() => {
        const d = document.querySelector('[x-demo]');
        return !!d && !!d.querySelector('.x-pre');
      });

      const panels = await page.evaluate((tol) => {
        const vw = window.innerWidth;
        const cap = vw * 0.5;
        const out: Array<Record<string, unknown>> = [];
        document.querySelectorAll('[x-demo]').forEach((d, i) => {
          const grid = d.querySelector('.x-demo__grid');
          const pre = d.querySelector('.x-pre') as HTMLElement | null;
          if (!grid || !pre) return;
          // Single-item, non-full-width demos only — see file header.
          if (grid.children.length !== 1) return;
          if (d.classList.contains('x-demo--full-width')) return;
          const w = pre.getBoundingClientRect().width;
          out.push({
            index: i,
            id: (d as HTMLElement).id || `demo[${i}]`,
            visibleWidth: Math.round(w),
            contentWidth: pre.scrollWidth,
            clientWidth: pre.clientWidth,
            cap: Math.round(cap),
            scrolls: pre.scrollWidth > pre.clientWidth + tol,
            atCap: w >= cap - tol,
            overCap: w > cap + tol,
          });
        });
        return out;
      }, TOL);

      expect(panels.length, `${path} should have single-item demo code panels`).toBeGreaterThan(0);

      // No panel may exceed the 50vw cap.
      const over = panels.filter((p) => p.overCap);
      expect(
        over,
        `panels wider than 50vw: ${JSON.stringify(over, null, 2)}`
      ).toHaveLength(0);

      // A panel may only scroll if it is genuinely up against the cap.
      const clippedBelowCap = panels.filter((p) => p.scrolls && !p.atCap);
      expect(
        clippedBelowCap,
        `panels that scroll while still narrower than 50vw — these have room to ` +
        `grow and should have been widened: ${JSON.stringify(clippedBelowCap, null, 2)}`
      ).toHaveLength(0);
    });

    test('narrow control does not starve its code panel', async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[x-demo] .x-pre', { timeout: 15000 });

      // The specific reported shape: control much narrower than its code.
      // The demo must widen to the code, not clamp the code to the control.
      const starved = await page.evaluate((tol) => {
        const vw = window.innerWidth;
        const cap = vw * 0.5;
        const bad: Array<Record<string, unknown>> = [];
        document.querySelectorAll('[x-demo]').forEach((d, i) => {
          const grid = d.querySelector('.x-demo__grid');
          const pre = d.querySelector('.x-pre') as HTMLElement | null;
          if (!grid || !pre || grid.children.length !== 1) return;
          if (d.classList.contains('x-demo--full-width')) return;
          const control = grid.children[0].getBoundingClientRect().width;
          const need = Math.min(pre.scrollWidth, cap);
          const got = pre.clientWidth;
          if (got + tol < need) {
            bad.push({
              id: (d as HTMLElement).id || `demo[${i}]`,
              controlWidth: Math.round(control),
              codeNeeds: Math.round(need),
              codeGot: Math.round(got),
              shortBy: Math.round(need - got),
            });
          }
        });
        return bad;
      }, TOL);

      expect(
        starved,
        `code panels narrower than the code they hold (and below the 50vw cap): ` +
        `${JSON.stringify(starved, null, 2)}`
      ).toHaveLength(0);
    });
  });
}
