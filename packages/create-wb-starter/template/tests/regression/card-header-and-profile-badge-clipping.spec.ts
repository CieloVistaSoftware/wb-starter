import { test, expect } from '../fixtures/offline';
import { buildInView } from '../base';

/**
 * Two related "text clipped near a card edge" bugs found live on
 * demos/site/cards.html, both stemming from the card auto-picking up a
 * generic site-chrome behavior class alongside its own (same class as
 * the #350 .x-card__footer/.x-footer collision, just never fixed for
 * headers):
 *
 * 1. A card's own semantic <header> also gets WB's site-chrome "header"
 *    behavior auto-injected (tag-map.js), adding .x-header next to
 *    .x-card__header. .x-header sets a fixed `height: 60px` that the
 *    card's own inline style never overrides (it never sets `height` at
 *    all) -- a header whose title+subtitle content needed ~74px got
 *    clamped to 60px, clipping the subtitle text below the header's own
 *    bottom border. John: "All text must be a minimum of .5rem from the
 *    bottom" (screenshot, cards.html curated gallery).
 *
 * 2. x-cardprofile's role badge (e.g. "UI/UX Designer") sat centered by
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

  // Cards no longer carry .x-card / .x-card__header / .x-card__subtitle
  // (a8a7362e): the first card on the page is the curated gallery's base
  // <article>, and its parts are its <header> and the header's <p>. The page
  // runs the lazy runtime (#491), so bring it into view and let it build.
  const card = page.locator('#card-gallery article').first();
  await buildInView(card);
  await expect(card).toBeVisible({ timeout: 10000 });
  const header = card.locator(':scope > header');
  // The page-level header behavior must not claim a card's own header at all
  // (component-landmark.js). This used to assert the collision still EXISTED
  // and that CSS papered over it; on the lazy runtime nothing did, and
  // .x-header's padding stacked a 26px gap under the subtitle.
  await expect(header).not.toHaveClass(/x-header/);

  const { offsetHeight, scrollHeight } = await header.evaluate((el) => ({
    offsetHeight: el.offsetHeight,
    scrollHeight: el.scrollHeight,
  }));
  expect(offsetHeight, 'header must be tall enough to fit its own content, not clamped by .x-header').toBeGreaterThanOrEqual(scrollHeight);

  const gap = await header.evaluate((h) => {
    const s = h.querySelector(':scope > p')!;
    return h.getBoundingClientRect().bottom - s.getBoundingClientRect().bottom;
  });
  // Exactly ~0.5rem (8px), not just "at least" -- the header's own
  // padding-bottom was reduced to 0 specifically because it was
  // double-stacking with the subtitle's own margin-bottom:0.5rem into a
  // 24-25px gap. "at least 8px" alone wouldn't have caught that
  // regression coming back (25px still satisfies >=8px).
  expect(gap, 'subtitle-to-header-border gap must be ~0.5rem (8px), not stacked with header padding').toBeGreaterThanOrEqual(7);
  expect(gap, 'subtitle-to-header-border gap must be ~0.5rem (8px), not stacked with header padding').toBeLessThanOrEqual(11);
});

test('demos/site/cards.html: [x-cardprofile] role badge clears the card\'s rounded corner', async ({ page }) => {
  await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WB, { timeout: 20000 });

  const profileCard = page.locator('[x-cardprofile]').first();
  await expect(profileCard).toBeVisible({ timeout: 10000 });
  const badge = profileCard.locator('.x-card__role');
  await expect(badge).toBeVisible();

  const { badgeTopWithinCover, cardBorderRadiusPx } = await page.evaluate(() => {
    const card = document.querySelector('[x-cardprofile]')!;
    const cover = card.querySelector('.x-card__cover')!;
    const badge = card.querySelector('.x-card__role')!;
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
