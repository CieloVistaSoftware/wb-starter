import { test, expect, type Page } from '../fixtures/offline';
import { buildInView } from '../base';

/**
 * Feedback page responsive showcase layout.
 *
 * This used to assert that every demo grid ran THREE columns at 1280px, two at
 * 900px and one at 600px. That layout is gone on purpose: #538 split each
 * section's permutation sweep into one <div x-demo columns="1"> per instance
 * (one code sample per rendered element, standards §2), and #563 then stacked
 * those demos vertically instead of grid-wrapping them, because §3 says demos
 * are "vertical -- never side-by-side". So there was no three-column grid left
 * to measure -- and its wait for EVERY demo to build could never finish on the
 * lazy runtime (#491 builds only near the viewport), so it timed out.
 *
 * What the page must do instead, at every width: each demo shows exactly one
 * rendered element in a single track, and no two demos share a row.
 */

async function measure(page: Page) {
  return page.evaluate(() => {
    const demos = Array.from(document.querySelectorAll('[x-demo]'))
      .filter((demo) => demo.querySelector('.x-demo__grid'));
    return demos.map((demo) => {
      const grid = demo.querySelector('.x-demo__grid')!;
      const columns = getComputedStyle(grid).gridTemplateColumns.trim();
      const r = demo.getBoundingClientRect();
      return {
        declared: demo.getAttribute('columns'),
        tracks: columns ? columns.split(/\s+/).length : 0,
        top: r.top,
        bottom: r.bottom,
      };
    });
  });
}

test.describe('Feedback page responsive showcase layout', () => {
  test('demos stack vertically, one element per demo, at desktop, tablet and phone widths', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/demos/site/feedback.html', { waitUntil: 'domcontentloaded' });
    // Build the first screenful-and-a-bit of demos (the lazy runtime would
    // leave the rest as bare markup until scrolled to).
    const demos = page.locator('[x-demo][columns="1"]');
    for (let i = 0; i < 6; i++) await buildInView(demos.nth(i));
    await page.evaluate(() => window.scrollTo(0, 0));

    for (const width of [1280, 900, 600]) {
      await page.setViewportSize({ width, height: 900 });
      const built = await measure(page);
      const single = built.filter((d) => d.declared === '1');
      expect(single.length, `${width}px: no built single-instance demos to measure`).toBeGreaterThanOrEqual(6);

      // One rendered element per demo: a single grid track.
      expect(single.map((d) => d.tracks), `${width}px: a columns="1" demo rendered more than one track`)
        .toEqual(single.map(() => 1));

      // Vertical, never side-by-side (§3): in document order, each demo starts
      // at or below the bottom of the one before it.
      const sorted = [...built].sort((a, b) => a.top - b.top);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].top, `${width}px: two demos share a row`).toBeGreaterThanOrEqual(sorted[i - 1].bottom - 1);
      }
    }
  });
});
