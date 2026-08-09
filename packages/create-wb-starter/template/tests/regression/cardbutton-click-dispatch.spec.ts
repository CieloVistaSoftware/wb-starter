import { test, expect } from '@playwright/test';

/**
 * cardbutton()'s primary/secondary buttons had zero click handling when no
 * primaryHref/secondaryHref was set -- clicking a plain <button> (e.g. the
 * "Confirm Delete" example on demos/site/cards.html, which has no href by
 * design) did visibly nothing at all, not even a console log. Fixed by
 * dispatching a bubbling wb:cardbutton:primary/secondary CustomEvent on
 * click, matching the wb:{behavior}:{action} convention already used by
 * cardnotification/cardproduct/cardexpandable/etc in card.js -- so a real
 * consumer has something to listen for.
 */
test.describe('wb-cardbutton click dispatch (cards demo page)', () => {
  test('clicking a primary/secondary button with no href dispatches a bubbling event', async ({ page }) => {
    await page.goto('http://localhost:3000/demos/site/cards.html');
    await page.waitForSelector('wb-cardbutton .wb-card__btn--primary');

    const result = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('.wb-card__btn--primary'))
        .find((b) => b.textContent?.trim() === 'Confirm Delete');
      if (!btn) return { error: 'button not found' };
      const card = btn.closest('wb-cardbutton');
      let detail: unknown = null;
      card?.addEventListener('wb:cardbutton:primary', (e) => {
        detail = (e as CustomEvent).detail;
      });
      (btn as HTMLElement).click();
      return { tagName: btn.tagName, detail };
    });

    expect(result.error).toBeUndefined();
    expect(result.tagName).toBe('BUTTON');
    expect(result.detail).toEqual({ label: 'Confirm Delete' });
  });

  test('a button with primaryHref renders as a real link, not a dead button', async ({ page }) => {
    await page.goto('http://localhost:3000/demos/site/cards.html');
    await page.waitForSelector('wb-cardbutton');

    const hrefButtons = await page.locator('wb-cardbutton .wb-card__btn[href]').count();
    // Not every cardbutton demo uses *Href, but at least confirm the branch
    // path renders an <a> (not a <button>) whenever it does.
    if (hrefButtons > 0) {
      const tag = await page.locator('wb-cardbutton .wb-card__btn[href]').first().evaluate((el) => el.tagName);
      expect(tag).toBe('A');
    }
  });
});
