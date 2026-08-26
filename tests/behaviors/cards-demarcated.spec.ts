/**
 * #180 — cards must read as discrete, demarcated cards.
 *
 * Two root causes: (1) --border-color was undefined so the 1px card border was
 * dropped (fixed in #182), and (2) variant="float" — the most-used card variant —
 * had NO CSS rule, so float cards fell back to the flat base with no elevation.
 * Added .x-card--float (+ --cosmic) with elevation in card.css.
 */
import { test, expect } from '@playwright/test';

test.describe('#180 — cards are demarcated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=cards');
    await page.waitForSelector('.x-card', { timeout: 20000 });
    await page.waitForTimeout(1500);
  });

  test('card border is rendered (not dropped by undefined --border-color)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const c = document.querySelector('.x-card') as HTMLElement;
      if (!c) return null;
      const cs = getComputedStyle(c);
      return {
        borderTopWidth: parseFloat(cs.borderTopWidth),
        bg: cs.backgroundColor,
        pageBg: getComputedStyle(document.body).backgroundColor,
      };
    });
    expect(r, 'no .x-card on page').not.toBeNull();
    expect(r!.borderTopWidth, 'card has no border').toBeGreaterThanOrEqual(1);
    expect(r!.bg, 'card background matches page (no demarcation)').not.toBe(r!.pageBg);
  });

  test('float variant has real elevation (box-shadow)', async ({ page }) => {
    const shadow = await page.evaluate(() => {
      const c = document.querySelector('x-card[variant="float"]') as HTMLElement;
      return c ? getComputedStyle(c).boxShadow : 'NO_FLOAT_CARD';
    });
    expect(shadow, 'no variant="float" card found').not.toBe('NO_FLOAT_CARD');
    expect(shadow, 'float card has no box-shadow (no elevation → undemarcated)').not.toBe('none');
  });
});
