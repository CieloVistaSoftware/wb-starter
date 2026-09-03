/**
 * THE BROWSE SURFACE MUST FIT ITS SCROLLER
 * ========================================
 * #992 — John, three times over:
 *   "each nav item, when clicked must position the top of that choice to the
 *    same place"
 *   "when navigating using the down arrow, the current item selected must show
 *    100% of it height in the bottom most element"
 *   "I want to see the top of this card example" /
 *   "when using down arrow, it frequently will not show the entire right side"
 *
 * Three complaints, one bug. The list was capped to the PANEL's height (#710)
 * and the panel to its own content, so nothing was capped to the space
 * available — the workspace ran past the bottom of its scroller and that strip
 * could only be reached by scrolling away from what you were reading.
 *
 * TWO MISTAKES ARE ENCODED HERE SO THEY ARE NOT REPEATED:
 *
 * 1. Measure against the SCROLLER (#siteBody), never the window. #app is
 *    viewport-sized and overflow:hidden; #siteBody is what actually scrolls.
 *    A first fix sized against window.innerHeight and a viewport-relative top —
 *    but that top moves as the scroller scrolls, so the cap was only valid at
 *    the offset it was computed at (measured: a 650px cap written while the
 *    panel's top read -118). Distances between two elements inside the same
 *    scroller are scroll-invariant; viewport distances are not.
 *
 * 2. NO POLLING (Law 18). The first version of this test slept 120ms per
 *    keypress and was flaky 2 runs in 5. Replacing the sleep with the page's
 *    own `wb:layout-settled` notification immediately exposed the real defect:
 *    the sizing sync did not run on every selection, so there was nothing to
 *    wait for. The flakiness was a missing signal, not an impatient test.
 *
 * Also: the keydown listener is on the LIST, not the search box. Dispatching
 * ArrowDown at the input does nothing and yields a test that asserts nothing.
 */

import { test, expect } from '@playwright/test';

const LIST = '#behaviors-search-results';
const PANEL = '#behaviors-live';
const SCROLLER = '#siteBody';
const WORKSPACE = '#behaviors-workspace';
const ROW = '.behaviors-search-results__row';

async function ready(page) {
  await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.locator(`${LIST} ${ROW}`).count(), { timeout: 25_000 }).toBeGreaterThan(0);
  // Law 18: wait for the page to SAY it is sized. x-ready is cleared whenever a
  // new sync is queued, so this cannot read a stale signal.
  await page.waitForSelector(`${WORKSPACE}[x-ready]`, { timeout: 20_000 });
}

test.describe('browse surface fits its scroller (#992)', () => {
  test('neither column extends past the scroller', async ({ page }) => {
    // A real window, not the 720px CI default. At 720 the scroller is only
    // 452px tall and the panel's own offset leaves less than the 240px minimum
    // below it, so the floor that keeps the list usable necessarily wins and
    // the columns overflow — that case is covered by the short-window test
    // below, which asserts the floor holds AND the overflow stays reachable.
    // Asserting a strict fit at a height where it is geometrically impossible
    // would be asserting a falsehood.
    await page.setViewportSize({ width: 1440, height: 900 });
    await ready(page);

    const box = await page.evaluate(({ LIST, PANEL, SCROLLER }) => {
      const s = document.querySelector(SCROLLER)!.getBoundingClientRect();
      const l = document.querySelector(LIST)!.getBoundingClientRect();
      const p = document.querySelector(PANEL)!.getBoundingClientRect();
      return {
        scrollerHeight: Math.round(s.height),
        panelOverflow: Math.round(p.bottom - s.bottom),
        listOverflow: Math.round(l.bottom - s.bottom),
        panelAboveTop: Math.round(s.top - p.top),
      };
    }, { LIST, PANEL, SCROLLER });

    expect(
      box.panelOverflow,
      `the example panel extends ${box.panelOverflow}px past the bottom of its ${box.scrollerHeight}px scroller`
    ).toBeLessThanOrEqual(1);

    expect(
      box.listOverflow,
      `the list extends ${box.listOverflow}px past the bottom of its scroller — those rows cannot be read`
    ).toBeLessThanOrEqual(1);

    expect(
      box.panelAboveTop,
      'the panel must start at or below the top of the scroller — John: "I want to see the top of this card example"'
    ).toBeLessThanOrEqual(1);
  });

  test('arrowing never leaves the selected row clipped or outside the scroller', async ({ page }) => {
    await ready(page);

    const problems = await page.evaluate(async ({ LIST, SCROLLER, ROW }) => {
      const l = document.querySelector(LIST)! as HTMLElement;
      const scroller = document.querySelector(SCROLLER)!;
      const bad: any[] = [];

      // Law 18: wait for the page's own signal, never a timer. If it stops
      // firing this fails loudly rather than passing on a stale measurement.
      const settled = () =>
        new Promise<void>((resolve, reject) => {
          const t = setTimeout(
            () => reject(new Error('wb:layout-settled never fired — a selection did not announce completion')),
            4000
          );
          document.addEventListener('wb:layout-settled', () => { clearTimeout(t); resolve(); }, { once: true });
        });

      for (let i = 0; i < 25; i++) {
        const done = settled();
        l.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
        await done;

        const cur = l.querySelector(`${ROW}[aria-current="true"]`) as HTMLElement | null;
        if (!cur) continue;
        const lr = l.getBoundingClientRect();
        const cr = cur.getBoundingClientRect();
        const sr = scroller.getBoundingClientRect();
        const clippedByList = Math.round(Math.max(lr.top - cr.top, cr.bottom - lr.bottom, 0));
        const outsideScroller = Math.round(Math.max(sr.top - cr.top, cr.bottom - sr.bottom, 0));
        if (clippedByList > 1 || outsideScroller > 1) {
          bad.push({
            step: i,
            row: cur.textContent?.replace(/\s+/g, ' ').trim().slice(0, 24),
            clippedByList,
            outsideScroller,
          });
        }
      }
      return bad;
    }, { LIST, SCROLLER, ROW });

    expect(
      problems,
      problems.length
        ? `\n${problems.length} of 25 arrow steps left the selection unreadable:\n` +
            problems.slice(0, 8).map((p) => '  ' + JSON.stringify(p)).join('\n') +
            '\n\nJohn: the selected item "must show 100% of it height".\n'
        : ''
    ).toEqual([]);
  });

  test('every selection announces that layout has settled', async ({ page }) => {
    await ready(page);

    // This is the defect the notification exposed, asserted directly: the sync
    // used to run only when the ResizeObserver happened to fire, so selections
    // that changed nothing it watched left waiters hanging forever.
    const fired = await page.evaluate(async ({ LIST }) => {
      const l = document.querySelector(LIST)! as HTMLElement;
      let count = 0;
      document.addEventListener('wb:layout-settled', () => { count++; });
      for (let i = 0; i < 6; i++) {
        l.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }
      return count;
    }, { LIST });

    expect(fired, 'six selections must produce at least six settled signals').toBeGreaterThanOrEqual(6);
  });

  test('a short window keeps a usable list, and what overflows stays reachable', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 420 });
    await ready(page);

    const short = await page.evaluate(({ LIST, SCROLLER }) => {
      const l = document.querySelector(LIST)! as HTMLElement;
      const s = document.querySelector(SCROLLER)! as HTMLElement;
      return {
        listHeight: Math.round(l.getBoundingClientRect().height),
        scrollerCanReach: s.scrollHeight > s.clientHeight,
      };
    }, { LIST, SCROLLER });

    // Below a certain height the two requirements genuinely conflict: a list
    // tall enough to browse cannot also fit beneath the panel's offset. The
    // floor wins, and the scroller must then be able to reach what overflows —
    // otherwise it would be unreadable, which is the #992 defect itself.
    expect(short.listHeight, 'the list must not collapse to a sliver').toBeGreaterThan(200);
    expect(
      short.scrollerCanReach,
      'when the floor forces overflow, the scroller must be able to reach it'
    ).toBe(true);
  });

  test('every selection lands the content in the same position', async ({ page }) => {
    // John, several times over: "when clicking the left, (nav), the content must
    // show in exact same position as shown here."
    //
    // #992 gave the panel a fixed height and its own scrollbar, which fixed the
    // overflow but introduced this: the scroll position PERSISTED across
    // selections. Measured before the fix — scroll the panel to 200, then pick
    // three behaviors: scrollTop stayed 207 every time and the header sat at
    // -206, scrolled off the top, so every example after the first appeared
    // somewhere different from the one before it.
    await ready(page);

    const positions = await page.evaluate(async ({ LIST, ROW, PANEL }) => {
      const l = document.querySelector(LIST)!;
      const live = document.querySelector(PANEL)! as HTMLElement;
      const rows = (Array.from(l.querySelectorAll(ROW)) as HTMLElement[]).filter(
        (r) => r.offsetParent !== null
      );
      rows[0].click();
      await new Promise((r) => setTimeout(r, 700));

      // Scroll the panel as a reader would, then change selection.
      live.scrollTop = 200;
      await new Promise((r) => setTimeout(r, 200));

      const seen: number[] = [];
      for (let i = 1; i < 5 && i < rows.length; i++) {
        rows[i].click();
        await new Promise((r) => setTimeout(r, 700));
        const head = live.querySelector('.behaviors-live__head');
        seen.push(
          head
            ? Math.round(head.getBoundingClientRect().top - live.getBoundingClientRect().top)
            : NaN
        );
      }
      return { seen, finalScrollTop: live.scrollTop };
    }, { LIST, ROW, PANEL });

    expect(
      positions.finalScrollTop,
      'a new selection is new content — the panel must start at the top, not where the last one was left'
    ).toBe(0);

    expect(
      new Set(positions.seen).size,
      `the panel header landed at ${JSON.stringify(positions.seen)} — every selection must place it identically`
    ).toBe(1);
  });
});
