import { test, expect } from '../fixtures/offline';

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
test.describe('[x-cardbutton] click dispatch (cards demo page)', () => {
  test('clicking a primary/secondary button with no href dispatches a bubbling event', async ({ page }) => {
    await page.goto('/demos/site/cards.html');
    await page.waitForSelector('[x-cardbutton] .x-card__btn--primary');

    const result = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('.x-card__btn--primary'))
        .find((b) => b.textContent?.trim() === 'Confirm Delete');
      if (!btn) return { error: 'button not found' };
      const card = btn.closest('[x-cardbutton]');
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
    await page.goto('/demos/site/cards.html');
    await page.waitForSelector('[x-cardbutton]');

    // #1092: this used to look for an existing *Href button on the demo and assert
    // only if one was there. No cardbutton on demos/site/cards.html sets
    // primaryHref, so it asserted nothing and passed. Build the subject instead:
    // run cardbutton() on a fresh element with primaryHref, and check what it renders.
    const result = await page.evaluate(async () => {
      const { cardbutton } = await import('/src/wb-viewmodels/card.js');
      const host = document.createElement('article');
      host.setAttribute('x-cardbutton', '');
      document.body.append(host);
      cardbutton(host, { title: 'Linked', primary: 'Open', primaryHref: '/demos/site/cards.html#linked' });
      const btn = host.querySelector('.x-card__btn--primary');
      return btn ? { tagName: btn.tagName, href: btn.getAttribute('href') } : null;
    });

    expect(result, 'cardbutton() with primaryHref rendered no primary button').not.toBeNull();
    expect(result!.tagName).toBe('A');
    expect(result!.href).toBe('/demos/site/cards.html#linked');
  });
});
