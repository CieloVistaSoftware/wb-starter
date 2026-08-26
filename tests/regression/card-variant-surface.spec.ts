import { test, expect } from '@playwright/test';

/**
 * card.schema.json's `variant` enum is default/glass/bordered/flat.
 * cardBase() (card.js) applied a generic background+border as INLINE
 * styles unconditionally on every card -- inline styles always beat a CSS
 * class selector regardless of specificity, so `.x-card--bordered` and
 * `.x-card--flat` (card.css) never had a chance to apply even after CSS
 * rules were added for them. Every card variant/size rendered visually
 * identical (confirmed live via screenshot: "Bordered Card"/"Flat Card"
 * indistinguishable from "Default Card"). The same inline override also
 * fired on every mouseleave (hoverLeave()), re-breaking it after any hover.
 * Fixed by only applying the generic inline surface for the actual
 * `default` variant, letting every other variant's own CSS class own its
 * background/border.
 */
test.describe('.x-card variant surface (cards demo page)', () => {
  test('bordered and flat variants render visually distinct from default', async ({ page }) => {
    // bordered/flat variant examples live in the permutation-matrix test
    // fixture, not the curated demos/site/cards.html showcase page (split
    // apart because the matrix content -- 56+ cards sharing 4 duplicate
    // placeholder images -- made the demo page slow and noisy; see the
    // commit that added tests/fixtures/cards-permutation-matrix.html).
    await page.goto('/tests/fixtures/cards-permutation-matrix.html');
    await page.waitForSelector('.x-card.x-card--bordered');
    await page.waitForSelector('.x-card.x-card--flat');

    const styles = await page.evaluate(() => {
      const byVariant = (v: string) =>
        Array.from(document.querySelectorAll('.x-card')).find((c) => c.classList.contains(`x-card--${v}`));
      const byDefault = () =>
        Array.from(document.querySelectorAll('.x-card')).find(
          (c) => !['glass', 'bordered', 'flat', 'elevated', 'rack'].some((v) => c.classList.contains(`x-card--${v}`)),
        );
      const read = (el: Element | undefined) => {
        if (!el) return null;
        const cs = getComputedStyle(el);
        return { border: cs.border, background: cs.backgroundColor };
      };
      return {
        bordered: read(byVariant('bordered')),
        flat: read(byVariant('flat')),
        default: read(byDefault()),
      };
    });

    expect(styles.bordered).not.toBeNull();
    expect(styles.flat).not.toBeNull();
    expect(styles.default).not.toBeNull();

    expect(styles.bordered!.border).not.toBe(styles.default!.border);
    expect(styles.flat!.border).not.toBe(styles.default!.border);
    expect(styles.flat!.background).not.toBe(styles.default!.background);
  });

  test('bordered variant stays visually distinct after a hover interaction', async ({ page }) => {
    // bordered/flat variant examples live in the permutation-matrix test
    // fixture, not the curated demos/site/cards.html showcase page (split
    // apart because the matrix content -- 56+ cards sharing 4 duplicate
    // placeholder images -- made the demo page slow and noisy; see the
    // commit that added tests/fixtures/cards-permutation-matrix.html).
    await page.goto('/tests/fixtures/cards-permutation-matrix.html');
    const bordered = page.locator('.x-card.x-card--bordered').first();
    await bordered.waitFor();

    const before = await bordered.evaluate((el) => getComputedStyle(el).border);
    await bordered.hover();
    await page.mouse.move(0, 0); // move away to fire mouseleave
    await page.waitForTimeout(100);
    const after = await bordered.evaluate((el) => getComputedStyle(el).border);

    expect(after).toBe(before);
    expect(after).toContain('2px');
  });
});
