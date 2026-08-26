import { test, expect } from '@playwright/test';

/**
 * <div x-cardprofile cover="…" role="…"> renders the role as a pill badge
 * overlaid on the cover strip (.x-card__role--badge, card.js's
 * cardprofile()).
 *
 * Position went through two rounds per John's live feedback:
 *   1. Was `top: 8px; right: 0.6rem` (pinned top-right, not centered at
 *      all) -- "why isn't this centered?" -> changed to horizontal
 *      centering (`left: 50%; transform: translateX(-50%)`, keeping the
 *      existing top:8px corner clearance).
 *   2. "no, center this vertically and put it on the right side" --
 *      changed again to `top: 50%; right: 0.75rem; transform:
 *      translateY(-50%)`. The card's own history already warned this exact
 *      combination once clipped the badge's rounded corner against the
 *      card's border-radius curve (`--radius-lg`, 8px) when it sat too
 *      close to the edge -- `right: 0.75rem` (12px) was chosen specifically
 *      to clear that 8px radius with margin, confirmed live: badge's top
 *      clearance from the cover's top edge (~9.6px) and right clearance
 *      from the cover's right edge (12px) both exceed the 8px radius, so
 *      neither the top-right nor any corner of the pill can fall inside
 *      the curve.
 */

test.describe('x-cardprofile role badge', () => {
  test('role badge is vertically centered on the cover strip', async ({ page }) => {
    await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });
    const badge = page.locator('.x-card__role--badge').first();
    await expect(badge).toBeVisible();

    const cover = page.locator('.x-card__cover').first();
    const [badgeBox, coverBox] = await Promise.all([badge.boundingBox(), cover.boundingBox()]);
    expect(badgeBox && coverBox, 'both badge and cover must have a bounding box').toBeTruthy();

    const badgeVCenter = badgeBox!.y + badgeBox!.height / 2;
    const coverVCenter = coverBox!.y + coverBox!.height / 2;
    expect(Math.abs(badgeVCenter - coverVCenter), 'badge vertical center must align with cover vertical center').toBeLessThanOrEqual(5);
  });

  test('role badge sits on the right side of the cover strip', async ({ page }) => {
    await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });
    const badge = page.locator('.x-card__role--badge').first();
    const cover = page.locator('.x-card__cover').first();
    const [badgeBox, coverBox] = await Promise.all([badge.boundingBox(), cover.boundingBox()]);

    const badgeCenterX = badgeBox!.x + badgeBox!.width / 2;
    const coverCenterX = coverBox!.x + coverBox!.width / 2;
    expect(badgeCenterX, 'badge must sit right of the cover\'s horizontal center').toBeGreaterThan(coverCenterX);
  });

  test('role badge clears the card\'s border-radius curve on both edges (no corner clipping)', async ({ page }) => {
    await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });
    const badge = page.locator('.x-card__role--badge').first();
    const cover = page.locator('.x-card__cover').first();
    const card = page.locator('.x-card').filter({ has: page.locator('.x-card__cover') }).first();

    const [badgeBox, coverBox] = await Promise.all([badge.boundingBox(), cover.boundingBox()]);
    const radiusPx = await card.evaluate((el) => parseFloat(getComputedStyle(el).borderRadius));

    const clearanceFromRight = coverBox!.x + coverBox!.width - (badgeBox!.x + badgeBox!.width);
    const clearanceFromTop = badgeBox!.y - coverBox!.y;

    expect(clearanceFromRight, `right clearance (${clearanceFromRight}px) must exceed the card's border-radius (${radiusPx}px)`).toBeGreaterThan(radiusPx);
    expect(clearanceFromTop, `top clearance (${clearanceFromTop}px) must exceed the card's border-radius (${radiusPx}px)`).toBeGreaterThan(radiusPx);
  });
});
