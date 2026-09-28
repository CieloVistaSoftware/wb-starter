import { test, expect, Page } from '../fixtures/offline';
import { buildInView } from '../base';

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

// cards.html runs the lazy runtime (#491): the first profile card with a
// cover and a role is far below the fold and is not built until scrolled to,
// so every test brings it into view and waits for it first. The badge and
// cover are then read from THAT card, not from whatever `.first()` on the page
// happens to be -- the old `.x-card` locator matched nothing at all once
// cards stopped carrying the class (a8a7362e).
async function profileWithRoleBadge(page: Page) {
  await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });
  const card = page.locator('[x-cardprofile][cover][role]').first();
  await buildInView(card);
  return {
    card,
    badge: card.locator('.x-card__cover > .x-card__role--badge'),
    cover: card.locator('.x-card__cover'),
  };
}


/**
 * Badge and cover boxes from ONE frame. Two boundingBox() calls are two round
 * trips, and cards.html is still growing above this card while its demos
 * build -- CI read the badge 257px above its own cover ("top clearance
 * -256.89px") because the page moved between the two reads.
 */
function boxes(card: import('@playwright/test').Locator) {
  return card.evaluate((el) => {
    const r = (q: string) => el.querySelector(q)!.getBoundingClientRect();
    const b = r('.x-card__cover > .x-card__role--badge');
    const c = r('.x-card__cover');
    return {
      badgeBox: { x: b.x, y: b.y, width: b.width, height: b.height },
      coverBox: { x: c.x, y: c.y, width: c.width, height: c.height },
      radiusPx: parseFloat(getComputedStyle(el).borderRadius),
    };
  });
}

test.describe('[x-cardprofile] role badge', () => {
  test('role badge is vertically centered on the cover strip', async ({ page }) => {
    const { card, badge } = await profileWithRoleBadge(page);
    await expect(badge).toBeVisible();

    const { badgeBox, coverBox } = await boxes(card);

    const badgeVCenter = badgeBox!.y + badgeBox!.height / 2;
    const coverVCenter = coverBox!.y + coverBox!.height / 2;
    expect(Math.abs(badgeVCenter - coverVCenter), 'badge vertical center must align with cover vertical center').toBeLessThanOrEqual(5);
  });

  test('role badge sits on the right side of the cover strip', async ({ page }) => {
    const { card, badge } = await profileWithRoleBadge(page);
    await expect(badge).toBeVisible();
    const { badgeBox, coverBox } = await boxes(card);

    const badgeCenterX = badgeBox!.x + badgeBox!.width / 2;
    const coverCenterX = coverBox!.x + coverBox!.width / 2;
    expect(badgeCenterX, 'badge must sit right of the cover\'s horizontal center').toBeGreaterThan(coverCenterX);
  });

  test('role badge clears the card\'s border-radius curve on both edges (no corner clipping)', async ({ page }) => {
    const { card, badge } = await profileWithRoleBadge(page);
    await expect(badge).toBeVisible();

    const { badgeBox, coverBox, radiusPx } = await boxes(card);

    const clearanceFromRight = coverBox!.x + coverBox!.width - (badgeBox!.x + badgeBox!.width);
    const clearanceFromTop = badgeBox!.y - coverBox!.y;

    expect(clearanceFromRight, `right clearance (${clearanceFromRight}px) must exceed the card's border-radius (${radiusPx}px)`).toBeGreaterThan(radiusPx);
    expect(clearanceFromTop, `top clearance (${clearanceFromTop}px) must exceed the card's border-radius (${radiusPx}px)`).toBeGreaterThan(radiusPx);
  });
});
