import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

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

    // Check for the ripple effect element that should be created
    const rippleEffect = element.locator('.wb-ripple-effect');
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
