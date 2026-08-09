/**
 * #171 — the mobile nav backdrop must not swallow clicks when the drawer is
 * closed. It's a full-screen position:fixed overlay; with only opacity:0 (no
 * pointer-events:none) it intercepted every click on the page content, so no
 * link/card/button responded to taps on phones.
 */
import { test, expect } from '@playwright/test';

test.describe('Mobile nav backdrop click-through (#171)', () => {
  test('closed drawer: backdrop does not intercept clicks over page content', async ({ page }) => {
    await page.goto('http://localhost:3000/?page=docs');
    await page.waitForSelector('a.docs-card', { timeout: 20000 });
    await page.waitForTimeout(800);

    const r = await page.evaluate(() => {
      const card = document.querySelector('a.docs-card') as HTMLElement;
      const box = card.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      const backdrop = document.querySelector('.site__nav-backdrop');
      return {
        backdropPointerEvents: backdrop ? getComputedStyle(backdrop).pointerEvents : 'none',
        hitIsCard: !!hit && (card.contains(hit) || hit === card),
        hitClass: hit ? (hit.className || hit.tagName).toString().slice(0, 40) : 'none',
      };
    });

    expect(r.backdropPointerEvents, 'closed backdrop must have pointer-events:none').toBe('none');
    expect(r.hitIsCard, `the element under a docs card is "${r.hitClass}", not the card — clicks are blocked`).toBe(true);
  });

  test('a real tap on a content link is not swallowed by the backdrop', async ({ page, context }) => {
    await page.goto('http://localhost:3000/?page=docs');
    await page.waitForSelector('a.docs-card', { timeout: 20000 });
    await page.waitForTimeout(800);
    // doc-viewer cards open in a new tab; a real click must produce that popup.
    const popupP = context.waitForEvent('page', { timeout: 8000 }).catch(() => null);
    await page.locator('a.docs-card').first().click(); // real pointer click, no force
    const popup = await popupP;
    expect(popup, 'clicking a docs card should open the doc-viewer (not be eaten by the backdrop)').not.toBeNull();
    await popup?.close();
  });
});
