/**
 * #171 — the mobile nav backdrop must not swallow clicks when the drawer is
 * closed. It's a full-screen position:fixed overlay; with only opacity:0 (no
 * pointer-events:none) it intercepted every click on the page content, so no
 * link/card/button responded to taps on phones.
 */
import { test, expect } from '../fixtures/offline';

test.describe('Mobile nav backdrop click-through (#171)', () => {
  test('closed drawer: backdrop does not intercept clicks over page content', async ({ page }) => {
    await page.goto('/?page=docs');
    await page.waitForSelector('a.docs-card', { timeout: 20000 });
    // The shell and its backdrop are built once WB settles (#1516: not 800ms).
    await page.waitForFunction(() => typeof (window as any).WB?.settled === 'function', null, { timeout: 15000 });
    await page.evaluate(() => (window as any).WB.settled({ timeout: 15000 }));

    const r = await page.evaluate(() => {
      const card = document.querySelector('a.docs-card') as HTMLElement;
      // On a phone the first card is below the fold, and elementFromPoint
      // answers null for a point outside the viewport -- "none" every run
      // (#1432). Bring it on screen first; the backdrop covers the whole
      // viewport, so any on-screen point tests it.
      card.scrollIntoView({ block: 'center' });
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

  test('a real tap on a content link is not swallowed by the backdrop', async ({ page }) => {
    await page.goto('/?page=docs');
    await page.waitForSelector('a.docs-card', { timeout: 20000 });
    await page.waitForTimeout(800);
    // Docs cards open the doc-viewer in the same tab since #1184 (this test
    // still waited for a new tab, so it failed on every run -- #1432). A real
    // pointer tap must navigate there, not be eaten by the backdrop.
    await page.locator('a.docs-card').first().click(); // real pointer click, no force
    await expect(page, 'clicking a docs card should open the doc-viewer (not be eaten by the backdrop)')
      .toHaveURL(/public\/doc-viewer\.html\?file=/, { timeout: 15000 });
  });
});
