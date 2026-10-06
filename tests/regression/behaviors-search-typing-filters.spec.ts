import { test, expect } from '../fixtures/offline';

/**
 * Typing on the behaviors page filters the list.
 *
 * John, pointing at the browse list scrolled partway down: "typing keys here
 * should filter eg prog should show all with that string etc."
 *
 * The filter itself worked -- dispatching an input event narrowed 754 rows to
 * 30. What did not work is the thing a person actually does: scroll into the
 * list, start typing, and expect it to filter. `.behaviors-search` was
 * `position: static`, so once you scroll it is gone from the viewport, focus is
 * nowhere, and every keystroke falls on the floor. The feature was fine and
 * unreachable, which to the person using it is the same as broken.
 *
 * Two fixes, one test each:
 *   the search bar stays visible while the list scrolls (sticky)
 *   typing a printable key anywhere routes to the search box (type-to-search)
 */

const ROW = '.behaviors-search-results__row';

test.describe('behaviors page: typing filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?page=behaviors');
    // A VISIBLE row, not the first one: groups start collapsed except the one
    // holding the preselected row (#995), so the first row in the DOM is hidden
    // whenever the first group is not the preselected one. In the 1.0 release
    // gate `article (14)` sat first and closed, and this waited 25s on a row
    // that was correctly hidden. The page is live once the preselected row's
    // source is highlighted (#771), which follows the stage scan.
    await expect(page.locator('#behaviors-live-code pre code.hljs')).toBeAttached({ timeout: 25000 });
    await expect(page.locator(`${ROW}:visible`).first()).toBeVisible();
  });

  test('the search box stays on screen while the list is scrolled', async ({ page }) => {
    const topBefore = await page.locator('#behaviors-search').evaluate((el) => el.getBoundingClientRect().top);

    // #siteBody is the real scroller on this site, not document.
    await page.evaluate(() => {
      const sb = document.getElementById('siteBody') || document.scrollingElement!;
      sb.scrollTop = 900;
    });
    // Polled, not slept (#1516): the sticky box must be (and stay) in view.
    await expect.poll(() => page.locator('#behaviors-search').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    }), { message: 'the search box stays on screen after scrolling 900px' }).toBe(true);

    const box = await page.locator('#behaviors-search').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, h: window.innerHeight };
    });

    expect(
      box.bottom > 0 && box.top < box.h,
      `after scrolling 900px the search box sits at top=${Math.round(box.top)} ` +
      `(viewport ${box.h}) — it scrolled out of view, so there is nothing to type into. ` +
      `It was at top=${Math.round(topBefore)} before scrolling.`,
    ).toBe(true);
  });

  test('typing anywhere filters, without clicking the box first', async ({ page }) => {
    await page.evaluate(() => {
      const sb = document.getElementById('siteBody') || document.scrollingElement!;
      sb.scrollTop = 900;
      (document.activeElement as HTMLElement | null)?.blur();
    });
    // One frame for the scroll and blur to land.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));

    const before = await page.locator(ROW).count();

    // Exactly what a person does: just start typing.
    await page.keyboard.type('prog', { delay: 60 });

    // Retrying waits (#1516): the box holds the keystrokes, the list narrows.
    await expect(page.locator('#behaviors-search'), 'the keystrokes never reached the search box').toHaveValue('prog');
    const value = await page.locator('#behaviors-search').inputValue();
    expect(value, 'the keystrokes never reached the search box').toBe('prog');

    const rows = page.locator(ROW);
    await expect.poll(() => rows.count(), { message: `the list did not narrow (${before} rows before)` }).toBeLessThan(before);
    const after = await rows.count();
    expect(after, `the list did not narrow (${before} rows before, ${after} after)`).toBeLessThan(before);

    // Every surviving row must actually match what was typed.
    const texts = await rows.evaluateAll((els) => els.map((e) => (e.textContent || '').toLowerCase()));
    expect(
      texts.every((t) => t.includes('prog')),
      `some rows do not match "prog": ${texts.filter((t) => !t.includes('prog')).slice(0, 3).join(', ')}`,
    ).toBe(true);
  });

  test('typing does not hijack keys meant for another field', async ({ page }) => {
    // Type-to-search must not steal input from a real control, or the theme
    // picker and every future input on this page become untypable.
    await page.evaluate(() => {
      const el = document.querySelector('select, input:not(#behaviors-search)') as HTMLElement | null;
      el?.focus();
    });
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName || '');
    test.skip(!focusedTag || focusedTag === 'BODY', 'no other focusable control on the page');

    await page.keyboard.type('zz', { delay: 40 });
    const search = await page.locator('#behaviors-search').inputValue();
    expect(search, 'typing into another control leaked into the search box').not.toContain('zz');
  });
});
