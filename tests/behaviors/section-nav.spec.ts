/**
 * #181 — reaching a part of the behaviors page must actually show it, clear of
 * the 64px sticky site header.
 *
 * AS FILED: the section jump-nav's links (.nav-links: Buttons, Inputs, ... ,
 * Utilities) read as crowded text, and jumped to their <section id> with the
 * heading hidden behind the sticky header, so they appeared dead. The fix was
 * pill styling plus `scroll-margin-top` on section[id].
 *
 * WHY THIS FILE NO LONGER CLICKS .nav-links
 * -----------------------------------------
 * #666 deleted both halves of that. The ten category sections and their 88
 * <div x-demo> blocks moved to data/behavior-examples.json and render on demand
 * in the live panel beside the browse list; the jump-nav went with them, since
 * there was nothing below to jump to (the note after #behaviors-workspace in
 * pages/behaviors.html says so). Every test here then waited 20s for a
 * `.nav-links` that can never appear and failed in beforeEach, asserting
 * nothing about the page as it is.
 *
 * The same precedent as tests/issues/issue-note-1769220751805-p0.spec.ts: pin
 * the retired mechanism as gone, so bringing it back is a decision rather than
 * an accident, and assert the USER need #181 was about against the mechanism
 * that replaced it — picking a behavior far down the list puts its example on
 * screen, below the header rather than under it.
 */
import { test, expect } from '@playwright/test';
import { pickBehavior } from '../helpers/behaviors-page';

// The ten section ids the jump-nav linked to.
const SECTION_IDS = ['buttons', 'inputs', 'selection', 'feedback', 'overlays', 'navigation', 'data', 'media', 'effects', 'utilities'];

test.describe.configure({ timeout: 90_000 });

test.describe('#181 — reaching a behavior shows it below the header', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=behaviors');
    await page.waitForFunction(
      () => document.querySelectorAll('.behaviors-search-results__row').length > 100,
      null,
      { timeout: 30000 },
    );
  });

  test('the section jump-nav is gone, with the sections it jumped to (#666)', async ({ page }) => {
    const leftovers = await page.evaluate((ids) => ({
      nav: document.querySelectorAll('.nav-links').length,
      sections: ids.filter((id) => document.querySelector(`section#${id}`)),
    }), SECTION_IDS);
    expect(
      leftovers.nav,
      'the section jump-nav was removed with the demo sections (#666). If it is back, '
      + 'restore the #181 link/pill/scroll-margin assertions this file used to make.',
    ).toBe(0);
    expect(leftovers.sections, 'the per-category demo sections were removed (#666)').toEqual([]);

    // ...and the thing that replaced it is present and populated.
    await expect(page.locator('#behaviors-search')).toBeVisible();
  });

  test('picking a behavior far down the list shows its example, clear of the sticky header', async ({ page }) => {
    // The last behavior in the list: the modern equivalent of the far-away
    // `#data` section the old test jumped to.
    const token = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('.behaviors-search-results__row')];
      return rows[rows.length - 1].getAttribute('data-browse-token') || '';
    });
    expect(token, 'the last row must name a behavior').not.toBe('');

    await pickBehavior(page, token);

    const geo = await page.evaluate(() => {
      const header = document.querySelector('.site__header') as HTMLElement | null;
      const stage = document.getElementById('behaviors-live-stage')!;
      const s = stage.getBoundingClientRect();
      return {
        headerBottom: header ? Math.round(header.getBoundingClientRect().bottom) : 0,
        stageTop: Math.round(s.top),
        stageHeight: Math.round(s.height),
        viewport: window.innerHeight,
      };
    });

    expect(geo.stageHeight, `${token}: the example stage has no height`).toBeGreaterThan(0);
    expect(
      geo.stageTop,
      `${token}: the example starts at ${geo.stageTop}px, under the header that ends at ${geo.headerBottom}px`,
    ).toBeGreaterThanOrEqual(geo.headerBottom);
    expect(
      geo.stageTop,
      `${token}: the example starts at ${geo.stageTop}px, below the ${geo.viewport}px viewport`,
    ).toBeLessThan(geo.viewport);
  });
});
