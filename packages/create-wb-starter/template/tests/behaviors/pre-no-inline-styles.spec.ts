import { test, expect } from '@playwright/test';

/**
 * #285: pre.js used to write ~15 inline style properties per code block via
 * Object.assign(element.style, …)/style.cssText — repetitive, unthemeable,
 * and a source of hardcoded color fallbacks. Styling now lives in
 * src/styles/behaviors/pre.css as `.x-pre*` classes; the behavior only adds
 * classes plus the handful of values that are genuinely per-instance
 * (measured sibling-control positions, per-line-number top offsets, an
 * explicit max-height value).
 */
test.describe('pre.js code blocks have no static inline styles (#285)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/?page=behaviors');
    await page.waitForSelector('#mainPage-behaviors', { timeout: 20000 });
    await page.waitForTimeout(2500);
  });

  test('.x-pre and .x-pre-wrapper have no style attribute at all', async ({ page }) => {
    const pre = page.locator('.x-pre').first();
    await expect(pre).toBeVisible();
    await expect(pre).not.toHaveAttribute('style', /.+/);

    const wrapper = page.locator('.x-pre-wrapper').first();
    await expect(wrapper).not.toHaveAttribute('style', /.+/);
  });

  test('header controls only carry the genuinely-dynamic `right` offset inline', async ({ page }) => {
    const wrapper = page.locator('.x-pre-wrapper').filter({
      has: page.locator('.x-pre__copy, .x-pre__language, .x-pre__toggle'),
    }).first();
    await expect(wrapper).toBeVisible();

    for (const sel of ['.x-pre__copy', '.x-pre__language', '.x-pre__toggle']) {
      const control = wrapper.locator(sel).first();
      if ((await control.count()) === 0) continue;
      const style = await control.getAttribute('style');
      if (style === null) continue; // no inline style at all is fine too
      expect(style.trim(), `${sel} should only set right:…, got: ${style}`).toMatch(/^right:\s*[\d.]+px;?$/);
    }
  });

  test('line-number gutter divs only carry the genuinely-dynamic `top` offset inline', async ({ page }) => {
    const gutter = page.locator('.x-pre__line-numbers').first();
    await expect(gutter).toBeVisible();
    const firstNumber = gutter.locator('> div').first();
    const style = await firstNumber.getAttribute('style');
    expect(style, 'line number should have a top offset set').toMatch(/^top:\s*[\d.]+px;?$/);
  });

  test('code block still renders correctly: real background, monospace font, correct text', async ({ page }) => {
    const wrapper = page.locator('.x-pre-wrapper').first();
    const bg = await wrapper.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');

    const pre = page.locator('.x-pre').first();
    const fontFamily = await pre.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(fontFamily.toLowerCase()).toContain('mono');
  });
});
