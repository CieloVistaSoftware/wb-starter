/**
 * #182 — <span x-spinner> must render a visible, animated ring.
 *
 * Root cause: `--border-color` was referenced by the spinner CSS (and many other
 * behaviors) but defined in NO theme. `border: 2px solid var(--border-color)` with
 * an undefined var is an invalid shorthand, so the entire border was dropped — the
 * ring spun but was invisible. Fixed by defining --border-color in themes.css and
 * using explicit border longhands + neutralizing effects.css's element-level ring.
 */
import { test, expect } from '../fixtures/offline';
import { openBehaviorsPanel, renderVariant, example } from '../utils/behaviors-panel';

// The showcase stopped hosting static `[x-spinner]` sections in #664; it builds
// one example at a time in #behaviors-live-example. Scanning the page found 0
// spinners, so both checks below drive the panel and read the rendered example.
// The colour variants are `variant=` -- spinner.schema.json has no `color`
// attribute, which is why `[x-spinner][color="success"]` read MISSING.
async function ring(page: import('@playwright/test').Page) {
  return example(page).evaluate((sp) => {
    const inner = sp.querySelector('div') as HTMLElement | null;
    const ics = inner ? getComputedStyle(inner) : null;
    return {
      hasInner: !!inner,
      borderTopWidth: ics ? parseFloat(ics.borderTopWidth) : 0,
      anim: ics ? ics.animationName : 'none',
      color: ics ? ics.borderTopColor : 'MISSING',
    };
  });
}

test.describe('#182 — spinners visible + animated', () => {
  test('--border-color theme variable is defined', async ({ page }) => {
    await page.goto('/?page=behaviors');
    await page.waitForSelector('#mainPage-behaviors', { timeout: 20000 });
    const v = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim()
    );
    expect(v, '--border-color is undefined (would drop every border that uses it)').not.toBe('');
  });

  test('every spinner ring has a visible border and is animated', async ({ page }) => {
    await openBehaviorsPanel(page, 'x-spinner');
    const VARIANTS = ['default', 'primary', 'xs', 'xl', 'slow', 'fast'];
    for (const v of VARIANTS) {
      await renderVariant(page, 'x-spinner', v);
      await expect(example(page)).toHaveAttribute('x-ready', '');
      const r = await ring(page);
      expect(r.hasInner, `${v}: spinner has no inner ring element`).toBe(true);
      // >= 1, not 1.5: the xs size draws a deliberate 1px ring. The bug this
      // guards is a DROPPED border (0px), which any real width rules out.
      expect(r.borderTopWidth, `${v}: spinner ring border is 0 (invisible)`).toBeGreaterThanOrEqual(1);
      expect(r.anim, `${v}: spinner ring is not animated`).toBe('x-spin');
    }
  });

  test('spinner color= variants render distinct colors', async ({ page }) => {
    await openBehaviorsPanel(page, 'x-spinner');
    const colors: string[] = [];
    for (const c of ['success', 'warning', 'error']) {
      await renderVariant(page, 'x-spinner', c);
      await expect(example(page)).toHaveAttribute('variant', c);
      await expect(example(page)).toHaveAttribute('x-ready', '');
      colors.push((await ring(page)).color);
    }
    expect(new Set(colors).size, `spinner color= variants not distinct: ${colors.join(', ')}`).toBe(3);
  });
});
