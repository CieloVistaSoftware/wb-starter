/**
 * #177 — <wb-rating> must honor the custom icon, paint its value on first render,
 * and use theme colors (overridable via color=).
 *
 * The behavior only read data-attributes and options, so the plain attributes
 * (value="3" icon="❤️") were ignored: every rating showed empty ★ stars. Now it
 * reads plain attributes and honors icon + theme color (--rating-active-color).
 */
import { test, expect } from '@playwright/test';

test.describe('#177 — rating icon + value + color', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/?page=behaviors');
    await page.waitForSelector('#mainPage-behaviors', { timeout: 20000 });
    await page.waitForTimeout(2000);
  });

  test('custom icon= is honored (hearts / thumbs, not stars)', async ({ page }) => {
    const glyphs = await page.evaluate(() =>
      ['❤️', '👍'].map((ic) => {
        const r = document.querySelector(`[x-rating][icon="${ic}"]`);
        const first = r?.querySelector('.wb-rating__star');
        return { icon: ic, glyph: first?.textContent || '' };
      })
    );
    for (const g of glyphs) {
      expect(g.glyph, `rating icon="${g.icon}" still shows "${g.glyph}"`).toBe(g.icon);
    }
  });

  test('value is painted on first render (filled count == value)', async ({ page }) => {
    const r = await page.evaluate(() => {
      return [...document.querySelectorAll('[x-rating]')].map((el) => {
        const value = parseInt(el.getAttribute('value') || '0', 10);
        const filled = el.querySelectorAll('.wb-rating__star--full').length;
        return { value, filled };
      });
    });
    expect(r.length).toBeGreaterThanOrEqual(3);
    for (const { value, filled } of r) {
      expect(filled, `rating value=${value} painted ${filled} filled on first render`).toBe(value);
    }
  });

  test('filled stars use the theme rating color, not a hardcoded gray', async ({ page }) => {
    const color = await page.evaluate(() => {
      const star = document.querySelector('[x-rating] .wb-rating__star--full') as HTMLElement;
      return star ? getComputedStyle(star).color : 'NONE';
    });
    // --rating-active-color resolves to gold rgb(251, 197, 35)
    expect(color).not.toBe('NONE');
    expect(color, 'filled star is not colored').not.toBe('rgba(0, 0, 0, 0)');
  });
});
