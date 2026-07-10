/**
 * pages/behaviors.html has 40+ <wb-demo> blocks. Building every single one
 * eagerly (syntax-highlighted source panel, line numbers, control
 * positioning — each requiring real DOM writes and layout reads) on first
 * paint blocked the main thread for ~490ms out of a ~710ms page navigation,
 * entirely for blocks stacked far below the fold nobody had scrolled to
 * yet. Fixed by deferring each <wb-demo>'s build via IntersectionObserver,
 * scoped to #siteBody (the actual scroll container — .site is pinned to
 * 100dvh with overflow:hidden, so the browser viewport itself never
 * scrolls here; IntersectionObserver's default viewport root would never
 * see anything change).
 *
 * Getting this wrong silently defeats the deferral entirely: two other
 * code paths (WB.scan()'s "#305 fallback" behavior-injection loop, and the
 * schema-processing loop) both independently discover <wb-demo> as a wb-*
 * tag and, unless explicitly excluded, race the lazy loader and build
 * every block eagerly anyway.
 */
import { test, expect } from '@playwright/test';

test.describe('#312 follow-up — <wb-demo> blocks build lazily, not all at once', () => {
  test('only a handful of demo blocks are built on initial load, not all of them', async ({ page }) => {
    await page.goto('http://localhost:3000/?page=behaviors');
    await page.waitForSelector('#mainPage-behaviors', { timeout: 20000 });
    await page.waitForTimeout(1000);

    const counts = await page.evaluate(() => {
      const all = [...document.querySelectorAll('wb-demo')];
      return { total: all.length, processed: all.filter((el) => el.querySelector('.wb-demo__grid')).length };
    });

    expect(counts.total, 'sanity check: the page should have many demo blocks').toBeGreaterThan(20);
    expect(
      counts.processed,
      `expected only the blocks near the top to build eagerly, got ${counts.processed}/${counts.total} processed on load`
    ).toBeLessThan(counts.total);
  });

  test('scrolling through the page eventually builds every demo block', async ({ page }) => {
    await page.goto('http://localhost:3000/?page=behaviors');
    await page.waitForSelector('#mainPage-behaviors', { timeout: 20000 });
    await page.waitForTimeout(1000);

    const siteBody = page.locator('#siteBody');
    // Scroll in fixed increments, recomputing scrollHeight fresh each time —
    // the page grows taller as more blocks build, so a stale scrollHeight
    // snapshot undershoots the true bottom.
    let lastScrollTop = -1;
    for (let i = 0; i < 60; i++) {
      const { scrollTop } = await siteBody.evaluate((el) => {
        el.scrollTop += 600;
        return { scrollTop: el.scrollTop };
      });
      await page.waitForTimeout(100);
      if (scrollTop === lastScrollTop) break;
      lastScrollTop = scrollTop;
    }
    await page.waitForTimeout(500);

    const counts = await page.evaluate(() => {
      const all = [...document.querySelectorAll('wb-demo')];
      return { total: all.length, processed: all.filter((el) => el.querySelector('.wb-demo__grid')).length };
    });

    expect(counts.processed, `expected every demo block to have built by the time the page is fully scrolled through, got ${counts.processed}/${counts.total}`).toBe(counts.total);
  });
});
