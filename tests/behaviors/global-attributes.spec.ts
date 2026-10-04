import { test, expect } from '../fixtures/offline';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * Plain attributes on a semantic element (tooltip="...", ripple, badge="...",
 * toast-message="...") are a real, intentional feature -- not legacy syntax
 * -- for attaching a behavior without an x-* prefix. src/core/wb-lazy.js
 * supports this (WB_LAZY_LEGACY_BARE_ATTRIBUTES / getAutoInjectBehaviors()),
 * but src/core/wb.js -- the engine index.html and setupBehaviorTest()
 * actually load -- never got this matching ported over, so these tests were
 * silently asserting against a runtime they weren't exercising (#354).
 */
test.describe('Global Attributes', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('tooltip global attribute creates tooltip', async ({ page }) => {
    const element = await setupTestContainer(
      page,
      '<button tooltip="Global Tooltip">Hover me</button>'
    );

    // The tooltip THIS button owns, not any `.x-tooltip` on the page: the page
    // behind the test container has its own tooltip demo, and a pointer landing
    // there showed that one's text instead (#1283, ported from #1209 d8541de3).
    const tooltipId = await element.getAttribute('aria-describedby');
    expect(tooltipId, 'tooltip behavior did not link a tooltip to the button').toBeTruthy();
    const tooltip = page.locator(`#${tooltipId}`);
    // index.html keeps building lazy sections above #test-container after
    // boot, which can slide the button out from under a parked pointer -- a
    // real mouseleave, so the tip correctly hides. Re-hover until it holds:
    // what is asserted is still "hovering shows the tooltip".
    await expect(async () => {
      await element.hover();
      await expect(tooltip).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await expect(tooltip).toContainText('Global Tooltip');
  });

  test('toast-message global attribute creates toast', async ({ page }) => {
    const element = await setupTestContainer(
      page,
      '<button toast-message="Global Toast">Click me</button>'
    );

    await element.click();

    const toastContainer = page.locator('.x-toast-container');
    await expect(toastContainer).toBeVisible();
    await expect(toastContainer).toContainText('Global Toast');
  });

  test('ripple global attribute creates ripple effect', async ({ page }) => {
    const element = await setupTestContainer(
      page,
      '<button ripple>Click me</button>'
    );

    // #1480: the wave removes itself config.duration (~600ms) after it is
    // created (ripple.js), so looking for it AFTER the click raced its own
    // lifetime -- a slow CI runner checked after it was gone. Record its
    // creation instead, with an observer armed before the click.
    await element.evaluate((el) => {
      (window as any).__waveSeen = false;
      new MutationObserver((records) => {
        for (const r of records) {
          for (const n of r.addedNodes) {
            // ripple.js (createRipple) creates a <span class="x-ripple__wave">,
            // not ".x-ripple-effect" -- that class never existed (#354).
            if (n instanceof Element && n.classList.contains('x-ripple__wave')) (window as any).__waveSeen = true;
          }
        }
      }).observe(el, { childList: true, subtree: true });
    });

    await element.click();

    await expect.poll(() => element.page().evaluate(() => (window as any).__waveSeen),
      { message: 'clicking the ripple element never created an .x-ripple__wave' }).toBe(true);
  });

  test('badge global attribute applies badge styles', async ({ page }) => {
    const element = await setupTestContainer(
      page,
      '<span badge="success">Badge</span>'
    );

    await expect(element).toHaveClass(/x-badge--success/);
  });

  test('badge global attribute with no value applies default', async ({ page }) => {
    const element = await setupTestContainer(
      page,
      '<span badge>Badge</span>'
    );

    // Should have base badge class and potentially default variant
    await expect(element).toHaveClass(/x-badge/);
  });
});
