import { test, expect } from '@playwright/test';

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
 */

const WIDE = { width: 1220, height: 690 };

const ROW = '.behaviors-search-results__row';
const TOKEN = '.behaviors-search-results__token';
const CODE = '#behaviors-live-code pre code.hljs';

/** Panel top relative to the scroller's visible region. Negative = above it. */
async function panelTop(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const sb = document.getElementById('siteBody')!;
    const panel = document.querySelector('#behaviors-live')!;
    return Math.round(panel.getBoundingClientRect().top - sb.getBoundingClientRect().top);
  });
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
      await row.scrollIntoViewIfNeeded();
      await row.click();
      // highlight.js adds .hljs only once the panel's code is populated, so
      // this is the render barrier — not a sleep.
      await expect(page.locator(CODE)).toBeVisible({ timeout: 25000 });
    };

    await pick('audio');

    // Scroll the way a reader does to read the sample's source.
    await page.evaluate(() => {
      const sb = document.getElementById('siteBody')!;
      sb.scrollTop = sb.scrollHeight;
    });

    // The precondition must really hold, or this test proves nothing: the
    // scroller has to have moved far enough that the panel is off the top.
    const scrolled = await page.evaluate(() => {
      const sb = document.getElementById('siteBody')!;
      return { top: Math.round(sb.scrollTop), max: Math.round(sb.scrollHeight - sb.clientHeight) };
    });
    expect(
      scrolled.max,
      '#siteBody is not scrollable here, so this test cannot exercise the behavior '
      + 'it exists for. If the page shrank, pick a longer sample or a shorter viewport.',
    ).toBeGreaterThan(100);
    expect(await panelTop(page), 'panel should be above the fold before the click').toBeLessThan(0);

    // Pick a different sample.
    await pick('button');

    // Its preview has to be reachable. `>= 0` is the honest bar: the panel's
    // first pixel is at or below the top of the scroller's visible region, so
    // the sample just clicked can be seen without scrolling back up.
    await expect
      .poll(() => panelTop(page), {
        message:
          'The preview panel is still above the fold after selecting a sample, so the '
          + 'sample the reader just clicked cannot be seen without scrolling back up. '
          + 'pages/behaviors.html calls liveEl.scrollIntoView({ block: "start" }) but '
          + 'guards BOTH call sites with STACKED.matches, so the reveal never runs in '
          + 'the side-by-side layout.',
        timeout: 10000,
      })
      .toBeGreaterThanOrEqual(0);
  });
});
