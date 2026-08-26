import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * <div x-checkbox>'s $view builds a hidden native <input> (the state driver
 * for its custom .box/.check visual) with no `type` attribute at all --
 * identical root cause to #361 (x-switch). Two consequences:
 * 1. With no type, the generic auto-inject `input` behavior
 *    (semantics/input.js) wraps it in .x-input/.x-input__field text-field
 *    styling instead of leaving it as an invisible state driver.
 * 2. checkbox()'s own guard (`element.type !== 'checkbox'`) means the
 *    checkbox behavior itself never even runs on it either.
 */
test.describe('x-checkbox does not wrap its hidden input in text-field styling', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('the internal input is a real checkbox, not wrapped in .x-input', async ({ page }) => {
    const el = await setupTestContainer(page, '<div x-checkbox label="Test"></div>');

    const input = el.locator('input[type="checkbox"]');
    await expect(input).toHaveCount(1);
    await expect(input).not.toHaveClass(/x-input__field/);
    await expect(input).toHaveCSS('width', '1px');
    await expect(input).toHaveCSS('opacity', '0');

    const wrapper = el.locator('.x-input');
    await expect(wrapper).toHaveCount(0);

    const box = el.locator('.x-checkbox__box');
    await expect(box).toHaveCount(1);
    const boxBox = await box.boundingBox();
    expect(boxBox!.width).toBeLessThan(30);
  });
});
