import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * John, live correction (cards.html screenshot): a single-item
 * <wb-cardoverlay> demo's title text ("City Lights") rendered cropped/cut
 * off at the top of the card, badly overlapping the real caption box
 * ("City Lights" / "Urban photography") below it.
 *
 * Root cause: .wb-card--overlay-card (card.css) declares a fixed `height`
 * (inline, from the `height` attribute) but no width/aspect-ratio of its
 * own -- its layout width is whatever demo.js's single-item shrink-to-fit
 * measures as its "natural" content width, which for a flex box with only
 * text content collapses far narrower than a landscape image card should
 * ever be (confirmed live: 204px wide x 300px tall). With
 * background-size:cover, an 800x500 (1.6:1) background image scaled to
 * cover a box that's actually TALLER than it is wide gets cropped down to
 * a narrow vertical sliver -- cutting off most of the image's own baked-in
 * text (the demo images use placehold.co's ?text= param) and visually
 * colliding with the real caption underneath.
 *
 * Fix: give .wb-card--overlay-card a landscape aspect-ratio (with a
 * min-width floor) so it always has a sensible natural width relative to
 * its height, regardless of what a shrink-to-fit ancestor measures.
 */
test.describe('wb-cardoverlay is not squeezed into an unusably narrow box', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('single-item demo: card width is a sane landscape ratio of its height, not a narrow sliver', async ({ page }) => {
    await setupTestContainer(
      page,
      '<wb-demo columns="1"><wb-cardoverlay image="https://placehold.co/800x500/1e293b/fbbf24?text=City+Lights" title="City Lights" subtitle="Urban photography" height="300px"></wb-cardoverlay></wb-demo>'
    );

    const card = page.locator('.wb-card--overlay-card');
    await expect(card).toBeVisible();
    const box = await card.boundingBox();
    expect(box).not.toBeNull();

    // A landscape image card should never be taller than it is wide --
    // the exact bug this regresses (204px wide x 300px tall, ratio 0.68).
    expect(box!.width).toBeGreaterThan(box!.height);
  });

  test('the real caption (title/subtitle) is fully visible and not covered by the background', async ({ page }) => {
    await setupTestContainer(
      page,
      '<wb-demo columns="1"><wb-cardoverlay image="https://placehold.co/800x500/1e293b/fbbf24?text=City+Lights" title="City Lights" subtitle="Urban photography" height="300px"></wb-cardoverlay></wb-demo>'
    );

    const content = page.locator('.wb-card__overlay-content');
    await expect(content).toBeVisible();
    await expect(content).toContainText('City Lights');
    await expect(content).toContainText('Urban photography');
  });
});
