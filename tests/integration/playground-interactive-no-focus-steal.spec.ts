import { test, expect } from '@playwright/test';

/**
 * Clicking a preview element normally jumps the HTML textarea to that
 * element's source (select + scroll + copy) — a useful "inspect this
 * example" feature for static content (cards, badges, heroes). But every
 * click bubbles to the same handler, so clicking an actually-interactive
 * example (a ripple/confirm/toast/drawer trigger, or a form control the
 * user is typing into — the "50 x-* behaviors" set especially) ALSO stole
 * focus/selection from the textarea, resetting the user's place in the
 * editor the instant they tried to use one. Fixed: the jump-to-source
 * handler now skips native interactive elements (button/input/textarea/
 * select/a) and anything carrying an x-* attribute.
 */
test.describe('playground: interactive examples do not steal textarea focus', () => {
  test('clicking an x-ripple button does not move the textarea selection', async ({ page }) => {
    await page.goto('/demos/playground.html', { waitUntil: 'networkidle' });
    await page.selectOption('#pg-examples', 'xbehaviors');
    await page.waitForFunction(() => {
      const btn = document.querySelector('#pg-preview button[x-ripple]');
      return !!btn && btn.classList.contains('wb-ripple');
    }, { timeout: 15000 });

    await page.locator('#pg-input').evaluate((el: HTMLTextAreaElement) => {
      el.focus();
      el.setSelectionRange(5, 5);
      el.scrollTop = 0;
    });

    await page.locator('#pg-preview button[x-ripple]').first().click();

    const sel = await page.locator('#pg-input').evaluate((el: HTMLTextAreaElement) => ({
      start: el.selectionStart,
      end: el.selectionEnd,
      isFocused: document.activeElement === el,
    }));
    expect(sel.start).toBe(5);
    expect(sel.end).toBe(5);
    expect(sel.isFocused).toBe(false);
  });

  test('clicking a plain (non-interactive) card example still jumps to its source', async ({ page }) => {
    await page.goto('/demos/playground.html', { waitUntil: 'networkidle' });
    await page.selectOption('#pg-examples', 'cards');
    await page.waitForFunction(() => document.querySelectorAll('#pg-preview wb-card').length > 0, { timeout: 15000 });

    await page.locator('#pg-preview wb-card').first().click();

    const sel = await page.locator('#pg-input').evaluate((el: HTMLTextAreaElement) => ({
      hasSelection: el.selectionEnd > el.selectionStart,
      isFocused: document.activeElement === el,
    }));
    expect(sel.hasSelection).toBe(true);
    expect(sel.isFocused).toBe(true);
  });
});
