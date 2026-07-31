import { test, expect } from '@playwright/test';

/**
 * Two related "text clipped near a card edge" bugs found live on
 * demos/site/cards.html, both stemming from the card auto-picking up a
 * generic site-chrome behavior class alongside its own (same class as
 * the #350 .wb-card__footer/.wb-footer collision, just never fixed for
 * headers):
 *
 * 1. A card's own semantic <header> also gets WB's site-chrome "header"
 *    behavior auto-injected (tag-map.js), adding .wb-header next to
 *    .wb-card__header. .wb-header sets a fixed `height: 60px` that the
 *    card's own inline style never overrides (it never sets `height` at
 *    all) -- a header whose title+subtitle content needed ~74px got
 *    clamped to 60px, clipping the subtitle text below the header's own
 *    bottom border. John: "All text must be a minimum of .5rem from the
 *    bottom" (screenshot, cards.html curated gallery).
 *
 * 2. wb-cardprofile's role badge (e.g. "UI/UX Designer") sat centered by
 *    bounding-box math within its 28px cover strip, but that box-level
 *    centering placed it almost entirely inside the card's own 8px
 *    border-radius + overflow:hidden corner curve -- visibly clipped
 *    against the rounded corner even though a plain rect-containment
 *    check reports no overflow. John: "why haven't you corrected the
 *    y-placement of the role?" (screenshot).
 */

test('demos/site/cards.html: card header is never clamped below its own content height', async ({ page }) => {
  await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WB, { timeout: 20000 });

  const card = page.locator('wb-card').first();
  await expect(card).toBeVisible({ timeout: 10000 });
  const header = card.locator('.wb-card__header');
  await expect(header).toHaveClass(/wb-header/); // confirms the collision still exists -- CSS must override it

  const { offsetHeight, scrollHeight } = await header.evaluate((el) => ({
    offsetHeight: el.offsetHeight,
    scrollHeight: el.scrollHeight,
  }));
  expect(offsetHeight, 'header must be tall enough to fit its own content, not clamped by .wb-header').toBeGreaterThanOrEqual(scrollHeight);

  const subtitle = card.locator('.wb-card__subtitle').first();
  const gap = await page.evaluate(() => {
    const h = document.querySelector('wb-card .wb-card__header')!;
    const s = document.querySelector('wb-card .wb-card__subtitle')!;
    return h.getBoundingClientRect().bottom - s.getBoundingClientRect().bottom;
  });
  expect(gap, 'subtitle must keep clearance above the header bottom border, not overflow past it').toBeGreaterThanOrEqual(8);
});

test('demos/site/cards.html: wb-cardprofile role badge clears the card\'s rounded corner', async ({ page }) => {
  await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WB, { timeout: 20000 });

  const profileCard = page.locator('wb-cardprofile').first();
  await expect(profileCard).toBeVisible({ timeout: 10000 });
  const badge = profileCard.locator('.wb-card__role');
  await expect(badge).toBeVisible();

  const { badgeTopWithinCover, cardBorderRadiusPx } = await page.evaluate(() => {
    const card = document.querySelector('wb-cardprofile')!;
    const cover = card.querySelector('.wb-card__cover')!;
    const badge = card.querySelector('.wb-card__role')!;
    const coverRect = cover.getBoundingClientRect();
    const badgeRect = badge.getBoundingClientRect();
    const radius = parseFloat(getComputedStyle(card).borderTopRightRadius);
    return {
      badgeTopWithinCover: badgeRect.top - coverRect.top,
      cardBorderRadiusPx: radius,
    };
  });
  // The badge's top edge must clear the corner-radius zone, not just avoid
  // overflowing the cover's own rectangular box -- a rect-containment
  // check alone missed this bug entirely.
  expect(badgeTopWithinCover, 'role badge must clear the card\'s rounded-corner radius, not sit inside it').toBeGreaterThanOrEqual(cardBorderRadiusPx);
});
