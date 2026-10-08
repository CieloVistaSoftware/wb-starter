/**
 * REGRESSION (#1138): ON A PHONE THE EXAMPLE GETS THE SCREEN
 * ==========================================================
 * John, on a Samsung A55 (360x800): "there's no room for showing the
 * behavior", and on 2026-09-13, in priority order: "The most important space
 * is showing the demo. 2ndly the ability to filter/choose what to show."
 *
 * Measured before the fix at 375x812: the site header wrapped to three rows
 * (248px) because the page moved API/Docs/Fullscreen/AutoScroll into it, the
 * sticky search panel added 168px, and 51% of the screen was pinned. The
 * 184-row list was a 430px box scrolling inside the page scroller, and the
 * example rendered below all of it.
 *
 * Below the stacking breakpoint the page is now master/detail:
 *   list view    -- one-row header, compact search, the list in the page's
 *                   single scroll, no example
 *   example view -- a tap shows the example near the top of the screen with
 *                   Back/API/Docs/Fullscreen on ONE row above it; Back returns
 *                   to the list at the row that was open
 * Desktop is unchanged: both columns, tools in the site header, no Back.
 *
 * Everything is geometry measured from the live page, at the issue's two
 * sizes plus John's actual phone.
 */

import { test, expect } from '../fixtures/offline';
import type { Page } from '@playwright/test';

import { settlePage } from '../base';
const PHONES = [
  ['Galaxy A55', { width: 360, height: 800 }],
  ['375x812', { width: 375, height: 812 }],
  ['412x915', { width: 412, height: 915 }],
] as const;

async function openBehaviors(page: Page) {
  await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
  await page.locator('#behaviors-workspace').waitFor({ state: 'attached', timeout: 20_000 });
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 0,
    undefined,
    { timeout: 20_000 },
  );
  // At rest, not mid-entrance: see behaviors-workspace-single-scroll.spec.ts (#1106).
  await settlePage(page, { timeout: 15_000 });
  await page.evaluate(() => {
    const pageBox = document.querySelector('#mainPage-behaviors');
    return Promise.all((pageBox ? pageBox.getAnimations() : [])
      .map((a) => a.finished.catch(() => undefined)));
  });
}

/** Tap a row the way a person does and wait for the page's own settled signal. */
async function tapRow(page: Page, variant: string) {
  const row = page.locator(`.behaviors-search-results__row[data-variant="${variant}"]`).first();
  await row.scrollIntoViewIfNeeded();
  const settled = page.evaluate(() => new Promise<void>((resolve) => {
    document.addEventListener('wb:layout-settled', () => resolve(), { once: true });
  }));
  await row.click();
  await settled;
}

for (const [name, viewport] of PHONES) {
  test.describe(`#1138 behaviors on a phone — ${name}`, () => {
    test.use({ viewport });

    test('list view: one-row header, little pinned chrome, one scroll, no example', async ({ page }) => {
      await openBehaviors(page);

      const m = await page.evaluate(() => {
        const h = (s: string) => (document.querySelector(s) as HTMLElement).getBoundingClientRect().height;
        const list = document.getElementById('behaviors-search-results')!;
        return {
          header: h('.site__header'),
          search: h('.behaviors-search'),
          vh: innerHeight,
          listScrolls: list.scrollHeight > list.clientHeight + 1,
          liveDisplay: getComputedStyle(document.getElementById('behaviors-live')!).display,
          tools: getComputedStyle(document.getElementById('behaviors-header-tools')!).display,
        };
      });

      expect(m.header, 'the site header must be one row (it wrapped to three)').toBeLessThan(80);
      expect((m.header + m.search) / m.vh, 'pinned chrome must stay under a quarter of the screen')
        .toBeLessThan(0.25);
      expect(m.listScrolls, 'the list must not be a scroller inside the page scroller').toBe(false);
      expect(m.liveDisplay, 'the list view shows the list, not the example under it').toBe('none');
      expect(m.tools, 'the desktop tools strip must not sit in the phone header').toBe('none');
    });

    test('a tap shows the example on the first screen, and Back returns to the row', async ({ page }) => {
      await openBehaviors(page);
      await tapRow(page, 'glass');

      const shown = await page.evaluate(() => {
        const r = (s: string) => (document.querySelector(s) as HTMLElement).getBoundingClientRect();
        const ex = document.getElementById('behaviors-live-example')!.firstElementChild as HTMLElement;
        const small = [...document.querySelectorAll(
          '.site__header button, .site__header select, .behaviors-live__head button, .behaviors-live__head summary',
        )].filter((e) => (e as HTMLElement).offsetParent)
          .map((e) => ({ id: (e as HTMLElement).id || e.className, h: e.getBoundingClientRect().height }))
          .filter((e) => e.h < 43.5);
        return {
          vh: innerHeight,
          vw: innerWidth,
          headH: r('.behaviors-live__head').height,
          stageTop: r('#behaviors-live-stage').top,
          stageBottom: r('#behaviors-live-stage').bottom,
          exampleRight: ex.getBoundingClientRect().right,
          searchDisplay: getComputedStyle(document.querySelector('.behaviors-search')!).display,
          listDisplay: getComputedStyle(document.getElementById('behaviors-search-results')!).display,
          backVisible: !!document.getElementById('behaviors-live-back')!.offsetParent,
          small,
          pageWidth: document.documentElement.scrollWidth,
        };
      });

      // John, second pass: "Still too much vertical space. I want more demo
      // showing." Back/API/Docs/Fullscreen are ONE row, and the example starts
      // right under the two headers -- measured 140px at 360x800.
      expect(shown.headH, 'the example controls must be a single row').toBeLessThan(80);
      expect(shown.stageTop, 'the example must start right under the headers')
        .toBeLessThan(160);
      expect(shown.stageBottom, 'the example must be on the first screen').toBeLessThanOrEqual(shown.vh);
      expect(shown.exampleRight, 'the example must not be cut off at the right edge')
        .toBeLessThanOrEqual(shown.vw);
      expect(shown.pageWidth, 'no sideways page scroll').toBeLessThanOrEqual(shown.vw);
      expect(shown.searchDisplay, 'search steps aside while an example is showing').toBe('none');
      expect(shown.listDisplay, 'the list steps aside while an example is showing').toBe('none');
      expect(shown.backVisible, 'there must be a way back to the list').toBe(true);
      expect(shown.small, 'every control is a ~44px touch target').toEqual([]);

      await page.locator('#behaviors-live-back').click();

      const back = await page.evaluate(() => {
        const cur = document.querySelector('.behaviors-search-results [aria-current="true"]') as HTMLElement;
        const b = cur.getBoundingClientRect();
        return {
          variant: cur.dataset.variant,
          inView: b.top >= 0 && b.bottom <= innerHeight,
          liveDisplay: getComputedStyle(document.getElementById('behaviors-live')!).display,
        };
      });
      expect(back.liveDisplay).toBe('none');
      expect(back.variant, 'Back returns to the row that was open').toBe('glass');
      expect(back.inView, 'and that row is on screen').toBe(true);
    });
  });
}

test.describe('#1138 desktop is unchanged', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('both columns, tools in the site header, no Back', async ({ page }) => {
    await openBehaviors(page);
    await tapRow(page, 'glass');

    const d = await page.evaluate(() => ({
      tools: [...document.getElementById('behaviors-header-tools')!.children].map((c) => c.id),
      back: getComputedStyle(document.getElementById('behaviors-live-back')!).display,
      list: !!document.getElementById('behaviors-search-results')!.offsetParent,
      live: !!document.getElementById('behaviors-live')!.offsetParent,
    }));

    expect(d.tools).toEqual([
      'behaviors-live-api', 'behaviors-live-doc', 'behaviors-live-fullscreen', 'behaviors-autoscroll',
    ]);
    expect(d.back).toBe('none');
    expect(d.list, 'the list stays beside the example').toBe(true);
    expect(d.live).toBe(true);
  });
});
