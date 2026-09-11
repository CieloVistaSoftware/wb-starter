/**
 * Issue Test: note-1769220751805-p0
 * BUG AS FILED: "Category buttons (Buttons, Inputs, Selection, etc.) do not
 * scroll to location" on the Behaviors page.
 *
 * WHY THIS FILE NO LONGER CLICKS CATEGORY BUTTONS
 * -----------------------------------------------
 * #666 deleted the thing the bug was about. The Behaviors page used to be 88
 * <div x-demo> blocks grouped under category headings -- ~13,000px of markup --
 * with a jump-nav of category buttons on top of it, and the reported bug was
 * that those buttons did not scroll to their section. Both the sections and the
 * jump-nav are gone: every example now lives in data/behavior-examples.json and
 * renders on demand in the live panel beside the selector, so there is nothing
 * below to jump TO and nothing left to scroll. See the comment block at
 * pages/behaviors.html:214.
 *
 * This spec was also never executed until #1091 added it to a project, so it
 * had never been reconciled with that change. Run as written it did not skip
 * either: its own guard (`if (await btn.count() === 0) continue`) never fired,
 * because Playwright's `:has-text()` is a case-insensitive SUBSTRING match and
 * the selector's ~600 rows offer plenty of accidental matches. It then blocked
 * on `click()` waiting for an element that never becomes actionable, until the
 * 30s test timeout -- a red test asserting a retired pattern.
 *
 * So it asserts the same USER need against the mechanism that replaced it: you
 * can reach any behavior from the navigator, and reaching it does not make the
 * page jump. And it pins the jump-nav as gone, so "bring the category buttons
 * back" is a deliberate decision rather than an accident.
 */
import { test, expect } from '@playwright/test';

/** The selector fills from two registries plus two data files. */
async function openBehaviors(page: import('@playwright/test').Page) {
  await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 100,
    null,
    { timeout: 30000 },
  );
}

test.describe('Issue note-1769220751805-p0: reaching a behavior from the navigator', () => {
  test('the category jump-nav is gone — the selector is what reaches a behavior', async ({ page }) => {
    await openBehaviors(page);

    const leftovers = await page.evaluate(
      () => document.querySelectorAll('.category-nav, .categories, [data-categories], [data-category]').length,
    );
    expect(
      leftovers,
      'the per-category jump-nav was removed with the demo sections (#666). If it is '
      + 'back, this issue is live again and this spec needs the click-through it used to have.',
    ).toBe(0);

    // ...and the thing that replaced it is present and populated.
    await expect(page.locator('#behaviors-search')).toBeVisible();
  });

  test('searching selects the matching behavior and renders it, without scrolling the page', async ({ page }) => {
    await openBehaviors(page);

    const scroller = '#siteBody';
    const before = await page.evaluate(
      (sel) => Math.round((document.querySelector(sel) || document.scrollingElement)!.scrollTop),
      scroller,
    );

    // The page selects the best match as you type (applyFilter -> bestMatch).
    await page.fill('#behaviors-search', 'alert');

    await page.waitForFunction(
      () => {
        const row = document.querySelector('.behaviors-search-results__row[aria-current="true"]') as HTMLElement | null;
        if (!row) return false;
        // bestMatch() scores on the displayed label AND the x-* attribute, so
        // either one carrying the query is a correct selection.
        return `${row.dataset.label || ''} ${row.dataset.browseToken || ''}`.includes('alert');
      },
      null,
      { timeout: 15000 },
    );

    // The point of the panel: the example RUNS, where you already are.
    // #behaviors-live-example, not the stage -- the stage always holds the
    // example wrapper, so counting ITS children would pass before anything
    // rendered.
    await page.waitForFunction(
      () => (document.getElementById('behaviors-live-example')?.children.length ?? 0) > 0,
      null,
      { timeout: 15000 },
    );

    const after = await page.evaluate(
      (sel) => Math.round((document.querySelector(sel) || document.scrollingElement)!.scrollTop),
      scroller,
    );

    expect(
      after,
      'reaching a behavior must not move the page -- the whole reason the demo sections '
      + 'and their jump-nav were replaced by a panel beside the list.',
    ).toBe(before);
  });
});
