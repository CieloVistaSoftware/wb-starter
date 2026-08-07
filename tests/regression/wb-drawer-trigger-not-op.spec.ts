import { test, expect } from '@playwright/test';

/**
 * A native button using x-drawer (pages/components.html) must remain a
 * visible, working "Left Drawer" trigger.
 *
 * Root cause (two competing DOM owners for the same element):
 *   1. drawer.schema.json's $view built a real backdrop/panel structure
 *      INSIDE the host on schema processing, wiping the host's own text
 *      ("Left Drawer") and replacing it with the panel's internal markup.
 *      layout.css also defaulted every <wb-drawer> to `visibility: hidden`
 *      (a rule meant for DEFINITION-mode drawers, not self-triggering ones).
 *   2. tag-map.js separately maps <wb-drawer> to the legacy `drawer()`
 *      behavior (src/wb-viewmodels/overlay.js), which used to build a
 *      SECOND, independent backdrop+panel pair on click and append it to
 *      document.body -- competing with the schema's (invisible, unstyled)
 *      copy still sitting inside the host.
 *
 * The test follows the current x-drawer contract, which exercises the
 * self-building overlay path directly.
 */

async function ready(page) {
  await page.goto('/?page=components');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
  await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage, { timeout: 20000 });
  await page.waitForTimeout(1000);
  // drawer()'s Path A (overlay.js) only runs once WB.inject() awaits
  // ensureBehaviorCss('drawer') -- a real network fetch for drawer.css on
  // first use -- so it can land meaningfully later than the generic
  // "page settled" signal above under load (confirmed flaky without this:
  // the flat 1000ms wait sometimes wasn't enough, leaving the schema-built
  // panel un-relocated and no click handler attached yet when a test then
  // interacted with the trigger). Wait for the actual completion signal
  // instead of a fixed timeout: element.wbDrawer is only set at the end of
  // drawer()'s Path A, after relocation and listener wiring are both done.
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('[x-drawer]')).every((el: any) => !!el.wbDrawer),
    { timeout: 15000 }
  );
}

test.describe('<wb-drawer> trigger renders and opens correctly (not a broken box)', () => {
  test.beforeEach(async ({ page }) => {
    await ready(page);
  });

  test('trigger is visible and shows its own label text', async ({ page }) => {
    const trigger = page.locator('[x-drawer]', { hasText: 'Left Drawer' }).first();
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveText('Left Drawer');
  });

  test('clicking the trigger opens a fixed-position panel with the configured title/content', async ({ page }) => {
    const trigger = page.locator('[x-drawer]', { hasText: 'Left Drawer' }).first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const panel = page.locator('.wb-drawer__panel--open');
    await expect(panel).toBeVisible({ timeout: 5000 });
    await expect(panel).toContainText('Left Drawer');
    await expect(panel).toContainText('Slide-out panel from the left.');

    const position = await panel.evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe('fixed');

    // The panel must have actually slid fully into view, not just be
    // present in the DOM with a hidden/off-screen transform still applied.
    // drawer.css's slide-in is a 0.3s CSS transition, so poll (toHaveCSS
    // retries) instead of taking a single immediate snapshot right after the
    // open class is added, which can catch the transform mid-transition.
    await expect(panel).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)', { timeout: 5000 });
  });

  test('exactly one panel+backdrop pair exists per trigger (no duplicate/competing overlay)', async ({ page }) => {
    // pages/behaviors.html has two <wb-drawer> triggers (Left + Right), each
    // schema-built with its own panel/backdrop pair -- so the page-wide
    // total is legitimately 2, not 1. The regression this guards against is
    // a SINGLE trigger ending up with two competing panels (the schema-built
    // one plus a second one drawer() used to build itself on click) -- so
    // assert per-trigger, not page-wide.
    const triggers = page.locator('[x-drawer]');
    await expect(triggers).toHaveCount(2);

    const leftTrigger = page.locator('[x-drawer]', { hasText: 'Left Drawer' }).first();
    await leftTrigger.scrollIntoViewIfNeeded();
    await leftTrigger.click();

    const openPanel = page.locator('.wb-drawer__panel--open');
    // 10s not 5s -- flaky under this session's unusually heavy concurrent
    // Playwright load (10+ simultaneous agent test runs on one machine);
    // consistently passed on the very next retry with identical assertions,
    // pointing at CPU contention delaying the click's class-toggle, not a
    // race in the drawer code itself.
    await expect(openPanel).toBeVisible({ timeout: 10000 });
    // Only the Left trigger was clicked -- exactly one panel should be open.
    await expect(openPanel).toHaveCount(1);

    // Total panel/backdrop count across the whole page must match the
    // number of triggers (one pair per trigger), not double that -- a
    // duplicate/competing build for the SAME trigger would push this above 2.
    await expect(page.locator('.wb-drawer__panel')).toHaveCount(2);
    await expect(page.locator('.wb-drawer__backdrop')).toHaveCount(2);

    // The panel/backdrop must have been relocated to document.body, not left
    // sitting inertly inside their trigger elements (which would mean the
    // trigger's own label got clobbered by the panel's internal markup).
    const panelsInsideTriggers = await page.locator('wb-drawer .wb-drawer__panel').count();
    expect(panelsInsideTriggers, 'panels must be relocated out of their trigger elements, not left inside them').toBe(0);
  });

  test('clicking the close button closes the panel', async ({ page }) => {
    const trigger = page.locator('[x-drawer]', { hasText: 'Left Drawer' }).first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const panel = page.locator('.wb-drawer__panel--open');
    await expect(panel).toBeVisible({ timeout: 5000 });

    await page.locator('.wb-drawer__close').first().click();
    await expect(page.locator('.wb-drawer__panel--open')).toHaveCount(0);
  });
});
