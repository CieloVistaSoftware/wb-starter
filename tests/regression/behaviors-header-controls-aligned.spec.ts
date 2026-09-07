/**
 * THE HEADER CONTROL STRIP IS ONE ROW OF EQUAL CHIPS
 * ==================================================
 * John, pointing at the header: "none of these buttons are aligned why did you
 * do that? don't argue just start testing" — then again, arrows drawn at the
 * version badge, API (9) and AutoScroll: "write alignment tests and fix".
 *
 * Measured before the fix:
 *
 *     API  top 23  h 34      Fullscreen  top 15  h 34
 *     Docs top 15  h 34      AutoScroll  top 16  h 32
 *
 * Two causes, both from MOVING the controls out of the live panel (#1004)
 * rather than rebuilding them — the right trade for keeping them wired, but the
 * panel's styling comes along:
 *
 *   1. `.behaviors-live__api { margin-top: 1rem }` — the 8px drop.
 *   2. `details.css`'s `.x-details > .x-details__summary { padding: 1rem }` at
 *      specificity (0,2,0) beat the strip's `> details > summary` (0,1,2). The
 *      normalizing rule was in the file and read correctly; the cascade threw
 *      the half of it that mattered away.
 *
 * That second one is why this file exists. A CSS fix that is only read, never
 * measured, is not a fix — the parsed cascade decides (#965). Every assertion
 * below is a geometry measurement taken from the live page.
 */

import { test, expect } from '@playwright/test';

const STRIP = '#behaviors-header-tools';

test.describe('behaviors header control strip alignment (#1004)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
    await page.locator(STRIP).waitFor({ state: 'attached', timeout: 20_000 });
    await page.waitForFunction(
      () => document.querySelectorAll('#behaviors-header-tools > *').length >= 4,
      undefined,
      { timeout: 20_000 }
    );
  });

  test('all four controls share one baseline and one height', async ({ page }) => {
    const boxes = await page.evaluate(() => {
      const strip = document.getElementById('behaviors-header-tools')!;
      return [...strip.children].map((c) => {
        const el = c.tagName === 'DETAILS' ? c.querySelector('summary')! : (c as HTMLElement);
        const r = el.getBoundingClientRect();
        return { id: c.id || c.className, top: Math.round(r.top), height: Math.round(r.height) };
      });
    });

    expect(boxes.length, 'API, Docs, Fullscreen and AutoScroll all belong in the strip').toBe(4);

    const label = boxes.map((b) => `${b.id} top=${b.top} h=${b.height}`).join('  |  ');
    const tops = boxes.map((b) => b.top);
    const heights = boxes.map((b) => b.height);

    expect(Math.max(...tops) - Math.min(...tops), `tops differ — ${label}`).toBeLessThanOrEqual(1);
    expect(
      Math.max(...heights) - Math.min(...heights),
      `heights differ — ${label}`
    ).toBeLessThanOrEqual(1);
  });

  test('the strip sits inside the header and never wraps onto the page', async ({ page }) => {
    // The failure this catches is not cosmetic: when the strip wrapped it drew
    // on top of the sidebar and the search row, covering controls underneath.
    const geom = await page.evaluate(() => {
      const strip = document.getElementById('behaviors-header-tools')!.getBoundingClientRect();
      const header = document.getElementById('siteHeader')!.getBoundingClientRect();
      const search = document.querySelector('.behaviors-search input, #behaviors-search');
      return {
        stripTop: Math.round(strip.top), stripBottom: Math.round(strip.bottom),
        headerTop: Math.round(header.top), headerBottom: Math.round(header.bottom),
        searchTop: search ? Math.round(search.getBoundingClientRect().top) : null,
      };
    });

    expect(geom.stripTop, 'the strip starts above the header').toBeGreaterThanOrEqual(geom.headerTop - 1);
    expect(
      geom.stripBottom,
      `the strip overflows the header (bottom ${geom.stripBottom} vs header ${geom.headerBottom}) — this is what overlapped the sidebar`
    ).toBeLessThanOrEqual(geom.headerBottom + 1);
    if (geom.searchTop !== null) {
      expect(geom.stripBottom, 'the strip overlaps the search row').toBeLessThanOrEqual(geom.searchTop + 1);
    }
  });

  test('the controls are laid out left to right, not stacked', async ({ page }) => {
    const tops = await page.evaluate(() => {
      const strip = document.getElementById('behaviors-header-tools')!;
      return [...strip.children].map((c) => c.getBoundingClientRect().top);
    });
    // Bucketed by half a chip height, not by exact pixel: a 1px difference is
    // still one row, a 30px one is a wrap. Comparing raw tops would have made
    // this test fail on alignment it was not measuring.
    const spread = Math.max(...tops) - Math.min(...tops);
    expect(spread, `the strip wrapped — tops span ${Math.round(spread)}px`).toBeLessThan(16);
  });

  test('the version badge stays a badge: short, and it opens What\'s New', async ({ page }) => {
    // John: "Shrink to just version, release-modification format, and remove
    // text." Spelling the drift out — "v4.0.1.7 ⚠ 1 behind origin/main · dirty"
    // — made the badge wide enough to wrap the whole header, which is what
    // pushed the strip over the sidebar in the first place. And: "I already
    // told you when clicking it will open What's New."
    const badge = page.locator('.x-release, [x-release]').first();
    await badge.waitFor({ state: 'visible', timeout: 15_000 });

    const text = ((await badge.textContent()) || '').trim();
    expect(text, `badge reads "${text}"`).toMatch(/^v?\d+\.\d+\.\d+(\.\d+)?[\s\u26a0*!~+]*$/u);
    expect(text.length, `badge is prose, not a badge: "${text}"`).toBeLessThanOrEqual(20);
    expect(/behind|ahead|dirty|origin/i.test(text), `badge still spells out drift: "${text}"`).toBe(false);

    await badge.click();
    await expect.poll(() => page.url(), { timeout: 10_000 }).toContain('whats-new');
  });
});
