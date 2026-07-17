import { test, expect } from '@playwright/test';
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

    await element.hover();

    const tooltip = page.locator('.wb-tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('Global Tooltip');
  });

  test('toast-message global attribute creates toast', async ({ page }) => {
    const element = await setupTestContainer(
      page,
      '<button toast-message="Global Toast">Click me</button>'
    );

    await element.click();

    const toastContainer = page.locator('.wb-toast-container');
    await expect(toastContainer).toBeVisible();
    await expect(toastContainer).toContainText('Global Toast');
  });

  test('ripple global attribute creates ripple effect', async ({ page }) => {
    const element = await setupTestContainer(
      page,
      '<button ripple>Click me</button>'
    );

    // Click to trigger ripple
    await element.click();

    // Check for the ripple effect element that should be created.
    // ripple.js (createRipple) creates a <span class="wb-ripple__wave">, not
    // ".wb-ripple-effect" -- that class has never existed anywhere in the
    // codebase; this assertion was stale (#354).
    const rippleEffect = element.locator('.wb-ripple__wave');
    await expect(rippleEffect).toBeAttached();
  });

  test('badge global attribute applies badge styles', async ({ page }) => {
    const element = await setupTestContainer(
      page,
      '<span badge="success">Badge</span>'
    );

    await expect(element).toHaveClass(/wb-badge--success/);
  });

  test('badge global attribute with no value applies default', async ({ page }) => {
    const element = await setupTestContainer(
      page,
      '<span badge>Badge</span>'
    );

    // Should have base badge class and potentially default variant
    await expect(element).toHaveClass(/wb-badge/);
  });
});
