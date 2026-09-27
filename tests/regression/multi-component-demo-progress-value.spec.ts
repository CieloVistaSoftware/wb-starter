import { test, expect } from '../fixtures/offline';

/**
 * demos/multi-component-demo-generated.html's "Progress — All Enum Variants"
 * section (generated from src/wb-models/pages/multi-component-demo.page.json
 * via scripts/compose-page.mjs) enumerated every `variant`/`size` value with
 * NO `value` attribute set -- x-progress defaults `value` to its schema
 * minimum (0), so every bar rendered at 0% width. A 0-width fill paints no
 * color, so all six variant bars (and all five size bars) looked visually
 * identical -- "NONE not one of the variants are working" (they were, the
 * demo just couldn't show it).
 *
 * Root cause: scripts/auto-showcase.mjs's enum-sweep generator only filled
 * in OTHER schema properties when they were `required` -- `value` isn't
 * required (0 is a valid, common default), so it was never included. Fixed
 * generically in auto-showcase.mjs (any ranged number prop whose default
 * sits at its own minimum now gets a representative 60%-of-range value in
 * enum-sweep demos), and applied directly to this hand-composed page's
 * source JSON + regenerated HTML since it isn't produced by auto-showcase.mjs
 * itself.
 *
 * Updated: the page was renamed demos/multi-behavior-demo-generated.html
 * (482b940c), so the old URL served nothing and the heading never appeared.
 * And progress() MORPHS the element -- the authored <progress value="60">
 * is replaced by its own div.x-progress (value carried over) -- so counting
 * `progress` after the runtime has run counts only the blocks not yet built.
 * Each bar is brought into view first (lazy runtime, #491), then read in
 * whichever form it is in.
 */

test.describe('multi-component-demo-generated.html: progress enum sweep is actually visible', () => {
  test('every progress demo in the enum-variants section has a non-zero value/fill', async ({ page }) => {
    await page.goto('/demos/multi-behavior-demo-generated.html', { waitUntil: 'domcontentloaded' });

    const heading = page.getByRole('heading', { name: /Progress — All Enum Variants/i });
    await expect(heading).toBeVisible({ timeout: 20000 });

    // Every bar demo in the page, in authored order: the <div x-demo> blocks
    // whose grid holds a progress bar (built or not yet built).
    const demos = page.locator('[x-demo]').filter({ has: page.locator('progress, .x-progress') });
    const count = await demos.count();
    expect(count).toBeGreaterThanOrEqual(11); // 6 variants + 5 sizes

    for (let i = 0; i < count; i++) {
      const demo = demos.nth(i);
      await demo.scrollIntoViewIfNeeded();
      const bar = demo.locator('.x-progress').first();
      await expect(bar, `progress demo #${i} should be built into a .x-progress bar`).toBeAttached({ timeout: 10000 });
      await expect(bar).toHaveAttribute('value', '60');

      const fill = bar.locator('[class*="fill"], [class*="bar"]').first();
      await expect
        .poll(() => fill.evaluate((el) => el.getBoundingClientRect().width), {
          message: `x-progress #${i}'s fill should have real, non-zero rendered width at value=60`,
          timeout: 10000,
        })
        .toBeGreaterThan(0);
    }
  });
});
