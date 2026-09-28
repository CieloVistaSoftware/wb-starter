import { test, expect } from '../fixtures/offline';
import { settledWidthPercent } from '../helpers/settled-style';

/**
 * pages/behaviors.html's Progress Bars demo used `data-value="25"` /
 * `data-striped` on `<progress>` -- a Tier-1 Law 11 violation
 * (docs/claude/TIER1-LAWS.md: "No data-* Attributes on wb-* Components").
 * The live behavior handler for `progress` (tag-map.js maps it to
 * `semantics/progress.js`'s `progress()`) only ever reads the PLAIN
 * `value`/`striped` attributes via `element.getAttribute()` -- it never reads
 * `element.dataset`. So every bar silently read value=0, rendering all four
 * demo bars (labeled 25%/50%/75%/100%) as an empty 0% bar. Confirmed live via
 * screenshot (John, cards-permutation-matrix session).
 */
// Where this is checked moved. #664 took the static demo sections off the
// Behaviors page -- its examples are now built one at a time on demand, and
// every x-progress variant there shares one value -- so the page-wide scan
// found 0 bars. demos/site/feedback.html's Progress section is where the
// 0/25/50/75/100 plain-`value` bars live now, and it is the same regression:
// if progress() stopped reading plain `value` they would all read 0.
test.describe('Behaviors page: Progress Bars demo actually reflects its labeled value', () => {
  test('25/50/75/100 bars each render their own distinct, non-zero fill percentage', async ({ page }) => {
    await page.goto('/demos/site/feedback.html', { waitUntil: 'domcontentloaded' });
    const section = page.locator('#progress-progress');
    // The lazy runtime (#491) only builds near the viewport.
    await section.scrollIntoViewIfNeeded();

    const percents: number[] = [];
    for (const value of ['25', '50', '75', '100']) {
      const bar = section.locator(`[role="progressbar"][value="${value}"]`).first();
      await bar.scrollIntoViewIfNeeded();
      await expect(bar, `expected the value="${value}" demo bar to be built`).toBeVisible({ timeout: 20000 });
      const fill = bar.locator('.x-progress__bar');
      await expect(fill).toHaveCount(1);
      // #779: rendered fill, not the style attribute nothing writes any more.
      percents.push(await settledWidthPercent(fill));
    }

    // None should be stuck at 0 -- the exact bug: every bar silently read
    // value=0 because the markup used data-value instead of value.
    const zeroCount = percents.filter((p) => p === 0).length;
    expect(zeroCount, `expected no 0% bar, got zeros in: ${JSON.stringify(percents)}`).toBe(0);

    // Each must reflect its own value, not just be non-zero.
    expect(percents.map(Math.round), 'each bar fills to its own value').toEqual([25, 50, 75, 100]);
  });
});
