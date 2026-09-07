/**
 * AUTOSCROLL TOURS WHAT YOU EXPANDED, NOT EVERYTHING
 * ==================================================
 * #1004 - John: "if autoscroll is pressed after a details control is expanded
 * only show those items expanded."
 *
 * AutoScroll used to force all 70 groups open before starting, from the earlier
 * "expand all groups" instruction. That threw away a decision the reader had
 * already made: opening `dialog` and `button` says those are what you want to
 * look at, and force-expanding turned a handful of entries into a 767-entry
 * tour.
 *
 * Expanding everything is still correct when NOTHING is open - otherwise the
 * tour visits ~156 collapsed group headers and shows none of the options
 * underneath them (#995). So both behaviours are required, and both are
 * asserted here: honour a selection when one exists, fall back to everything
 * when there is none.
 */

import { test, expect } from '@playwright/test';

async function openBehaviors(page: any) {
  await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 100,
    undefined,
    { timeout: 30_000 }
  );
  await page.locator('#behaviors-autoscroll').waitFor({ state: 'attached', timeout: 20_000 });
}

test.describe('AutoScroll respects the expanded groups (#1004)', () => {
  test('with a group expanded, it expands nothing else', async ({ page }) => {
    await openBehaviors(page);

    const result = await page.evaluate(async () => {
      // Navigator groups only — see the note in the sibling test: the live
      // panel's API and Documentation disclosures are <details> too, and
      // counting them measures something AutoScroll never claims to touch.
      const LIST = '#behaviors-search-results';
      const inList = () =>
        [...document.querySelectorAll(`${LIST} details`)] as HTMLDetailsElement[];

      const groups = inList();
      for (const g of groups) g.open = false;
      const target = groups.find((d) =>
        /dialog/i.test((d.querySelector('summary') || {}).textContent || '')
      );
      if (!target) return null;
      target.open = true;
      await new Promise((r) => setTimeout(r, 500));

      const openBefore = groups.filter((d) => d.open).length;
      const visibleBefore = [...document.querySelectorAll('.behaviors-search-results__row')].filter(
        (r) => (r as HTMLElement).offsetParent !== null
      ).length;

      const btn = document.getElementById('behaviors-autoscroll') as HTMLElement;
      btn.click();
      await new Promise((r) => setTimeout(r, 2500));
      const openAfter = inList().filter((d) => d.open).length;
      btn.click(); // stop the tour
      await new Promise((r) => setTimeout(r, 300));

      return { totalGroups: groups.length, openBefore, openAfter, visibleBefore };
    });

    test.skip(!result, 'no dialog group to expand on this page');
    expect(result!.openBefore, 'the fixture did not end up with exactly one group open').toBe(1);
    expect(
      result!.openAfter,
      `AutoScroll expanded ${result!.openAfter} of ${result!.totalGroups} groups instead of honouring the 1 that was open`
    ).toBe(result!.openBefore);
  });

  test('with nothing expanded, it still opens everything', async ({ page }) => {
    // The fallback matters as much as the new rule: without it, pressing
    // AutoScroll on a fully collapsed list tours group headers and shows none
    // of the options inside them.
    await openBehaviors(page);

    const result = await page.evaluate(async () => {
      // Scoped to the navigator. `document.querySelectorAll('details')` also
      // picks up the live panel's own API and Documentation disclosures, which
      // are not groups and are not tour targets — AutoScroll opened all 70
      // groups and the count still read 70 of 72, failing on two <details> the
      // feature is not supposed to touch.
      const LIST = '#behaviors-search-results';
      const inList = () =>
        [...document.querySelectorAll(`${LIST} details`)] as HTMLDetailsElement[];

      const groups = inList();
      for (const g of groups) g.open = false;
      await new Promise((r) => setTimeout(r, 400));
      const openBefore = groups.filter((d) => d.open).length;

      const btn = document.getElementById('behaviors-autoscroll') as HTMLElement;
      btn.click();
      await new Promise((r) => setTimeout(r, 2500));
      const openAfter = inList().filter((d) => d.open).length;
      btn.click(); // stop the tour
      await new Promise((r) => setTimeout(r, 300));

      return { totalGroups: groups.length, openBefore, openAfter };
    });

    expect(result.openBefore, 'the fixture did not start fully collapsed').toBe(0);
    expect(
      result.openAfter,
      'with nothing expanded AutoScroll must open every group, or it tours headers instead of options'
    ).toBe(result.totalGroups);
  });
});
