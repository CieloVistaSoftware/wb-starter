import { test, expect } from '@playwright/test';

/**
 * Button variant colors must be distinct.
 *
 * Regression guard: button.js injects a plain `.wb-button { background: var(--bg-secondary) }`
 * rule at runtime. Being equal-specificity but later in source order, it overrode the
 * single-class `.wb-button--success/danger/warning` variant colors from button.css — every
 * button collapsed to the same neutral background (no color difference). Fixed by raising the
 * variant selectors to `.wb-button.wb-button--*` (specificity 0,2,0).
 *
 * demos/site/forms.html (the Form Controls category page, superseding the
 * now-retired demos/buttons.html) uses <wb-button variant="…"> exclusively —
 * the attribute-selector path (button.js: `wb-button[variant="…"]`), not the
 * class-based .wb-button--* path this test originally exercised. Same
 * regression risk, different selector shape.
 */
test.describe('Button variant colors (#button-variant-colors)', () => {
  test('primary/success/error/warning render distinct backgrounds', async ({ page }) => {
    await page.goto('/demos/site/forms.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    // wb-lazy.js only injects a custom tag's behavior once it intersects the
    // viewport (IntersectionObserver) — scroll each variant into view before
    // reading its computed style, or it reads the pre-enhancement default.
    const bg = async (variant: string) => {
      const el = page.locator(`wb-button[variant="${variant}"]`).first();
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      return el.evaluate((node) => getComputedStyle(node as HTMLElement).backgroundColor);
    };

    const colors = {
      primary: await bg('primary'),
      success: await bg('success'),
      error: await bg('error'),
      warning: await bg('warning'),
    };

    // Bug signature: all variants collapse to the same neutral background.
    const distinct = new Set(Object.values(colors));
    expect(distinct.size, `variant backgrounds should all differ, got ${JSON.stringify(colors)}`).toBe(4);

    // And none of the colored variants should be the neutral/transparent fallback.
    for (const v of ['success', 'error', 'warning'] as const) {
      expect(colors[v], `${v} should not be transparent`).not.toBe('rgba(0, 0, 0, 0)');
    }
  });
});
