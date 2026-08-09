import { test, expect } from '@playwright/test';

/**
 * New feature: <wb-codecolorcontrol> on pages/themes.html lets an author
 * pick a code panel color preset (--bg-code/--text-code,
 * src/styles/behaviors/pre.css), which none of the 51 themes in themes.css
 * set -- every code panel falls back to the same hardcoded dark colors
 * regardless of the active theme. A dropdown of named presets (John:
 * presets, not individual color swatches), same "one control, one source
 * of truth, dispatch on change" shape as the existing themecontrol.js.
 */
test.describe('wb-codecolorcontrol overrides code panel colors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=themes', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('wb-codecolorcontrol', { timeout: 20000 });
    await page.waitForTimeout(500);
  });

  test('selecting a preset actually recolors the sample code block', async ({ page }) => {
    const select = page.locator('wb-codecolorcontrol .wb-codecolorcontrol__select');
    // pre.js's behavior wraps <pre> in .x-pre-wrapper and moves the
    // background there (.x-pre itself is transparent -- "wrapper handles
    // bg", pre.css:23) -- that wrapper, not the bare <pre>, is what
    // --bg-code actually paints.
    const codeBlock = page.locator('#themes-code-colors .x-pre-wrapper').first();

    const before = await codeBlock.evaluate((el) => getComputedStyle(el).backgroundColor);

    await select.selectOption('github-dark');
    await page.waitForTimeout(100);

    const after = await codeBlock.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(after).not.toBe(before);
    expect(after).toBe('rgb(13, 17, 23)'); // #0d1117

    const stored = await page.evaluate(() => localStorage.getItem('wb-code-colors'));
    expect(stored).toBe('github-dark');
  });

  test('selecting Default restores the default code colors', async ({ page }) => {
    const select = page.locator('wb-codecolorcontrol .wb-codecolorcontrol__select');
    const codeBlock = page.locator('#themes-code-colors .x-pre-wrapper').first();

    await select.selectOption('monokai');
    await page.waitForTimeout(100);
    await select.selectOption('default');
    await page.waitForTimeout(100);

    const bg = await codeBlock.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(30, 30, 30)'); // #1e1e1e

    const stored = await page.evaluate(() => localStorage.getItem('wb-code-colors'));
    expect(stored).toBe('default');
  });
});
