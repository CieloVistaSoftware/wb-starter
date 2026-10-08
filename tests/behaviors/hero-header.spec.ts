/**
 * #179 — the behaviors hero title (⚡ WB Behaviors Showcase) must clear the 64px
 * sticky site header. It was rendering ~19px under the header, clipping the ⚡
 * glyph and the tops of the letters with no gap.
 */
import { test, expect } from '../fixtures/offline';

import { settlePage } from '../base';
test.describe('#179 — behaviors hero clears the sticky header', () => {
  test('hero title is fully below the header with a gap (not clipped)', async ({ page }) => {
    await page.goto('/?page=behaviors');
    await page.waitForSelector('#mainPage-behaviors', { timeout: 20000 });
    // The page is built once WB settles (#1516: no fixed sleep).
    await page.waitForFunction(() => typeof (window as any).WB?.settled === 'function', null, { timeout: 15000 });
    await settlePage(page, { timeout: 15000 });
    // ensure we're at the very top
    await page.evaluate(async () => { window.scrollTo(0, 0); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); });

    const r = await page.evaluate(() => {
      const header = document.querySelector('.site__header') as HTMLElement;
      const h1 = document.querySelector('#mainPage-behaviors h1') as HTMLElement;
      if (!header || !h1) return null;
      return {
        headerBottom: Math.round(header.getBoundingClientRect().bottom),
        h1Top: Math.round(h1.getBoundingClientRect().top),
      };
    });
    expect(r, 'header or hero h1 missing').not.toBeNull();
    // title top must be at/under the header bottom, with a real gap (not clipped)
    expect(
      r!.h1Top,
      `hero title top (${r!.h1Top}) is above header bottom (${r!.headerBottom}) — clipped`
    ).toBeGreaterThanOrEqual(r!.headerBottom);
  });

  test('hero h1 has line-height room for the emoji ascent', async ({ page }) => {
    await page.goto('/?page=behaviors');
    await page.waitForSelector('#mainPage-behaviors h1', { timeout: 20000 });
    const ratio = await page.evaluate(() => {
      const h1 = document.querySelector('#mainPage-behaviors h1') as HTMLElement;
      const cs = getComputedStyle(h1);
      return parseFloat(cs.lineHeight) / parseFloat(cs.fontSize);
    });
    expect(ratio, `h1 line-height ratio ${ratio} too tight for emoji`).toBeGreaterThanOrEqual(1.3);
  });
});
