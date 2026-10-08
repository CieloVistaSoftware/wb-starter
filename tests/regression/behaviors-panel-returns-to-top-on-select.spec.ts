import { test, expect } from '../fixtures/offline';
import { openGroup } from '../helpers/behaviors-page';

/**
 * Picking a sample must bring its preview into view.
 *
 * John, pointing at the browse page: "Clicking on any sample will scroll to
 * the top element here" — then: "write a test that scrolls this part down to
 * read the text, then click an element over here."
 *
 * You scroll down to read one sample's code, you pick the next sample from the
 * list, and the preview for the one you just picked has to be somewhere you
 * can see it. Today it is not.
 *
 * MEASURED, three consecutive runs at 1220x690:
 *
 *   scroll #siteBody to the bottom  -> panel top  -329px   (above the fold)
 *   click a different sample        -> panel top  -328px   (still above it)
 *
 * The panel moves by a single pixel. The reader clicks a sample and the thing
 * they asked for stays off-screen; nothing errors, the page simply does not
 * follow the click.
 *
 * SCROLL THE RIGHT THING
 *
 * `#siteBody` is the scroller, not the document. The document reports only
 * ~19px of scrollable height at every viewport size, so `window.scrollTo` and
 * `window.scrollY` both look almost static and measuring them proves nothing.
 * `#siteBody` has 402px at this size. An earlier draft of this test scrolled
 * the window and passed while the bug was live.
 *
 * Positions are therefore measured RELATIVE TO #siteBody's own box: a panel
 * top of -329 means 329px above the visible region of the scroller. Using
 * viewport coordinates would conflate the shell's chrome with the scroll.
 *
 * WHY IT SURVIVED
 *
 * pages/behaviors.html does have the reveal — twice — and both are guarded:
 *
 *   if (reveal && STACKED.matches) liveEl.scrollIntoView({ block: 'start' });
 *   if (STACKED.matches)           liveEl.scrollIntoView({ block: 'start' });
 *
 * `STACKED` is the narrow media query. Stacked, the panel sits below the list
 * and is obviously missing, so it got fixed there. Side by side it is merely
 * above the fold of an inner scroller — just as invisible, far easier to miss.
 *
 * PICK BY NAME, NOT BY INDEX
 *
 * The row list is fetched, so `nth(6)` is a different sample from run to run.
 * Measuring with indices produced numbers that swung between -241 and +94 and
 * looked like a race; it was two different samples being compared. Named rows
 * are stable, which is what made the one-pixel result above reproducible.
 *
 * THE SCROLLER MOVED (#992)
 *
 * #992 gave the live panel a fixed height and its own scrollbar, so the page
 * no longer scrolls at all -- #siteBody is overflow:hidden with 0px to scroll
 * (measured at this viewport: 626 of 626) and the precondition below failed
 * on every run. Reading a long sample now means scrolling #behaviors-live
 * itself, and the same bug in the new layout is that panel keeping its
 * scroll position across selections (selectRow() now resets it). So the
 * scroller measured here is #behaviors-live, and "in view" is its scrollTop
 * back at 0 -- the preview's first pixel at the top of the panel.
 */

const WIDE = { width: 1220, height: 690 };

const ROW = '.behaviors-search-results__row';
const TOKEN = '.behaviors-search-results__token';
const CODE = '#behaviors-live-code pre code.hljs';

/** How far the live panel has been scrolled down. 0 = its preview is at the top. */
async function panelScroll(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => Math.round(document.getElementById('behaviors-live')!.scrollTop));
}

test.describe('behaviors browse: selecting a sample reveals its preview', () => {
  test.use({ viewport: WIDE });

  test('after scrolling down to read the code, clicking another sample brings the preview back into view', async ({ page }) => {
    await page.goto('/?page=behaviors');
    await expect(page.locator(ROW).first()).toBeVisible({ timeout: 25000 });

    /** Click the row whose token is exactly `name`, and wait for its code. */
    const pick = async (name: string) => {
      const row = page.locator(ROW)
        .filter({ has: page.locator(TOKEN, { hasText: new RegExp(`^${name}$`) }) })
        .first();
      // #995 folds a behavior's several option rows into a <details> that is
      // collapsed until the reader expands it ("the user must expand it
      // first"). audio and button both have several options, so their rows
      // are hidden inside a closed group and could never be scrolled to.
      // Expand the group the way a reader does -- its summary -- then pick.
      const group = row.locator('xpath=ancestor::details[1]');
      await openGroup(group);
      await row.scrollIntoViewIfNeeded();
      await row.click();
      // highlight.js adds .hljs only once the panel's code is populated, so
      // this is the render barrier — not a sleep.
      await expect(page.locator(CODE)).toBeVisible({ timeout: 25000 });
    };

    await pick('audio');

    // Scroll the way a reader does to read the sample's source.
    await page.evaluate(() => {
      const live = document.getElementById('behaviors-live')!;
      live.scrollTop = live.scrollHeight;
    });

    // The precondition must really hold, or this test proves nothing: the
    // panel has to have moved far enough that its preview is off the top.
    const max = await page.evaluate(() => {
      const live = document.getElementById('behaviors-live')!;
      return Math.round(live.scrollHeight - live.clientHeight);
    });
    expect(
      max,
      '#behaviors-live is not scrollable here, so this test cannot exercise the behavior '
      + 'it exists for. If the panel shrank, pick a longer sample or a shorter viewport.',
    ).toBeGreaterThan(100);
    expect(await panelScroll(page), 'panel should be scrolled down before the click').toBeGreaterThan(100);

    // Pick a different sample.
    await pick('button');

    // Its preview has to be reachable. `>= 0` is the honest bar: the panel's
    // first pixel is at or below the top of the scroller's visible region, so
    // the sample just clicked can be seen without scrolling back up.
    await expect
      .poll(() => panelScroll(page), {
        message:
          'The live panel kept its scroll position after selecting a sample, so the '
          + 'sample the reader just clicked renders above the visible area of the panel.',
        timeout: 10000,
      })
      .toBe(0);
  });
});
