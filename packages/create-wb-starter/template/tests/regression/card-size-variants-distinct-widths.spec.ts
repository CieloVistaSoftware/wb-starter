import { test, expect } from '@playwright/test';

/**
 * "write a test to prove that these all are the same size" -- the size
 * variants section of tests/fixtures/cards-permutation-matrix.html
 * (<wb-card size="xs|sm|md|lg|xl|full|auto">) rendered every box visually
 * identical. Two distinct root causes:
 *
 * 1. card.js's size-class allowlist was missing 'auto' (a real
 *    schema-declared enum value, matching an existing .wb-card--auto CSS
 *    rule) -- <wb-card size="auto"> got no class at all, same bug already
 *    fixed once for 'xs' (#282), never extended to 'auto'.
 * 2. The demo wrapped all 7 cards in one `columns="3"` <wb-demo> grid.
 *    Equal 1fr grid tracks cap every card's rendered width at the
 *    column's own width regardless of the card's own max-width -- lg
 *    (480px)/xl (600px)/full (100%)/auto (none) all measured the exact
 *    same ~379px (the column's width), since each individually exceeded
 *    what its shared column track could give it. Moved to columns="1" so
 *    each card sizes to its own real max-width instead.
 */

test('wb-card size variants render at genuinely distinct widths', async ({ page }) => {
  await page.goto('/tests/fixtures/cards-permutation-matrix.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WB, { timeout: 20000 });
  await page.waitForTimeout(500);

  const section = page.locator('#card-size-variants');
  await expect(section).toBeVisible();

  const widths = await section.evaluate((el) => {
    const cards = [...el.querySelectorAll('wb-card')];
    return cards.map((c) => ({
      size: c.getAttribute('size'),
      width: c.getBoundingClientRect().width,
      hasClass: c.className.includes(`wb-card--${c.getAttribute('size')}`),
    }));
  });

  expect(widths.length, 'expected all 7 size-variant cards').toBe(7);

  for (const { size, hasClass } of widths) {
    expect(hasClass, `wb-card size="${size}" must get its wb-card--${size} class applied`).toBe(true);
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
