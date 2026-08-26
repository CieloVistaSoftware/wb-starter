import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#375 / BUG-2026-07-27-002): plain <div x-alert variant="...">
 * triggers (the form pages/behaviors.html and scripts/generate-behaviors-page.js
 * emit, distinct from the schema-driven <div x-alert type="..."> component
 * already covered by tests/behaviors/alerts-variants.spec.ts) rendered with
 * NO styling at all -- alert() in src/wb-viewmodels/feedback.js set a
 * `variant` attribute but never added the `.x-alert` base class or the
 * `.x-alert--<variant>` modifier class that src/styles/behaviors/alert.css
 * actually targets, so every alert (info/success/warning/error alike)
 * rendered as an unstyled div.
 */
test.describe('x-alert gets [x-alert] + x-alert--<variant> classes (#375)', () => {
  test('warning and error alerts on the Behaviors showcase are visually distinct, not unstyled', async ({ page }) => {
    await page.goto('/?page=behaviors');
    await page.waitForSelector('#mainPage-behaviors', { timeout: 20000 });
    await page.waitForTimeout(2500); // lazy injection + schema build, matches alerts-variants.spec.ts

    const warning = page.locator('[x-alert][variant="warning"]').first();
    const error = page.locator('[x-alert][variant="error"]').first();
    await expect(warning, 'Behaviors showcase should have a variant="warning" alert demo').toHaveCount(1);
    await expect(error, 'Behaviors showcase should have a variant="error" alert demo').toHaveCount(1);

    await expect(warning).toHaveClass(/\bwb-alert\b/);
    await expect(warning).toHaveClass(/\bwb-alert--warning\b/);
    await expect(error).toHaveClass(/\bwb-alert\b/);
    await expect(error).toHaveClass(/\bwb-alert--error\b/);

    const [warningBg, errorBg] = await Promise.all([
      warning.evaluate(el => getComputedStyle(el).backgroundColor),
      error.evaluate(el => getComputedStyle(el).backgroundColor),
    ]);

    const TRANSPARENT = 'rgba(0, 0, 0, 0)';
    expect(warningBg, 'warning alert must have a real background, not the unstyled default').not.toBe(TRANSPARENT);
    expect(errorBg, 'error alert must have a real background, not the unstyled default').not.toBe(TRANSPARENT);
    expect(warningBg, 'warning and error alerts must be visually distinct').not.toBe(errorBg);
  });
});
