/**
 * #182 — <wb-spinner> must render a visible, animated ring.
 *
 * Root cause: `--border-color` was referenced by the spinner CSS (and many other
 * behaviors) but defined in NO theme. `border: 2px solid var(--border-color)` with
 * an undefined var is an invalid shorthand, so the entire border was dropped — the
 * ring spun but was invisible. Fixed by defining --border-color in themes.css and
 * using explicit border longhands + neutralizing effects.css's element-level ring.
 */
import { test, expect } from '@playwright/test';

test.describe('#182 — spinners visible + animated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/?page=behaviors');
    await page.waitForSelector('#mainPage-behaviors', { timeout: 20000 });
    await page.waitForTimeout(2000);
  });

  test('--border-color theme variable is defined', async ({ page }) => {
    const v = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim()
    );
    expect(v, '--border-color is undefined (would drop every border that uses it)').not.toBe('');
  });

  test('every spinner ring has a visible border and is animated', async ({ page }) => {
    const rings = await page.evaluate(() =>
      [...document.querySelectorAll('[x-spinner]')].map((sp) => {
        const inner = sp.querySelector('div') as HTMLElement;
        const ics = inner ? getComputedStyle(inner) : null;
        return {
          hasInner: !!inner,
          borderTopWidth: ics ? parseFloat(ics.borderTopWidth) : 0,
          anim: ics ? ics.animationName : 'none',
          color: ics ? ics.borderTopColor : '',
        };
      })
    );
    expect(rings.length, 'no spinners on showcase').toBeGreaterThanOrEqual(4);
    for (const r of rings) {
      expect(r.hasInner, 'spinner has no inner ring element').toBe(true);
      expect(r.borderTopWidth, 'spinner ring border is 0 (invisible)').toBeGreaterThanOrEqual(1.5);
      expect(r.anim, 'spinner ring is not animated').toBe('wb-spin');
    }
  });

  test('spinner color= variants render distinct colors', async ({ page }) => {
    const colors = await page.evaluate(() =>
      ['success', 'warning', 'error'].map((c) => {
        const sp = document.querySelector(`[x-spinner][color="${c}"]`);
        const inner = sp?.querySelector('div') as HTMLElement;
        return inner ? getComputedStyle(inner).borderTopColor : 'MISSING';
      })
    );
    expect(new Set(colors).size, `spinner color= variants not distinct: ${colors.join(', ')}`).toBe(3);
  });
});
