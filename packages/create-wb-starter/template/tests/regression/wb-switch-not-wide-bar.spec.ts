import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * <wb-switch label="Test"> rendered a long, wide, empty rounded bar BEFORE
 * the actual small toggle knob -- visually indistinguishable from a
 * stretched text input (#361). The internal native checkbox driving
 * :checked state is supposed to be visually hidden per switch.css
 * (position:absolute; opacity:0; width:1px; height:1px), matching the
 * classic visually-hidden-native-input + custom-visual-track pattern.
 */
test.describe('wb-switch does not render a stray wide bar', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('the internal checkbox stays visually hidden, only the small track/thumb show', async ({ page }) => {
    const el = await setupTestContainer(page, '<wb-switch label="Test"></wb-switch>');

    const input = el.locator('input[type="checkbox"]');
    await expect(input).toHaveCount(1);
    // Visually-hidden checkbox: 1px, not a wide bar. toHaveCSS auto-retries,
    // unlike a one-shot boundingBox() read, so it isn't racing the
    // JIT-loaded switch.css against the assertion.
    await expect(input).toHaveCSS('width', '1px');
    await expect(input).toHaveCSS('opacity', '0');

    const track = el.locator('.wb-switch__track');
    await expect(track).toHaveCount(1);
    const trackBox = await track.boundingBox();
    // The real visible control is a small pill (~48px), not a stretched bar.
    expect(trackBox!.width).toBeLessThan(80);
  });
});
