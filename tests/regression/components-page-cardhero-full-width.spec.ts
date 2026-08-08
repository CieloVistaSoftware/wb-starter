import { test, expect } from '@playwright/test';

/**
 * pages/components.html: the standalone <wb-cardhero> under "Overlay & Hero
 * Cards" collapses to a narrow sliver instead of spanning the page.
 *
 * Root cause (traced, not guessed): a single-item <wb-demo> shrinks to its
 * child's own intrinsic content width by design (Standard §7 -- so a lone
 * <button> demo doesn't stretch to the full grid column). wb-cardhero is a
 * banner-style component meant to fill its container even alone, so
 * demo.css documents an explicit escape hatch: `<wb-demo full-width>`
 * (src/styles/behaviors/demo.css, "Escape hatch for §7"). Every OTHER
 * single-item wb-cardhero demo on the site already opts in
 * (demos/site/cards.html:38, `<wb-demo id="demo-hero" columns="1"
 * full-width>`) -- pages/components.html:63 is the one instance that never
 * got the attribute when authored.
 */

test('?page=components: standalone <wb-cardhero> demo spans full width, not a narrow sliver', async ({ page }) => {
  await page.goto('/?page=components', { waitUntil: 'domcontentloaded' });

  const hero = page.locator('wb-cardhero').first();
  await expect(hero).toBeVisible();

  const heroBox = await hero.boundingBox();
  expect(heroBox, 'wb-cardhero must have a measurable box').not.toBeNull();

  // Compare against the page's own content column, not the raw viewport --
  // the page has real side margins/padding this shouldn't need to fight.
  const contentBox = await page.locator('.page__hero').first().boundingBox();
  expect(contentBox, 'page content container must have a measurable box').not.toBeNull();

  const ratio = heroBox!.width / contentBox!.width;
  expect(
    ratio,
    `wb-cardhero rendered ${Math.round(heroBox!.width)}px wide against a ` +
    `${Math.round(contentBox!.width)}px content column (ratio ${ratio.toFixed(2)}) -- ` +
    `collapsed to a narrow sliver instead of spanning full width like every ` +
    `other standalone wb-cardhero demo on the site.`
  ).toBeGreaterThan(0.85);

  // The other half of the same bug: a collapsed-width hero with real height
  // (background image + title/subtitle) reads as a tall narrow strip.
  const aspectRatio = heroBox!.height / heroBox!.width;
  expect(
    aspectRatio,
    `wb-cardhero is ${Math.round(heroBox!.width)}x${Math.round(heroBox!.height)} ` +
    `(height:width ratio ${aspectRatio.toFixed(2)}) -- a hero banner must be wide, not tall.`
  ).toBeLessThan(1);
});
