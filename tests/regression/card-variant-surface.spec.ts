import { test, expect, Page } from '../fixtures/offline';
import { buildInView } from '../base';

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
// Cards stopped stamping .x-card / .x-card--{variant} (a8a7362e): card.css
// reads [variant] straight off the <article>. The fixture's "variant variants"
// section holds one card per variant side by side, so each is found by its
// attribute there, scrolled in (lazy runtime, #491) and allowed to build.
const SECTION = '#card-variant-variants';
const cardFor = (page: Page, v: string) => page.locator(`${SECTION} article[variant="${v}"]`).first();

test.describe('.x-card variant surface (cards demo page)', () => {
  test('bordered and flat variants render visually distinct from default', async ({ page }) => {
    // bordered/flat variant examples live in the permutation-matrix test
    // fixture, not the curated demos/site/cards.html showcase page (split
    // apart because the matrix content -- 56+ cards sharing 4 duplicate
    // placeholder images -- made the demo page slow and noisy; see the
    // commit that added tests/fixtures/cards-permutation-matrix.html).
    await page.goto('/tests/fixtures/cards-permutation-matrix.html');

    const read = async (v: string) => {
      const card = cardFor(page, v);
      await buildInView(card);
      return card.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { border: cs.border, background: cs.backgroundColor };
      });
    };
    const styles = { bordered: await read('bordered'), flat: await read('flat'), default: await read('default') };

    expect(styles.bordered.border).not.toBe(styles.default.border);
    expect(styles.flat.border).not.toBe(styles.default.border);
    expect(styles.flat.background).not.toBe(styles.default.background);
  });

  test('bordered variant stays visually distinct after a hover interaction', async ({ page }) => {
    // bordered/flat variant examples live in the permutation-matrix test
    // fixture, not the curated demos/site/cards.html showcase page (split
    // apart because the matrix content -- 56+ cards sharing 4 duplicate
    // placeholder images -- made the demo page slow and noisy; see the
    // commit that added tests/fixtures/cards-permutation-matrix.html).
    await page.goto('/tests/fixtures/cards-permutation-matrix.html');
    const bordered = cardFor(page, 'bordered');
    await buildInView(bordered);

    // card.css gives cards `transition: all 0.2s`, so the border animates in
    // from 0px as the bordered style applies. Each read is polled until it
    // settles: a single read on a loaded runner can land mid-animation and
    // see "0px" (#1307).
    const border = () => bordered.evaluate((el) => getComputedStyle(el).border);
    await expect.poll(border).toContain('2px');
    const before = await border();
    await bordered.hover();
    await page.mouse.move(0, 0); // move away to fire mouseleave
    await expect.poll(border).toBe(before);
  });
});
