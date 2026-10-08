import { test, expect } from '../fixtures/offline';

/**
 * <div x-timeline> is a custom element; timeline.css's `.x-timeline` rule
 * never declared `display`, so the browser's default for an unknown tag
 * (`inline`) applied. That broke the absolutely-positioned `::before`
 * connecting line (an inline containing block gives `top:0;bottom:0` no
 * sane block height to span) and mixed badly with the `display:block`
 * .x-timeline__item children built by src/wb-viewmodels/semantics/timeline.js.
 * Confirmed live on ?page=behaviors: the items rendered (text was there)
 * but the timeline read as broken/unstyled -- "why is this not working?".
 * Fixed by adding `display: block` to `.x-timeline`.
 */

// Checked on demos/site/layout.html now. The Behaviors page lost its static
// timeline section in #664 (examples are built on demand in a panel), so
// `[x-timeline]` there matched nothing until a row was picked and the test
// timed out. layout.html still carries this exact five-item timeline.
test.describe('[x-timeline] renders as a real block with a visible connecting line', () => {
  test('?page=behaviors: [x-timeline] is display:block with a real-height ::before line', async ({ page }) => {
    await page.goto('/demos/site/layout.html', { waitUntil: 'domcontentloaded' });

    const timeline = page.locator('[x-timeline][items^="Project Kickoff"]').first();
    // Kept in view until it is built, not scrolled to once. The lazy runtime
    // builds an element when it intersects; the demos ABOVE this one build
    // after domcontentloaded and grow, pushing the timeline back out of view,
    // so a single early scroll left it unbuilt (1 run in 3, even alone).
    await expect.poll(async () => {
      await timeline.scrollIntoViewIfNeeded();
      return timeline.getAttribute('x-ready');
    }, { timeout: 20000, message: 'the timeline was never built' }).toBe('');

    await expect(timeline).toHaveCSS('display', 'block');

    const items = timeline.locator('.x-timeline__item');
    await expect(items).toHaveCount(5);
    await expect(items.first()).toContainText('Project Kickoff');

    const lineHeight = await timeline.evaluate((el) => {
      const before = getComputedStyle(el, '::before');
      return parseFloat(before.height);
    });
    expect(lineHeight, 'the ::before connecting line must span a real, non-zero height').toBeGreaterThan(50);
  });
});
