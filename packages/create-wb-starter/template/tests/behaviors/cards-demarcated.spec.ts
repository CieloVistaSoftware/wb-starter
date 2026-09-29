/**
 * #180 — cards must read as discrete, demarcated cards.
 *
 * Two root causes: (1) --border-color was undefined so the 1px card border was
 * dropped (fixed in #182), and (2) variant="float" — the most-used card variant —
 * had NO CSS rule, so float cards fell back to the flat base with no elevation.
 * Added .x-card--float (+ --cosmic) with elevation in card.css.
 */
import { test, expect } from '../fixtures/offline';

// Measured on the home page's float cards. `?page=cards` no longer exists (it
// renders the 404 page), and cards stopped carrying the `.x-card` class in
// a8a7362e -- an <article> IS the card and card.css styles it by tag -- so
// waiting for `.x-card` could never succeed. pages/home.html is the site's
// real surface for variant="float", the variant this issue was about.
const FLOAT_CARD = 'article[variant="float"]';

test.describe('#180 — cards are demarcated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=home');
    const card = page.locator(FLOAT_CARD).first();
    await card.waitFor({ state: 'attached', timeout: 20000 });
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveAttribute('x-ready', '', { timeout: 20000 });
  });

  test('card border is rendered (not dropped by undefined --border-color)', async ({ page }) => {
    const r = await page.locator(FLOAT_CARD).first().evaluate((c) => {
      const cs = getComputedStyle(c);
      return {
        borderTopWidth: parseFloat(cs.borderTopWidth),
        bg: cs.backgroundColor,
        pageBg: getComputedStyle(document.body).backgroundColor,
      };
    });
    expect(r.borderTopWidth, 'card has no border').toBeGreaterThanOrEqual(1);
    expect(r.bg, 'card background matches page (no demarcation)').not.toBe(r.pageBg);
  });

  test('float variant has real elevation (box-shadow)', async ({ page }) => {
    const shadow = await page.locator(FLOAT_CARD).first().evaluate((c) => getComputedStyle(c).boxShadow);
    expect(shadow, 'float card has no box-shadow (no elevation → undemarcated)').not.toBe('none');
  });
});
