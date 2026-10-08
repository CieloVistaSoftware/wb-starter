/**
 * The side nav must stay pinned to the viewport as the page scrolls (so opening
 * the menu always shows it at the user's current location), and the page must use
 * a SINGLE scroll container (.site__body) — not also scroll the window.
 */
import { test, expect } from '../fixtures/offline';

import { settlePage } from '../base';
const BASE = process.env.WB_BASE || '';

test.describe('Side nav stays at the current scroll location', () => {
  test('nav is sticky and pinned while .site__body scrolls', async ({ page }) => {
    await page.goto(`${BASE}/?page=themes`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.site__nav', { timeout: 25000 });
    // The page is built once its content is in and WB settles (#1516: not
    // 1500ms). WB can settle before the router has inserted the page, which
    // left .site__body with nothing to scroll.
    await page.waitForSelector('#mainPage-themes', { timeout: 25000 });
    await page.waitForFunction(() => typeof (window as any).WB?.settled === 'function', null, { timeout: 15000 });
    await settlePage(page, { timeout: 15000 });

    const r = await page.evaluate(async () => {
      const nav = document.querySelector('.site__nav') as HTMLElement;
      const body = document.querySelector('.site__body') as HTMLElement;
      const navTop = () => Math.round(nav.getBoundingClientRect().top);
      body.scrollTop = 0;
      await new Promise((r) => requestAnimationFrame(r));
      const t0 = navTop();
      body.scrollTop = 800;
      await new Promise((r) => requestAnimationFrame(r));
      const t800 = navTop();
      return {
        position: getComputedStyle(nav).position,
        bodyCanScroll: body.scrollHeight > body.clientHeight + 50,
        windowScrollY: Math.round(window.scrollY),
        t0,
        t800,
      };
    });

    expect(r.position, 'nav should be position:sticky').toBe('sticky');
    expect(r.bodyCanScroll, '.site__body should be the scroll container').toBe(true);
    expect(r.windowScrollY, 'window should not scroll (single scroll container)').toBeLessThan(20);
    // nav stays at (roughly) the same viewport position while the body scrolls
    expect(Math.abs(r.t0 - r.t800), `nav drifted on scroll (t0=${r.t0} t800=${r.t800})`).toBeLessThan(12);
  });
});
