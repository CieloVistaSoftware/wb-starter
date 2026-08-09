import { test, expect } from '@playwright/test';

/**
 * pages/behaviors.html's hero `<header id="header">` (H1 + subtitle +
 * theme control) is a plain semantic tag, not a `<wb-header>` component --
 * but tag-map.js's nativeMap auto-injects the generic header() behavior
 * onto EVERY bare <header> site-wide, adding class="wb-header"
 * (src/styles/behaviors/header.css: fixed height:60px, padding:0 1.5rem).
 * That fixed 60px box is shorter than the hero's actual H1+subtitle
 * content, so the content silently overflowed past the header's own
 * bottom edge, into the space where <nav id="nav"> (the section-links
 * pill bar) starts immediately after in document flow -- the header's own
 * box height controls layout of following siblings, not its (visible,
 * overflow:visible) overflowing content, so the two visually overlapped.
 *
 * Root cause was two-fold in src/core/wb-lazy.js's WB.scan():
 *   1. The element had no working escape hatch: x-ignore was checked by
 *      wb.js's own autoInjectMappings loop, but wb-lazy.js's INLINE copy of
 *      that same loop (inside scan() itself, used for the page's initial
 *      scan) never checked it at all -- a separate, later
 *      getAutoInjectBehaviors() (used only by the MutationObserver path for
 *      dynamically-added nodes) did check it, but that's not what runs on
 *      first page load.
 *   2. Fix: added the x-ignore check to scan()'s inline auto-inject loop,
 *      then added x-ignore to pages/behaviors.html's hero <header> itself,
 *      so it keeps only behaviors.css's own content-driven `header {}`
 *      rules (flex, no fixed height) instead of the generic navbar style.
 */

async function ready(page) {
  await page.goto('/pages/behaviors.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#nav a');
  // Let auto-inject/behavior scan settle.
  await page.waitForTimeout(500);
}

test.describe('behaviors.html hero header: sized to its content, no overlap with nav', () => {
  test('header contains its H1+subtitle, and does not overlap the nav pill bar', async ({ page }) => {
    await ready(page);

    const header = page.locator('#header');
    const content = page.locator('#autogen-behaviors-html-0');
    const nav = page.locator('#nav');

    await expect(header).toBeVisible();
    await expect(content).toBeVisible();
    await expect(nav).toBeVisible();

    const headerBox = (await header.boundingBox())!;
    const contentBox = (await content.boundingBox())!;
    const navBox = (await nav.boundingBox())!;

    // Proof 1: the header must be tall enough to fully contain its own
    // H1+subtitle content -- a header whose own box ends above where its
    // content actually renders is not containing that content.
    expect(
      headerBox.y + headerBox.height,
      `header bottom (${headerBox.y + headerBox.height}) must be >= its content's bottom (${contentBox.y + contentBox.height}) -- the header box must be tall enough to contain the H1 and subtitle`
    ).toBeGreaterThanOrEqual(contentBox.y + contentBox.height - 0.5);

    // Proof 2: two distinct elements -- the header's content wrapper and the
    // nav pill bar -- must not occupy overlapping vertical space.
    const overlapY = Math.min(contentBox.y + contentBox.height, navBox.y + navBox.height) - Math.max(contentBox.y, navBox.y);
    expect(
      overlapY,
      `header content and nav must not overlap (found ${overlapY}px of vertical overlap) -- these are two separate elements and must not occupy the same space`
    ).toBeLessThanOrEqual(0);

    // The generic native auto-inject header() behavior (wb-header navbar
    // class, fixed 60px height) must not have been applied to this
    // content hero -- it opts out via x-ignore.
    await expect(header).not.toHaveClass(/\bwb-header\b/);
  });
});
