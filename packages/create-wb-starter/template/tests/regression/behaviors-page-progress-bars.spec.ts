import { test, expect } from '@playwright/test';

/**
 * pages/behaviors.html's Progress Bars demo used `data-value="25"` /
 * `data-striped` on `<progress>` -- a Tier-1 Law 11 violation
 * (docs/claude/TIER1-LAWS.md: "No data-* Attributes on wb-* Behaviors").
 * The live behavior handler for `x-progress` (tag-map.js maps it to
 * `semantics/progress.js`'s `progress()`) only ever reads the PLAIN
 * `value`/`striped` attributes via `element.getAttribute()` -- it never reads
 * `element.dataset`. So every bar silently read value=0, rendering all four
 * demo bars (labeled 25%/50%/75%/100%) as an empty 0% bar. Confirmed live via
 * screenshot (John, cards-permutation-matrix session).
 */
test.describe('Behaviors page: Progress Bars demo actually reflects its labeled value', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=behaviors');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage, { timeout: 20000 });
    await page.waitForTimeout(1000);
  });

  test('25/50/75/100 bars each render their own distinct, non-zero fill percentage', async ({ page }) => {
    const bars = page.locator('main').getByText(/^\d+%$/).locator('xpath=ancestor::x-progress[1]');
    // Fall back to a direct selector if the label-based lookup above doesn't
    // resolve (label text lives in a child .x-progress__label span).
    const progressEls = page.locator('x-progress');
    const count = await progressEls.count();
    expect(count, 'expected the 4 demo <progress> elements to be present').toBeGreaterThanOrEqual(4);

    const percents: number[] = [];
    for (let i = 0; i < count; i++) {
      const pct = await progressEls.nth(i).evaluate((el) => {
        const bar = el.querySelector('.x-progress__bar') as HTMLElement | null;
        if (!bar) return null;
        return parseFloat(bar.style.width || '0');
      });
      if (pct !== null) percents.push(pct);
    }

    // None should be stuck at 0 -- the exact bug: every bar silently read
    // value=0 because the markup used data-value instead of value.
    const zeroCount = percents.filter((p) => p === 0).length;
    expect(zeroCount, `expected at most one legitimately-0% bar, got zeros in: ${JSON.stringify(percents)}`).toBeLessThanOrEqual(0);

    // The four demo bars are labeled 25/50/75/100 -- each must differ from
    // the others (not just "non-zero", but actually reflecting its own value).
    const unique = new Set(percents.map((p) => Math.round(p)));
    expect(unique.size, `expected 4 distinct fill percentages, got: ${JSON.stringify(percents)}`).toBeGreaterThanOrEqual(4);
  });
});
