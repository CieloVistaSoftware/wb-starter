import { test, expect } from '../fixtures/offline';

/**
 * #1780: a single-item x-demo hides its code panel while it measures (#1757)
 * and reveals it at its one width commit (#985). #1767 made a control that
 * builds AFTER that commit drop the committed width and measure again -- with
 * the panel already showing. Measured on demos/site/cards.html with card.js
 * held until the "Large Card" demo had committed: the visible panel widened
 * 355 -> 422px when <article size="lg"> built (`.x-card--lg`, min-width 420px).
 *
 * The hold below is the same race: card.js arrives after the moment main
 * commits (about 0.5s after the panel exists), but well inside demo.js's
 * MAX_MS (5s). It is released when the demo commits, or 2s after its panel
 * exists, whichever comes first, so the test cannot deadlock on a demo that
 * correctly waits. Every frame the panel is visible, its width is recorded;
 * once shown it must stay at the width it was shown at.
 *
 * The control must still fit the demo afterwards
 * (demo-remeasures-a-control-built-late.spec.ts, #1759).
 */
// #1349: page.route() below holds card.js, and sw.js would otherwise answer
// that fetch itself, out of Playwright's reach, so the hold would never apply.
test.use({ serviceWorkers: 'block' });

const CARD = '#card-card article[title="Large Card"][size="lg"]';

test('a demo whose control builds late reveals its code panel once, at the width it keeps (#1780)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript((selector) => {
    const widths: number[] = [];
    (window as any).__visiblePanelWidths = widths;
    const tick = () => {
      const card = document.querySelector(selector);
      const panel = card?.closest('[x-demo]')?.querySelector('.x-pre__wrapper');
      if (panel && getComputedStyle(panel).opacity === '1'
        && panel.checkVisibility({ opacityProperty: true, visibilityProperty: true } as any)) {
        widths.push(Math.round(panel.getBoundingClientRect().width));
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, CARD);

  let release!: () => void;
  const cardJsHeld = new Promise<void>((r) => { release = r; });
  await page.route('**/wb-viewmodels/card.js*', async (route) => {
    await cardJsHeld;
    await route.continue();
  });

  await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });
  const card = page.locator(CARD);
  const demo = card.locator('xpath=ancestor::*[@x-demo][1]');
  await card.scrollIntoViewIfNeeded();
  await expect(demo.locator('.x-pre__wrapper')).toHaveCount(1, { timeout: 15_000 });

  // Past the moment main commits; still inside MAX_MS.
  await demo.evaluate((d) => new Promise<void>((resolve) => {
    if (d.classList.contains('x-demo--measured')) return resolve();
    const mo = new MutationObserver(() => {
      if (d.classList.contains('x-demo--measured')) { mo.disconnect(); resolve(); }
    });
    mo.observe(d, { attributes: true, attributeFilter: ['class'] });
    setTimeout(() => { mo.disconnect(); resolve(); }, 2000);
  }));
  await expect(card, 'card.js is held, so the card must not be built yet').not.toHaveClass(/x-card--lg/);
  release();
  await expect(card).toHaveClass(/x-card--lg/, { timeout: 15_000 });

  // Settled: committed, the built card fits, and the panel is showing.
  await expect(demo).toHaveClass(/x-demo--measured/, { timeout: 10_000 });
  await expect.poll(async () => card.evaluate((c) => {
    const d = c.closest('[x-demo]')!;
    const cs = getComputedStyle(d);
    const inner = d.getBoundingClientRect().right - (parseFloat(cs.paddingRight) || 0) - (parseFloat(cs.borderRightWidth) || 0);
    return Math.round(c.getBoundingClientRect().right - inner);
  }), { timeout: 10_000, message: 'the built card overflows the demo it is in (px past its edge)' }).toBeLessThanOrEqual(0);
  // The recording has caught up with the panel as it now stands.
  await expect.poll(async () => demo.locator('.x-pre__wrapper').evaluate((p) => {
    const w: number[] = (window as any).__visiblePanelWidths;
    return w.length > 0 && w[w.length - 1] === Math.round(p.getBoundingClientRect().width);
  }), { timeout: 10_000, message: 'the panel is visible at its current width' }).toBe(true);

  const widths: number[] = await page.evaluate(() => (window as any).__visiblePanelWidths);
  const distinct = widths.filter((w, i) => i === 0 || w !== widths[i - 1]);
  expect(
    Math.max(...widths) - Math.min(...widths),
    `the visible code panel changed width after it was revealed: ${distinct.join(' -> ')}px`,
  ).toBeLessThanOrEqual(10);
});
