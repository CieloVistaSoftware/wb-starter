import { test, expect } from '../fixtures/offline';

import { settlePage } from '../base';
/**
 * #1387 -- a hero that is the only thing in an x-demo fills the demo's row.
 *
 * x-demo shrinks a single-item demo to its content (Standard §7). A hero asks
 * for width:100% of the track that is sizing itself from the hero, so both
 * collapsed: on demos/site/interactive.html both hero examples measured
 * ~206px wide in a ~1050px section. The `full-width` attribute opted out, but
 * only where someone remembered to write it (demo.js says as much). A lone
 * hero is full-bleed by nature, so the demo now opts out for it.
 */
test('a lone x-hero in an x-demo spans the section, not its text width', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/demos/site/interactive.html');
  const section = page.locator('#hero-hero');
  await section.scrollIntoViewIfNeeded();
  const heroes = section.locator('[x-hero]');
  await expect(heroes).toHaveCount(2);
  for (const i of [0, 1]) await expect(heroes.nth(i)).toHaveAttribute('x-ready', '', { timeout: 30_000 });
  await settlePage(page, { timeout: 10_000 });

  const sizes = await section.evaluate((s) => {
    const content = s.clientWidth - parseFloat(getComputedStyle(s).paddingLeft) - parseFloat(getComputedStyle(s).paddingRight);
    return {
      content,
      heroes: Array.from(s.querySelectorAll('[x-hero]')).map((h) => Math.round(h.getBoundingClientRect().width)),
    };
  });
  for (const w of sizes.heroes) {
    expect(w, `hero ${w}px wide in a ${Math.round(sizes.content)}px section`).toBeGreaterThan(sizes.content * 0.8);
  }
});
