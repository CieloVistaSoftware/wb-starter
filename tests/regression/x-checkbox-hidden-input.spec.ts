import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * <div x-checkbox> renders as a real, visible, native checkbox inside a
 * <label>, and nothing else.
 *
 * History: checkbox.schema.json's $view used to build a hidden native input
 * (width 1px, opacity 0, pointer-events none) driving a fake span box, while
 * checkbox.js had its own native fallback. The two disagreed -- about which
 * one ran, about copying checked/disabled across, about forwarding clicks --
 * and every x-checkbox example on the behaviors page rendered unchecked,
 * enabled, unclickable, and squeezed to 19px. x-checkbox is now excluded from
 * schema building and checkbox.js is the only builder. This spec pins that:
 * one input, a real checkbox, visible, in a label, clickable by its text,
 * and never wrapped in text-field styling (the #361-shaped bug this file
 * was first written for).
 */
test.describe('[x-checkbox] is a native checkbox in a label', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('one real, visible checkbox input, not wrapped in .x-input', async ({ page }) => {
    const el = await setupTestContainer(page, '<div x-checkbox label="Test"></div>');

    const input = el.locator('input[type="checkbox"]');
    await expect(input).toHaveCount(1);
    await expect(input).toBeVisible();
    await expect(input).not.toHaveClass(/x-input__field/);
    await expect(el.locator('.x-input')).toHaveCount(0);

    // The old fake visual must not come back alongside the real one.
    await expect(el.locator('.x-checkbox__box, .x-checkbox__check')).toHaveCount(0);

    // Native label: the text is part of the control.
    const label = el.locator('label');
    await expect(label).toHaveText('Test');
    await expect(label.locator('input[type="checkbox"]')).toHaveCount(1);
  });

  test('clicking the label text toggles it; the label sits on one line', async ({ page }) => {
    const el = await setupTestContainer(page, '<div x-checkbox label="Run the full suite before pushing"></div>');
    const input = el.locator('input[type="checkbox"]');

    await expect(input).not.toBeChecked();
    await el.getByText('Run the full suite before pushing').click();
    await expect(input).toBeChecked();

    // Guards the 19px squeeze: input.css's 1.2em .x-checkbox rule once
    // matched this host and wrapped the label one word per line.
    const label = await el.locator('label').boundingBox();
    const inputBox = await input.boundingBox();
    expect(label!.height, 'label wrapped onto several lines').toBeLessThan(inputBox!.height * 2);
  });
});
