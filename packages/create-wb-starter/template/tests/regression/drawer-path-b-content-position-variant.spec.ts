import { test, expect } from '@playwright/test';

/**
 * demos/site/overlays.html <wb-drawer> (src/wb-viewmodels/overlay.js's
 * drawer(), PATH B -- "no schema involved", the branch every <wb-drawer> on
 * this page exercises since it's loaded via wb-lazy.js with zero
 * schema-builder support, not the SPA's `?page=` route). John, live: "WTF
 * where did this text come from? And the title is not right either?" /
 * "What is position top and bottom?" / "These variants are all the same?".
 * Three confirmed, separate bugs, all traced to PATH B's `show()`:
 *
 * 1. config.title/config.content defaulted to hardcoded 'Drawer'/'Drawer
 *    content' whenever no title/content(-ish) attribute was present, and
 *    element.textContent was never read as a fallback -- every bare-text
 *    demo (`<wb-drawer position="left">position=left</wb-drawer>`) popped
 *    open showing the literal words "Drawer"/"Drawer content", unrelated to
 *    what was actually in the tag.
 * 2. show() only ever branched on `config.position === 'right'` and
 *    hardcoded a left-sidebar layout for everything else -- top and bottom
 *    rendered identically to left (both left sidebars).
 * 3. `variant` was never read anywhere in drawer() at all (grep-confirmed)
 *    and no CSS anywhere styled wb-drawer--default/overlay/push -- the
 *    three variants rendered 100% identically.
 *
 * Fix: PATH B now falls back to the host's own original text (captured as
 * `originalText` before either path runs) for content when no
 * title/content-ish attribute is given, and skips rendering a title line
 * entirely when there's no title (matching drawer.schema.json's own
 * `"createdWhen": "title"`). It now builds its panel using the SAME
 * `.wb-drawer__panel`/`.wb-drawer--{position}`/`.wb-drawer__panel--open`
 * classes drawer.css already defines for PATH A instead of a second
 * hand-rolled inline-style implementation, so all 4 positions (left/right/
 * top/bottom) render correctly via the existing CSS. `variant` is now read
 * and applied: 'push' translates the page's `body > .page` wrapper aside
 * with no dimming backdrop (Material "push" navigation drawer pattern);
 * 'default' and 'overlay' both use the existing dimming-backdrop behavior
 * (docs/components/drawer.md documents no distinct treatment for
 * "default", and the schema's own declared default IS "overlay", so
 * "default" is an explicit alias) but still carry distinct
 * wb-drawer--default/wb-drawer--overlay classes on the panel.
 */

async function ready(page) {
  await page.goto('/demos/site/overlays.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
  await page.waitForTimeout(1000);
}

test.describe('demos/site/overlays.html <wb-drawer> PATH B: content, position, variant', () => {
  test.beforeEach(async ({ page }) => {
    await ready(page);
  });

  test('bare-text drawer (no title/content attribute) shows its own text, not "Drawer"/"Drawer content"', async ({ page }) => {
    const trigger = page.locator('#drawer-position-variants wb-drawer[position="left"]');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const panel = page.locator('.wb-drawer__panel--open');
    await expect(panel).toBeVisible({ timeout: 5000 });
    // The old hardcoded placeholders must never appear.
    await expect(panel.locator('.wb-drawer__title')).toHaveCount(0);
    const body = panel.locator('.wb-drawer__body');
    await expect(body).toContainText('position=left');
    const text = (await body.textContent()) ?? '';
    expect(text).not.toContain('Drawer content');
  });

  test('drawer with a title attribute but no content attribute shows the title AND its own text as content (not the old generic placeholder)', async ({ page }) => {
    const trigger = page.locator('wb-drawer[title="Right Drawer"]');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const panel = page.locator('.wb-drawer__panel--open');
    await expect(panel).toBeVisible({ timeout: 5000 });
    await expect(panel.locator('.wb-drawer__title')).toHaveText('Right Drawer');
    const body = panel.locator('.wb-drawer__body');
    await expect(body).toContainText('title=Right Drawer, position=right');
    const text = (await body.textContent()) ?? '';
    expect(text).not.toBe('Drawer content');
  });

  test('position=top and position=bottom render as distinct horizontal panels, not as a left sidebar', async ({ page }) => {
    const section = page.locator('#drawer-position-variants');
    const positions = ['left', 'right', 'top', 'bottom'];
    const rects: Record<string, DOMRect> = {};

    for (const pos of positions) {
      const trigger = section.locator(`wb-drawer[position="${pos}"]`);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();

      // The panel element exists synchronously right after click() (show()
      // appends it to document.body before its rAF-deferred `--open` add),
      // still in its CLOSED transform -- attach the transitionend listener
      // NOW, before `--open` triggers the animated transform, so there is
      // no race where the transition could complete before we start
      // listening (which polling/fixed-sleep approaches both hit: e.g.
      // position=left's x read as -283 instead of the settled 0, and a
      // fixed 350ms sleep was still occasionally too short under load).
      const panel = page.locator('.wb-drawer__panel').last();
      await expect(panel).toBeAttached();
      const transitionSettled = panel.evaluate((el) => new Promise((resolve) => {
        const done = () => { el.removeEventListener('transitionend', done); resolve(true); };
        el.addEventListener('transitionend', done, { once: true });
        // Safety net only (e.g. prefers-reduced-motion disabling the
        // transition entirely) -- well past the declared 0.3s duration.
        setTimeout(done, 600);
      }));

      const openPanel = page.locator('.wb-drawer__panel--open');
      await expect(openPanel, `position=${pos} should open a panel`).toBeVisible({ timeout: 5000 });
      await transitionSettled;
      rects[pos] = await panel.evaluate((el) => el.getBoundingClientRect().toJSON());
      // Close via the panel's own close button, not a second click on the
      // trigger -- once open, the full-screen .wb-drawer__backdrop (fixed,
      // inset:0, z-index above the trigger) visually covers the trigger, so
      // Playwright's actionability check can never click it again (confirmed:
      // this is correct modal UX, a backdrop is SUPPOSED to block interaction
      // with what's behind it -- not a product bug, the earlier version of
      // this test asserting "click trigger again to close" was wrong).
      await page.locator('.wb-drawer__panel--open .wb-drawer__close').click();
      await expect(page.locator('.wb-drawer__panel--open')).toHaveCount(0, { timeout: 5000 });
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
    const pushTrigger = section.locator('wb-drawer[variant="push"]');
    await pushTrigger.scrollIntoViewIfNeeded();
    await pushTrigger.click();
    const pushPanel = page.locator('.wb-drawer__panel--open');
    await expect(pushPanel).toBeVisible({ timeout: 5000 });
    await expect(pushPanel).toHaveClass(/wb-drawer--push/);
    await expect(page.locator('.wb-drawer__backdrop--open')).toHaveCount(0);
    const pageTransform = await page.locator('body > .page').evaluate((el) => getComputedStyle(el).transform);
    expect(pageTransform, 'push variant should translate the page content wrapper').not.toBe('none');
    await page.locator('.wb-drawer__panel--open .wb-drawer__close').click();
    await expect(page.locator('.wb-drawer__panel--open')).toHaveCount(0, { timeout: 5000 });
    await expect
      .poll(async () => page.locator('body > .page').evaluate((el) => getComputedStyle(el).transform))
      .toBe('none');

    // overlay: dimming backdrop present, page content wrapper NOT translated.
    const overlayTrigger = section.locator('wb-drawer[variant="overlay"]');
    await overlayTrigger.scrollIntoViewIfNeeded();
    await overlayTrigger.click();
    const overlayPanel = page.locator('.wb-drawer__panel--open');
    await expect(overlayPanel).toBeVisible({ timeout: 5000 });
    await expect(overlayPanel).toHaveClass(/wb-drawer--overlay/);
    await expect(page.locator('.wb-drawer__backdrop--open')).toHaveCount(1);
    const overlayPageTransform = await page.locator('body > .page').evaluate((el) => getComputedStyle(el).transform);
    expect(overlayPageTransform).toBe('none');
    // Close via the close button, not a second trigger click -- the
    // dimming backdrop now covers the trigger (correct modal UX), so
    // Playwright can't click through it to reach the trigger again.
    await page.locator('.wb-drawer__panel--open .wb-drawer__close').click();
    await expect(page.locator('.wb-drawer__panel--open')).toHaveCount(0, { timeout: 5000 });

    // default: also dims with a backdrop (alias of overlay), but carries
    // its own distinct class so it's distinguishable in the DOM.
    const defaultTrigger = section.locator('wb-drawer[variant="default"]');
    await defaultTrigger.scrollIntoViewIfNeeded();
    await defaultTrigger.click();
    const defaultPanel = page.locator('.wb-drawer__panel--open');
    await expect(defaultPanel).toBeVisible({ timeout: 5000 });
    await expect(defaultPanel).toHaveClass(/wb-drawer--default/);
    await expect(defaultPanel).not.toHaveClass(/wb-drawer--overlay/);
    await expect(defaultPanel).not.toHaveClass(/wb-drawer--push/);
    await expect(page.locator('.wb-drawer__backdrop--open')).toHaveCount(1);
    await page.locator('.wb-drawer__panel--open .wb-drawer__close').click();
    await expect(page.locator('.wb-drawer__panel--open')).toHaveCount(0, { timeout: 5000 });
  });
});
