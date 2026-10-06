/**
 * pages/behaviors.html has 40+ <div x-demo> blocks. Building every single one
 * eagerly (syntax-highlighted source panel, line numbers, control
 * positioning — each requiring real DOM writes and layout reads) on first
 * paint blocked the main thread for ~490ms out of a ~710ms page navigation,
 * entirely for blocks stacked far below the fold nobody had scrolled to
 * yet. Fixed by deferring each <div x-demo>'s build via IntersectionObserver,
 * scoped to #siteBody (the actual scroll container — .site is pinned to
 * 100dvh with overflow:hidden, so the browser viewport itself never
 * scrolls here; IntersectionObserver's default viewport root would never
 * see anything change).
 *
 * Getting this wrong silently defeats the deferral entirely: two other
 * code paths (await WB.scan()'s "#305 fallback" behavior-injection loop, and the
 * schema-processing loop) both independently discover <div x-demo> as a wb-*
 * tag and, unless explicitly excluded, race the lazy loader and build
 * every block eagerly anyway.
 *
 * #666 then moved every one of pages/behaviors.html's demo blocks into
 * data/behavior-examples.json (rendered one at a time by its live preview), so
 * /?page=behaviors has no [x-demo] left and the sanity check below read 1.
 * The same deferral now runs on demos/site/feedback.html -- 217 blocks, a
 * normal document scroll -- which is where this is measured.
 */
import { test, expect } from '../fixtures/offline';

const PAGE = '/demos/site/feedback.html';

test.describe('#312 follow-up — <div x-demo> blocks build lazily, not all at once', () => {
  test('only a handful of demo blocks are built on initial load, not all of them', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForSelector('[x-demo] .x-demo__grid', { timeout: 20000 });
    // The eager blocks are done when the runtime says it is idle (#1516), not
    // after a guessed 1000ms; the deferred ones are then still unbuilt.
    await page.evaluate(() => (window as any).WB.settled({ timeout: 15000 }));

    const counts = await page.evaluate(() => {
      const all = [...document.querySelectorAll('[x-demo]')];
      return { total: all.length, processed: all.filter((el) => el.querySelector('.x-demo__grid')).length };
    });

    expect(counts.total, 'sanity check: the page should have many demo blocks').toBeGreaterThan(20);
    expect(
      counts.processed,
      `expected only the blocks near the top to build eagerly, got ${counts.processed}/${counts.total} processed on load`
    ).toBeLessThan(counts.total);
  });

  test('scrolling through the page eventually builds every demo block', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForSelector('[x-demo] .x-demo__grid', { timeout: 20000 });

    // Walk the page the way a reader does: bring the next still-unbuilt block
    // into view and keep it there, frame by frame, until the observer has
    // built it; repeat. Scrolling by a fixed step undershoots here -- the page
    // grows taller as blocks build -- and a fixed 50ms per step guessed how
    // fast that happens (#1516).
    for (let i = 0; i < 400; i++) {
      const remaining = await page.evaluate(async () => {
        const next = [...document.querySelectorAll('[x-demo]')].find((el) => !el.querySelector('.x-demo__grid'));
        if (!next) return false;
        const end = performance.now() + 10000;
        while (!next.querySelector('.x-demo__grid')) {
          if (performance.now() > end) throw new Error(`an [x-demo] block never built after 10s in view: ${next.outerHTML.slice(0, 120)}`);
          next.scrollIntoView({ block: 'center' });
          await new Promise((r) => requestAnimationFrame(() => r(null)));
        }
        return true;
      });
      if (!remaining) break;
    }

    const counts = await page.evaluate(() => {
      const all = [...document.querySelectorAll('[x-demo]')];
      return { total: all.length, processed: all.filter((el) => el.querySelector('.x-demo__grid')).length };
    });

    expect(counts.processed, `expected every demo block to have built by the time the page is fully scrolled through, got ${counts.processed}/${counts.total}`).toBe(counts.total);
  });
});
