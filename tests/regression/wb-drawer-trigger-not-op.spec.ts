import { test, expect } from '@playwright/test';

/**
 * <wb-drawer> used as a self-triggering button (pages/behaviors.html:
 * `<wb-drawer class="wb-btn" title="Left Drawer" content="Slide-out panel
 * from the left." position="left">Left Drawer</wb-drawer>`) rendered as an
 * empty/malformed box instead of a working "Left Drawer" button.
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
 * Fix: drawer() now detects schema-built markup (x-schema="drawer") and
 * relocates the schema's own .wb-drawer__backdrop/.wb-drawer__panel to
 * document.body instead of building a second copy; layout.css/site.css make
 * `.wb-drawer-trigger` visible; src/styles/behaviors/drawer.css provides the
 * fixed-position open/closed styling.
 */

async function ready(page) {
  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
  await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage, { timeout: 20000 });
  await page.waitForTimeout(1000);
}

test.describe('<wb-drawer> trigger renders and opens correctly (not a broken box)', () => {
  test.beforeEach(async ({ page }) => {
    await ready(page);
  });

  test('trigger is visible and shows its own label text', async ({ page }) => {
    const trigger = page.locator('wb-drawer', { hasText: 'Left Drawer' }).first();
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveText('Left Drawer');
  });

  test('clicking the trigger opens a fixed-position panel with the configured title/content', async ({ page }) => {
    const trigger = page.locator('wb-drawer', { hasText: 'Left Drawer' }).first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const panel = page.locator('.wb-drawer__panel--open');
    await expect(panel).toBeVisible({ timeout: 5000 });
    await expect(panel).toContainText('Left Drawer');
    await expect(panel).toContainText('Slide-out panel from the left.');

    const position = await panel.evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe('fixed');

    // The panel must have actually slid into view, not just be present in
    // the DOM with a hidden/off-screen transform still applied.
    const transform = await panel.evaluate((el) => getComputedStyle(el).transform);
    expect(transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)').toBeTruthy();
  });

  test('exactly one panel+backdrop pair exists after opening (no duplicate/competing overlay)', async ({ page }) => {
    const trigger = page.locator('wb-drawer', { hasText: 'Left Drawer' }).first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    await expect(page.locator('.wb-drawer__panel--open')).toBeVisible({ timeout: 5000 });

    const panelCount = await page.locator('.wb-drawer__panel').count();
    expect(panelCount, 'exactly one .wb-drawer__panel should exist for this trigger, not two competing ones').toBe(1);

    const backdropCount = await page.locator('.wb-drawer__backdrop').count();
    expect(backdropCount, 'exactly one .wb-drawer__backdrop should exist for this trigger').toBe(1);

    // The panel/backdrop must have been relocated to document.body, not left
    // sitting inertly inside the trigger element (which would mean the
    // trigger's own label got clobbered by the panel's internal markup).
    const panelInsideTrigger = await page.locator('wb-drawer .wb-drawer__panel').count();
    expect(panelInsideTrigger, 'panel must be relocated out of the trigger element, not left inside it').toBe(0);
  });

  test('clicking the close button closes the panel', async ({ page }) => {
    const trigger = page.locator('wb-drawer', { hasText: 'Left Drawer' }).first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const panel = page.locator('.wb-drawer__panel--open');
    await expect(panel).toBeVisible({ timeout: 5000 });

    await page.locator('.wb-drawer__close').first().click();
    await expect(page.locator('.wb-drawer__panel--open')).toHaveCount(0);
  });
});
