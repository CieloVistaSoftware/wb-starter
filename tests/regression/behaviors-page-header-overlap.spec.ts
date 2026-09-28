import { test, expect } from '../fixtures/offline';

/**
 * pages/behaviors.html's hero `<header id="header">` (H1 + subtitle +
 * theme control) is a plain semantic tag, not a `<header>` component --
 * but tag-map.js's nativeMap auto-injects the generic header() behavior
 * onto EVERY bare <header> site-wide, adding class="x-header"
 * (src/styles/behaviors/header.css: fixed height:60px, padding:0 1.5rem).
 * That fixed 60px box is shorter than the hero's actual H1+subtitle
 * content, so the content silently overflowed past the header's own
 * bottom edge, into the space where <nav id="nav"> (the section-links
 * pill bar) starts immediately after in document flow -- the header's own
 * box height controls layout of following siblings, not its (visible,
 * overflow:visible) overflowing content, so the two visually overlapped.
 *
 * Root cause was two-fold in src/core/wb-lazy.js's await WB.scan():
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
 *
 * The page this was found on no longer has that hero: #774 removed the
 * visible title/subtitle and the jump-nav pill bar went with the inline demos
 * (#behaviors-hero is now a search workspace with an sr-only <h1>), so
 * `#header`/`#nav` matched nothing and the test timed out. The defect it
 * guards is not page-specific -- any content <header x-ignore> followed by a
 * <nav> -- so it is reproduced here on the test harness, through the same
 * WB.scan() inline auto-inject loop that lacked the x-ignore check.
 */

const HARNESS = '/demos/test-harness.html';

async function ready(page) {
  await page.goto(HARNESS);
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.scan, { timeout: 10000 });
  await page.evaluate(async () => {
    const container = document.createElement('div');
    container.id = 'hero-overlap-test';
    container.innerHTML = `
      <header id="header" x-ignore>
        <div id="hero-content">
          <h1>Behaviors</h1>
          <p>A subtitle long enough to need its own line under the heading.</p>
        </div>
      </header>
      <nav id="nav"><a href="#a">Section A</a> <a href="#b">Section B</a></nav>`;
    document.body.appendChild(container);
    await (window as any).WB.scan(container, { eager: true });
  });
  // Let auto-inject/behavior scan settle.
  await page.waitForTimeout(500);
}

test.describe('content <header x-ignore>: sized to its content, no overlap with the following nav', () => {
  test('header contains its H1+subtitle, and does not overlap the nav', async ({ page }) => {
    await ready(page);

    const header = page.locator('#header');
    const content = page.locator('#hero-content');
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
    // nav -- must not occupy overlapping vertical space.
    const overlapY = Math.min(contentBox.y + contentBox.height, navBox.y + navBox.height) - Math.max(contentBox.y, navBox.y);
    expect(
      overlapY,
      `header content and nav must not overlap (found ${overlapY}px of vertical overlap) -- these are two separate elements and must not occupy the same space`
    ).toBeLessThanOrEqual(0);

    // The generic native auto-inject header() behavior must not have been
    // applied -- the header opts out via x-ignore. (Was /wb-header/, a class
    // nothing has emitted since the wb- prefix was removed, so it could never
    // fail; header() adds .x-header.)
    await expect(header).not.toHaveClass(/\bx-header\b/);
  });
});
