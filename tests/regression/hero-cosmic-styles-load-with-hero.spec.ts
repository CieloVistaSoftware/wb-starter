import { test, expect } from '../fixtures/offline';

/**
 * #1222 -- x-hero variant="cosmic" is styled on a real page, with nothing
 * loaded by hand.
 *
 * The cosmic rules lived only in src/styles/x-signature.css, which no page,
 * manifest entry or loader references. The runtime adds a declared modifier
 * only when a loaded stylesheet defines it, so .x-hero--cosmic was never even
 * applied, and the hero looked like the default. The one test that covered it
 * passed only because it added x-signature.css itself.
 *
 * Uses demos/site/interactive.html as shipped: whatever hero.css the behavior
 * loads is all the page gets.
 */
test('variant="cosmic" gets its class and its nebula background from the hero behavior alone', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/demos/site/interactive.html');
  const hero = page.locator('[x-hero][variant="cosmic"]').first();
  await hero.scrollIntoViewIfNeeded();
  await expect(hero).toHaveAttribute('x-ready', '', { timeout: 30_000 });

  await expect(hero, 'the modifier class is applied only when a loaded stylesheet defines it').toHaveClass(/\bx-hero--cosmic\b/);
  const look = await hero.evaluate((el) => {
    const cs = getComputedStyle(el);
    const before = getComputedStyle(el, '::before');
    return { bg: cs.backgroundImage, beforeBg: before.backgroundImage, beforePos: before.position };
  });
  expect(look.bg, 'the deep-space background').toContain('radial-gradient');
  expect(look.beforeBg, 'the nebula layer').toContain('radial-gradient');
  expect(look.beforePos, 'the nebula layer covers the hero').toBe('absolute');
});
