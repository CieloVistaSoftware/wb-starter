import { test, expect } from '@playwright/test';

/**
 * Button variant colors must be distinct.
 *
 * Regression guard: button.js injects a plain `.wb-button { background: var(--bg-secondary) }`
 * rule at runtime. Being equal-specificity but later in source order, it overrode the
 * single-class `.wb-button--success/danger/warning` variant colors from button.css — every
 * button collapsed to the same neutral background (no color difference). Fixed by raising the
 * variant selectors to `.wb-button.wb-button--*` (specificity 0,2,0).
 */
test.describe('Button variant colors (#button-variant-colors)', () => {
  test('primary/success/danger/warning render distinct backgrounds', async ({ page }) => {
    await page.goto('/demos/button-variants-demo.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500); // WB.init() + button behavior injects its styles

    const bg = (cls: string) =>
      page.locator(`button.${cls}`).first().evaluate((el) => getComputedStyle(el as HTMLElement).backgroundColor);

    const colors = {
      primary: await bg('wb-button--primary'),
      success: await bg('wb-button--success'),
      danger: await bg('wb-button--danger'),
      warning: await bg('wb-button--warning'),
    };

    // Bug signature: all variants collapse to the same neutral background.
    const distinct = new Set(Object.values(colors));
    expect(distinct.size, `variant backgrounds should all differ, got ${JSON.stringify(colors)}`).toBe(4);

    // And none of the colored variants should be the neutral/transparent fallback.
    for (const v of ['success', 'danger', 'warning'] as const) {
      expect(colors[v], `${v} should not be transparent`).not.toBe('rgba(0, 0, 0, 0)');
    }
  });
});
