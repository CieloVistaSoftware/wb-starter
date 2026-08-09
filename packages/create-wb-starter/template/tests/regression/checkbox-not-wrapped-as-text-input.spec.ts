import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * wb.js's scan() applies every matching tag-map.js nativeMap entry
 * additively, not "most specific selector wins" (confirmed by reading
 * scan()'s auto-inject loop directly). A bare <input type="checkbox">
 * matches BOTH 'input[type="checkbox"]' (checkbox()) AND the generic
 * 'input' selector (input()), so both behaviors ran, with input() running
 * second and wrapping the checkbox in .wb-input / .wb-input__field --
 * the generic text-field treatment (padding, flex:1, border-radius,
 * background) -- confirmed live: a native checkbox rendered as a wide
 * rounded pill on the Behaviors page, visually indistinguishable from a
 * text input.
 *
 * Fixed in src/wb-viewmodels/semantics/input.js: input() now no-ops for
 * checkbox/radio/range/color/file/submit/button/reset/image types.
 */
test.describe('input() behavior does not wrap non-text input types', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  for (const type of ['checkbox', 'radio', 'range']) {
    test(`<input type="${type}"> is not wrapped by the generic text-input behavior`, async ({ page }) => {
      const element = await setupTestContainer(page, `<input type="${type}">`);

      await expect(element).not.toHaveClass(/wb-input__field/);
      await expect(page.locator('.wb-input')).toHaveCount(0);
    });
  }

  test('a checkbox keeps its native small square footprint, not a stretched text-field width', async ({ page }) => {
    await setupTestContainer(page, '<input type="checkbox">');

    const box = await page.locator('#test-container input[type="checkbox"]').boundingBox();
    expect(box).not.toBeNull();
    // Native checkboxes are ~13-20px square across browsers -- a value in
    // the hundreds of pixels would mean the text-input wrapper's flex:1 /
    // width:100% treatment is back.
    expect(box!.width).toBeLessThan(30);
  });
});
