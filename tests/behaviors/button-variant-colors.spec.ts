import { test, expect } from '../fixtures/offline';

/**
 * Button variant colors must be distinct.
 *
 * Regression guard: button.js injects a plain `.x-button { background: var(--bg-secondary) }`
 * rule at runtime. Being equal-specificity but later in source order, it overrode the
 * single-class `.x-button--success/danger/warning` variant colors from button.css — every
 * button collapsed to the same neutral background (no color difference). Fixed by raising the
 * variant selectors to `.x-button.x-button--*` (specificity 0,2,0).
 *
 * demos/site/forms.html (the Form Controls category page, superseding the
 * now-retired demos/buttons.html) uses <button variant="…"> exclusively —
 * the attribute-selector path (button.js: `x-button[variant="…"]`), not the
 * class-based .x-button--* path this test originally exercised. Same
 * regression risk, different selector shape.
 */
test.describe('Button variant colors (#button-variant-colors)', () => {
  test('primary/success/error/warning render distinct backgrounds', async ({ page }) => {
    await page.goto('/demos/site/forms.html', { waitUntil: 'domcontentloaded' });
    // `<button variant>` is what forms.html authors: the selector used to be
    // `[x-button][variant]`, left over from the <x-button> tag, and matched
    // nothing on the page, so the first scrollIntoViewIfNeeded() waited out
    // the whole test timeout. The lazy runtime (#491) only enhances a button
    // near the viewport and button.css arrives just in time (#342), so scroll
    // each one in, wait for x-ready, then read.
    const bg = async (variant: string) => {
      const el = page.locator(`button[variant="${variant}"]`).first();
      await el.scrollIntoViewIfNeeded();
      await expect(el).toHaveAttribute('x-ready', '', { timeout: 10000 });
      return el.evaluate((node) => getComputedStyle(node as HTMLElement).backgroundColor);
    };

    let colors: Record<string, string> = {};
    await expect.poll(async () => {
      colors = {
        primary: await bg('primary'),
        success: await bg('success'),
        error: await bg('error'),
        warning: await bg('warning'),
      };
      return new Set(Object.values(colors)).size;
    }, { timeout: 10000 }).toBe(4);

    // Bug signature: all variants collapse to the same neutral background.
    const distinct = new Set(Object.values(colors));
    expect(distinct.size, `variant backgrounds should all differ, got ${JSON.stringify(colors)}`).toBe(4);

    // And none of the colored variants should be the neutral/transparent fallback.
    for (const v of ['success', 'error', 'warning'] as const) {
      expect(colors[v], `${v} should not be transparent`).not.toBe('rgba(0, 0, 0, 0)');
    }
  });
});
