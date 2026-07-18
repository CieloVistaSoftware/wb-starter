import { test, expect } from '@playwright/test';

/**
 * Regression: pages/components.html's "Text Inputs" demo had bare
 * <input type="text" variant="success"/"error"> with no x-input attribute.
 * input[type="text"] is not in tag-map.js's nativeMap (unlike checkbox/
 * radio/range), so without x-input the input() behavior never ran at all
 * -- no wrapper, no classes, no inline border-color, nothing. The variant
 * attribute sat on the element completely inert; every input rendered with
 * the same default border regardless of variant. Confirmed live via
 * getComputedStyle before the fix: identical borderColor across Basic/
 * Success/Error. Fixed by adding x-input to each bare text input.
 */
test.describe('Text input variant coloring (Components page)', () => {
  test('success variant renders a green border, error a red border, distinct from the unvaried input', async ({ page }) => {
    await page.goto('/?page=components');

    const basic = page.locator('input[placeholder="Basic input"]');
    const success = page.locator('input[placeholder="Success"]');
    const error = page.locator('input[placeholder="Error"]');

    await expect(basic).toBeVisible();
    await expect(success).toBeVisible();
    await expect(error).toBeVisible();

    // The input() behavior must actually have run (wrapped + classed) --
    // this is the part that silently never happened before the fix.
    await expect(success).toHaveClass(/wb-input__field/);
    await expect(error).toHaveClass(/wb-input__field/);

    // Border color comes from JIT-loaded behavior CSS (input.css), which can
    // still be in flight even after the class assertions above pass --
    // class-added and stylesheet-applied are two different moments (the
    // same race class this session hit with wb-switch's CSS). A one-shot
    // getComputedStyle() read here was confirmed flaky under full-suite
    // parallel load; expect.poll() retries the whole read+compare until the
    // three colors actually diverge (or times out), the same fix pattern
    // used for that switch bug.
    const readColors = async () => ({
      basicColor: await basic.evaluate(el => getComputedStyle(el).borderColor),
      successColor: await success.evaluate(el => getComputedStyle(el).borderColor),
      errorColor: await error.evaluate(el => getComputedStyle(el).borderColor),
    });
    await expect.poll(async () => {
      const { basicColor, successColor, errorColor } = await readColors();
      return successColor !== basicColor && errorColor !== basicColor && successColor !== errorColor;
    }, { timeout: 5000 }).toBe(true);

    const { basicColor, successColor, errorColor } = await readColors();

    expect(successColor).not.toBe(basicColor);
    expect(errorColor).not.toBe(basicColor);
    expect(successColor).not.toBe(errorColor);

    // Success -> green-family, Error -> red-family (not just "different",
    // actually the right hue -- a swapped-color bug would pass the
    // not-equal checks above but fail these).
    const successRGB = successColor.match(/\d+/g)!.map(Number);
    const errorRGB = errorColor.match(/\d+/g)!.map(Number);
    expect(successRGB[1]).toBeGreaterThan(successRGB[0]); // green channel dominant
    expect(errorRGB[0]).toBeGreaterThan(errorRGB[1]);     // red channel dominant
  });
});
