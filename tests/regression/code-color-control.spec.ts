import { test, expect } from '@playwright/test';

/**
 * New feature: <wb-codecolorcontrol> on pages/themes.html lets an author
 * override --bg-code/--text-code (src/styles/behaviors/pre.css), which none
 * of the 51 themes in themes.css set -- every code panel falls back to the
 * same hardcoded dark colors regardless of the active theme. Two color
 * inputs (background, text) + a reset button, same "one control, one
 * source of truth, dispatch wb:codecolors:change on every change" shape as
 * the existing themecontrol.js.
 */
test.describe('wb-codecolorcontrol overrides code panel colors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=themes', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('wb-codecolorcontrol', { timeout: 20000 });
    await page.waitForTimeout(500);
  });

  test('changing the background input actually recolors the sample code block', async ({ page }) => {
    const control = page.locator('wb-codecolorcontrol');
    const bgInput = control.locator('.wb-codecolorcontrol__input').first();
    // pre.js's behavior wraps <pre> in .x-pre-wrapper and moves the
    // background there (.x-pre itself is transparent -- "wrapper handles
    // bg", pre.css:23) -- that wrapper, not the bare <pre>, is what
    // --bg-code actually paints.
    const codeBlock = page.locator('#themes-code-colors .x-pre-wrapper').first();

    const before = await codeBlock.evaluate((el) => getComputedStyle(el).backgroundColor);

    await bgInput.evaluate((el: HTMLInputElement) => {
      el.value = '#ff0000';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(100);

    const after = await codeBlock.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(after).not.toBe(before);
    expect(after).toBe('rgb(255, 0, 0)');

    const stored = await page.evaluate(() => localStorage.getItem('wb-code-colors'));
    expect(stored && JSON.parse(stored).bg).toBe('#ff0000');
  });

  test('reset restores the default code colors and clears storage', async ({ page }) => {
    const control = page.locator('wb-codecolorcontrol');
    const bgInput = control.locator('.wb-codecolorcontrol__input').first();
    const resetBtn = control.locator('.wb-codecolorcontrol__reset');

    await bgInput.evaluate((el: HTMLInputElement) => {
      el.value = '#00ff00';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(100);

    await resetBtn.click();
    await page.waitForTimeout(100);

    // pre.js's behavior wraps <pre> in .x-pre-wrapper and moves the
    // background there (.x-pre itself is transparent -- "wrapper handles
    // bg", pre.css:23) -- that wrapper, not the bare <pre>, is what
    // --bg-code actually paints.
    const codeBlock = page.locator('#themes-code-colors .x-pre-wrapper').first();
    const bg = await codeBlock.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe('rgb(0, 255, 0)');

    const stored = await page.evaluate(() => localStorage.getItem('wb-code-colors'));
    expect(stored).toBeNull();
  });
});
