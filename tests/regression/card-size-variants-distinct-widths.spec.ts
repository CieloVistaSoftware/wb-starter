import { test, expect } from '../fixtures/offline';
import { buildInView } from '../base';

/**
 * "write a test to prove that these all are the same size" -- the size
 * variants section of tests/fixtures/cards-permutation-matrix.html
 * (<article size="xs|sm|md|lg|xl|full|auto">) rendered every box visually
 * identical. Two distinct root causes:
 *
 * 1. card.js's size-class allowlist was missing 'auto' (a real
 *    schema-declared enum value, matching an existing .x-card--auto CSS
 *    rule) -- <article size="auto"> got no class at all, same bug already
 *    fixed once for 'xs' (#282), never extended to 'auto'.
 * 2. The demo wrapped all 7 cards in one `columns="3"` <div x-demo> grid.
 *    Equal 1fr grid tracks cap every card's rendered width at the
 *    column's own width regardless of the card's own max-width -- lg
 *    (480px)/xl (600px)/full (100%)/auto (none) all measured the exact
 *    same ~379px (the column's width), since each individually exceeded
 *    what its shared column track could give it. Moved to columns="1" so
 *    each card sizes to its own real max-width instead.
 */

test('.x-card size variants render at genuinely distinct widths', async ({ page }) => {
  await page.goto('/tests/fixtures/cards-permutation-matrix.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WB, { timeout: 20000 });

  const section = page.locator('#card-size-variants');
  // Cards carry no .x-card class since a8a7362e -- a base card is its
  // <article>. And the page runs the lazy runtime (#491): scroll each card in
  // and let it build before measuring, rather than a 500ms guess.
  const cards = section.locator('article[size]');
  await expect(cards, 'expected all 7 size-variant cards').toHaveCount(7);
  for (const card of await cards.all()) await buildInView(card);
  await expect(section).toBeVisible();

  const widths = await cards.evaluateAll((els) => els.map((c) => ({
    size: c.getAttribute('size'),
    width: c.getBoundingClientRect().width,
    hasClass: c.classList.contains(`x-card--${c.getAttribute('size')}`),
  })));

  for (const { size, hasClass } of widths) {
    // `auto` is the DEFAULT and card.css declares it on the base rule, so
    // composeCard deliberately stamps no --auto modifier (it would sit on
    // every card and mean nothing). Every other size is a real modifier.
    if (size === 'auto') {
      expect(hasClass, 'size="auto" is the default and carries no modifier class').toBe(false);
    } else {
      expect(hasClass, `x-card size="${size}" must get its x-card--${size} class applied`).toBe(true);
    }
  }

  const bySize = Object.fromEntries(widths.map((w) => [w.size, w.width]));
  // xs < sm < md < lg < xl must strictly increase -- these are all tighter
  // than the available row width, so nothing should clamp them together.
  expect(bySize.xs, 'xs must be narrower than sm').toBeLessThan(bySize.sm);
  expect(bySize.sm, 'sm must be narrower than md').toBeLessThan(bySize.md);
  expect(bySize.md, 'md must be narrower than lg').toBeLessThan(bySize.lg);
  expect(bySize.lg, 'lg must be narrower than xl').toBeLessThan(bySize.xl);
  // full/auto are unconstrained/container-width, so they may legitimately
  // match each other, but both must be at least as wide as xl -- not
  // collapsed down to it.
  expect(bySize.full, 'full must be at least as wide as xl').toBeGreaterThanOrEqual(bySize.xl);
  expect(bySize.auto, 'auto must be at least as wide as xl').toBeGreaterThanOrEqual(bySize.xl);
});
