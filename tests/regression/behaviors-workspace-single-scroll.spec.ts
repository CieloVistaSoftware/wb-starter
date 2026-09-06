/**
 * THE BEHAVIORS WORKSPACE FILLS THE WINDOW — AND STILL WORKS ON A PHONE
 * =====================================================================
 * John, arrows drawn on the right edge of the behaviors page: "we don't need 2
 * vertical scroll bars", and on the left edge: "1rem gap on side" (#1020).
 *
 * The two bars came from sizing the workspace off the VIEWPORT while it lives
 * inside a container that is not the viewport. `.site__body` is the site's
 * single scroll container by design (site.css: `.site` is 100dvh with
 * overflow:hidden, `.site__body` is flex:1 overflow-y:auto), and
 * `.behaviors-browse { height: calc(100vh - 10rem) }` guessed at the chrome
 * above it and guessed high — so the workspace overflowed `.site__body` and
 * both scrolled, a few pixels apart.
 *
 * The fix is a flex chain from `.site__main` down, every link carrying
 * `min-height: 0` (a flex child floors at `min-height: auto`, i.e. its content
 * height — measured at 10343px for the 184-row list, which put the overflow
 * straight back).
 *
 * WHY THE MOBILE HALF OF THIS FILE EXISTS
 * ---------------------------------------
 * The first version of that fix applied at every width. Measured at 375x812:
 * the behaviour navigator rendered **2px tall**, and because `.site__body` had
 * been told not to scroll there was no way to reach it or anything else — the
 * phone layout was frozen. Two panels sharing one fixed-height row is a
 * wide-screen idea; stacked, the same rules crush the first panel to nothing.
 * DEMOS-AND-DOCS-STANDARDS.md §10 is mobile-first, so the whole treatment now
 * sits inside the page's own two-column breakpoint and the narrow layout keeps
 * the site's ordinary flow.
 *
 * Both halves are geometry measured from the live page, not CSS read back.
 */

import { test, expect } from '@playwright/test';

const DESKTOP = { width: 1427, height: 861 };
const MOBILE = { width: 375, height: 812 };

async function openBehaviors(page: import('@playwright/test').Page) {
  await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
  await page.locator('#behaviors-workspace').waitFor({ state: 'attached', timeout: 20_000 });
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row, .behaviors-search-results__group').length > 0,
    undefined,
    { timeout: 20_000 },
  );
}

test.describe('behaviors workspace scrolling and gap (#1020)', () => {
  test('desktop: the outer container does not scroll — only the panels do', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await openBehaviors(page);

    const measured = await page.evaluate(() => {
      const body = document.querySelector('#siteBody') as HTMLElement;

      // #1020 is about a SECOND SCROLLBAR appearing beside the panel's own.
      // Ask that question directly: try to scroll the container and see whether
      // it moves. Comparing scrollHeight to clientHeight does NOT answer it --
      // the fix is `overflow: hidden` on this element, and an overflow:hidden
      // box still reports scrollHeight as its full content size. That proxy
      // failed on 7px of clipped content while the page had no page-level
      // scrollbar at all, which is the state the test exists to protect.
      body.scrollTop = 1000;
      const movedAfterScroll = body.scrollTop;
      body.scrollTop = 0;

      return {
        movedAfterScroll,
        // Each panel keeps its OWN scrollbar — that is the one bar we want.
        listScrolls: (() => {
          const el = document.querySelector('#behaviors-search-results') as HTMLElement;
          return el.scrollHeight > el.clientHeight;
        })(),
      };
    });

    expect(
      measured.movedAfterScroll,
      'PAGE-LEVEL SCROLLBAR IS BACK: #siteBody scrolled, which is the '
      + 'two-bars-side-by-side state from #1020. Something inside the workspace '
      + 'is taller than the space it was given — check that every link in the '
      + 'flex chain still carries min-height: 0, and that .site__body still '
      + 'clips on this page.',
    ).toBe(0);

    expect(measured.listScrolls, 'the results list should still scroll on its own').toBe(true);
  });

  test('desktop: both panels fill the row, and there is a gap at the side', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await openBehaviors(page);

    const measured = await page.evaluate(() => {
      const r = (sel: string) => document.querySelector(sel)!.getBoundingClientRect();
      const list = r('#behaviors-search-results');
      const live = r('#behaviors-live');
      const nav = document.querySelector('.site__nav') || document.querySelector('nav');
      return {
        listHeight: list.height,
        liveHeight: live.height,
        gapFromNav: list.left - (nav as HTMLElement).getBoundingClientRect().right,
        viewportHeight: window.innerHeight,
      };
    });

    // "both of these elements must be 100vh" (#1018) — in practice: they fill
    // whatever the container gives them, which is most of the window.
    expect(measured.listHeight).toBeGreaterThan(measured.viewportHeight * 0.6);
    expect(Math.round(measured.liveHeight)).toBe(Math.round(measured.listHeight));

    // "1rem gap on side" — a real gap, not the 0 that came before it, and not
    // the ~227px of dead reading-width margin that came before that.
    expect(measured.gapFromNav).toBeGreaterThanOrEqual(15);
    expect(measured.gapFromNav).toBeLessThan(40);
  });

  test('mobile: the navigator is not crushed and the page still scrolls', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await openBehaviors(page);

    const measured = await page.evaluate(() => {
      const body = document.querySelector('#siteBody') as HTMLElement;
      const list = document.querySelector('#behaviors-search-results') as HTMLElement;
      return {
        listHeight: list.getBoundingClientRect().height,
        rows: document.querySelectorAll('.behaviors-search-results__row, .behaviors-search-results__group').length,
        outerOverflowY: getComputedStyle(body).overflowY,
        outerScrolls: body.scrollHeight > body.clientHeight,
      };
    });

    expect(
      measured.listHeight,
      `THE NAVIGATOR IS CRUSHED: ${measured.rows} rows rendered into `
      + `${Math.round(measured.listHeight)}px. The desktop full-height treatment has `
      + 'escaped its breakpoint — it belongs inside @media (min-width: 60.0625rem).',
    ).toBeGreaterThan(100);

    expect(
      measured.outerOverflowY,
      'THE PHONE LAYOUT IS FROZEN: #siteBody was told not to scroll at a width where '
      + 'the panels stack, so everything below the fold is unreachable.',
    ).not.toBe('hidden');
    expect(measured.outerScrolls).toBe(true);
  });
});
