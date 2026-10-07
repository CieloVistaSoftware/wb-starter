import { test, expect } from '../fixtures/offline';

/**
 * demos/site/overlays.html <div x-drawer> (src/wb-viewmodels/overlay.js's
 * drawer(), PATH B -- "no schema involved", the branch every <div x-drawer> on
 * this page exercises since it's loaded via wb-lazy.js with zero
 * schema-builder support, not the SPA's `?page=` route). John, live: "WTF
 * where did this text come from? And the title is not right either?" /
 * "What is position top and bottom?" / "These variants are all the same?".
 * Three confirmed, separate bugs, all traced to PATH B's `show()`:
 *
 * 1. config.title/config.content defaulted to hardcoded 'Drawer'/'Drawer
 *    content' whenever no title/content(-ish) attribute was present, and
 *    element.textContent was never read as a fallback -- every bare-text
 *    demo (`<div x-drawer position="left">position=left</div>`) popped
 *    open showing the literal words "Drawer"/"Drawer content", unrelated to
 *    what was actually in the tag.
 * 2. show() only ever branched on `config.position === 'right'` and
 *    hardcoded a left-sidebar layout for everything else -- top and bottom
 *    rendered identically to left (both left sidebars).
 * 3. `variant` was never read anywhere in drawer() at all (grep-confirmed)
 *    and no CSS anywhere styled x-drawer--default/overlay/push -- the
 *    three variants rendered 100% identically.
 *
 * Fix: PATH B now falls back to the host's own original text (captured as
 * `originalText` before either path runs) for content when no
 * title/content-ish attribute is given, and skips rendering a title line
 * entirely when there's no title (matching drawer.schema.json's own
 * `"createdWhen": "title"`). It now builds its panel using the SAME
 * `.x-drawer__panel`/`.x-drawer--{position}`/`.x-drawer__panel--open`
 * classes drawer.css already defines for PATH A instead of a second
 * hand-rolled inline-style implementation, so all 4 positions (left/right/
 * top/bottom) render correctly via the existing CSS. `variant` is now read
 * and applied: 'push' translates the page's `body > .page` wrapper aside
 * with no dimming backdrop (Material "push" navigation drawer pattern);
 * 'default' and 'overlay' both use the existing dimming-backdrop behavior
 * (docs/behaviors/drawer.md documents no distinct treatment for
 * "default", and the schema's own declared default IS "overlay", so
 * "default" is an explicit alias) but still carry distinct
 * x-drawer--default/x-drawer--overlay classes on the panel.
 *
 * Since #884 wb-lazy.js builds schemas for attribute hosts too, so this page
 * now takes drawer()'s PATH A (schema-built panel relocated to <body>), not
 * PATH B. PATH A had none of the three fixes above: the host's text landed
 * in the schema's `title` (keepAuthoredText picked the first `{{prop}}` part
 * instead of the `<slot>` body), the body showed the schema default, and
 * variant/push were never applied. Both paths now honour all three. Two
 * assertions changed with the path, because they described PATH B's DOM
 * rather than the behavior:
 *   - PATH A pre-builds every panel, so "the panel just appended" (`.last()`)
 *     is no longer the one that opened; the rect is read from the OPEN panel
 *     once its slide-in transform has settled.
 *   - A bare drawer's title is the schema's own default (b3fc6036, John:
 *     every attribute states a default -- "this is the title"), not absent.
 *     What must never happen is the old "Drawer" placeholder or the host's
 *     own text being used as the title.
 * The push target is `body > .page` where a page has one; this page renders
 * straight into <body class="demo-page">, so its in-flow sections are pushed.
 */

async function ready(page) {
  await page.goto('/demos/site/overlays.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
  // The page is built once WB settles (#1516: not 1000ms).
  await page.waitForFunction(() => typeof (window as any).WB?.settled === 'function', null, { timeout: 15000 });
  await page.evaluate(() => (window as any).WB.settled({ timeout: 15000 }));
}

test.describe('demos/site/overlays.html <div x-drawer> PATH B: content, position, variant', () => {
  test.beforeEach(async ({ page }) => {
    await ready(page);
  });

  test('bare-text drawer (no title/content attribute) shows its own text, not "Drawer"/"Drawer content"', async ({ page }) => {
    const trigger = page.locator('#drawer-position-variants [x-drawer][position="left"]');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const panel = page.locator('.x-drawer__panel--open');
    await expect(panel).toBeVisible({ timeout: 5000 });
    // The old hardcoded placeholders must never appear, and the host's own
    // text is the BODY, not the heading.
    const titles = (await panel.locator('.x-drawer__title').allTextContents()).map((t) => t.trim());
    expect(titles).not.toContain('Drawer');
    expect(titles).not.toContain('position=left');
    const body = panel.locator('.x-drawer__body');
    await expect(body).toContainText('position=left');
    const text = (await body.textContent()) ?? '';
    expect(text).not.toContain('Drawer content');
  });

  test('drawer with a title attribute but no content attribute shows the title AND its own text as content (not the old generic placeholder)', async ({ page }) => {
    const trigger = page.locator('[x-drawer][title="Right Drawer"]');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const panel = page.locator('.x-drawer__panel--open');
    await expect(panel).toBeVisible({ timeout: 5000 });
    await expect(panel.locator('.x-drawer__title')).toHaveText('Right Drawer');
    const body = panel.locator('.x-drawer__body');
    await expect(body).toContainText('title=Right Drawer, position=right');
    const text = (await body.textContent()) ?? '';
    expect(text).not.toBe('Drawer content');
  });

  test('position=top and position=bottom render as distinct horizontal panels, not as a left sidebar', async ({ page }) => {
    const section = page.locator('#drawer-position-variants');
    const positions = ['left', 'right', 'top', 'bottom'];
    const rects: Record<string, DOMRect> = {};

    for (const pos of positions) {
      const trigger = section.locator(`[x-drawer][position="${pos}"]`);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();

      // Read the rect only once the slide-in transition has finished: the
      // open transform is the identity matrix, so toHaveCSS (which retries)
      // waits out the 0.3s transition instead of guessing at a duration.
      const panel = page.locator('.x-drawer__panel--open');
      await expect(panel, `position=${pos} should open a panel`).toBeVisible({ timeout: 5000 });
      await expect(panel).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)', { timeout: 5000 });
      rects[pos] = await panel.evaluate((el) => el.getBoundingClientRect().toJSON());
      // Close via the panel's own close button, not a second click on the
      // trigger -- once open, the full-screen .x-drawer__backdrop (fixed,
      // inset:0, z-index above the trigger) visually covers the trigger, so
      // Playwright's actionability check can never click it again (confirmed:
      // this is correct modal UX, a backdrop is SUPPOSED to block interaction
      // with what's behind it -- not a product bug, the earlier version of
      // this test asserting "click trigger again to close" was wrong).
      await page.locator('.x-drawer__panel--open .x-drawer__close').click();
      await expect(page.locator('.x-drawer__panel--open')).toHaveCount(0, { timeout: 5000 });
    }

    // left/right: vertical sidebars pinned to the left/right edge.
    expect(rects.left.x).toBeCloseTo(0, 0);
    expect(rects.left.height).toBeGreaterThan(rects.left.width);
    expect(rects.right.x + rects.right.width).toBeCloseTo(await page.evaluate(() => window.innerWidth), 0);
    expect(rects.right.height).toBeGreaterThan(rects.right.width);

    // top/bottom: horizontal panels spanning the viewport width, pinned to
    // the top/bottom edge -- this is the exact bug: before the fix these
    // rendered with the SAME rect shape as `left` (a narrow left sidebar).
    expect(rects.top.y).toBeCloseTo(0, 0);
    expect(rects.top.width).toBeGreaterThan(rects.top.height);
    expect(rects.bottom.y + rects.bottom.height).toBeCloseTo(await page.evaluate(() => window.innerHeight), 0);
    expect(rects.bottom.width).toBeGreaterThan(rects.bottom.height);

    // top and bottom must not be the same narrow-left-sidebar shape as left.
    expect(rects.top.width).not.toBeCloseTo(rects.left.width, 0);
    expect(rects.bottom.width).not.toBeCloseTo(rects.left.width, 0);
  });

  test('variant=push translates the page content aside with no dimming backdrop; variant=default/overlay both dim with a backdrop', async ({ page }) => {
    const section = page.locator('#drawer-variant-variants');

    // push: no backdrop, page content wrapper visibly translated.
    const pushTrigger = section.locator('[x-drawer][variant="push"]');
    await pushTrigger.scrollIntoViewIfNeeded();
    await pushTrigger.click();
    const pushPanel = page.locator('.x-drawer__panel--open');
    await expect(pushPanel).toBeVisible({ timeout: 5000 });
    await expect(pushPanel).toHaveClass(/x-drawer--push/);
    await expect(page.locator('.x-drawer__backdrop--open')).toHaveCount(0);
    // This page has no `body > .page` wrapper, so the push moves body's
    // in-flow children -- the section holding the trigger among them.
    const pageContent = page.locator('#drawer-variant-variants');
    await expect
      .poll(async () => pageContent.evaluate((el) => getComputedStyle(el).transform), { message: 'push variant should translate the page content' })
      .not.toBe('none');
    await page.locator('.x-drawer__panel--open .x-drawer__close').click();
    await expect(page.locator('.x-drawer__panel--open')).toHaveCount(0, { timeout: 5000 });
    await expect
      .poll(async () => pageContent.evaluate((el) => getComputedStyle(el).transform))
      .toBe('none');

    // overlay: dimming backdrop present, page content wrapper NOT translated.
    const overlayTrigger = section.locator('[x-drawer][variant="overlay"]');
    await overlayTrigger.scrollIntoViewIfNeeded();
    await overlayTrigger.click();
    const overlayPanel = page.locator('.x-drawer__panel--open');
    await expect(overlayPanel).toBeVisible({ timeout: 5000 });
    await expect(overlayPanel).toHaveClass(/x-drawer--overlay/);
    await expect(page.locator('.x-drawer__backdrop--open')).toHaveCount(1);
    const overlayPageTransform = await pageContent.evaluate((el) => getComputedStyle(el).transform);
    expect(overlayPageTransform).toBe('none');
    // Close via the close button, not a second trigger click -- the
    // dimming backdrop now covers the trigger (correct modal UX), so
    // Playwright can't click through it to reach the trigger again.
    await page.locator('.x-drawer__panel--open .x-drawer__close').click();
    await expect(page.locator('.x-drawer__panel--open')).toHaveCount(0, { timeout: 5000 });

    // default: also dims with a backdrop (alias of overlay), but carries
    // its own distinct class so it's distinguishable in the DOM.
    const defaultTrigger = section.locator('[x-drawer][variant="default"]');
    await defaultTrigger.scrollIntoViewIfNeeded();
    await defaultTrigger.click();
    const defaultPanel = page.locator('.x-drawer__panel--open');
    await expect(defaultPanel).toBeVisible({ timeout: 5000 });
    await expect(defaultPanel).toHaveClass(/x-drawer--default/);
    await expect(defaultPanel).not.toHaveClass(/x-drawer--overlay/);
    await expect(defaultPanel).not.toHaveClass(/x-drawer--push/);
    await expect(page.locator('.x-drawer__backdrop--open')).toHaveCount(1);
    await page.locator('.x-drawer__panel--open .x-drawer__close').click();
    await expect(page.locator('.x-drawer__panel--open')).toHaveCount(0, { timeout: 5000 });
  });
});
