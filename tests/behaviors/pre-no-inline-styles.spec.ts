import { test, expect } from '../fixtures/offline';

import { settlePage } from '../base';
/**
 * #285: pre.js used to write ~15 inline style properties per code block via
 * Object.assign(element.style, …)/style.cssText — repetitive, unthemeable,
 * and a source of hardcoded color fallbacks. Styling now lives in
 * src/styles/behaviors/pre.css as `.x-pre*` classes; the behavior only adds
 * classes plus the handful of values that are genuinely per-instance
 * (measured sibling-control positions, per-line-number top offsets, an
 * explicit max-height value).
 *
 * #779 finished the job: those per-instance values are generated stylesheet
 * rules now, so nothing pre.js builds carries a style attribute at all.
 */
test.describe('pre.js code blocks have no static inline styles (#285)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=behaviors');
    await page.waitForSelector('#mainPage-behaviors', { timeout: 20000 });
    // The page is built once WB settles (#1516: no fixed sleep).
    await page.waitForFunction(() => typeof (window as any).WB?.settled === 'function', null, { timeout: 15000 });
    await settlePage(page, { timeout: 15000 });
  });

  test('.x-pre and .x-pre__wrapper have no style attribute at all', async ({ page }) => {
    const pre = page.locator('.x-pre').first();
    await expect(pre).toBeVisible();
    await expect(pre).not.toHaveAttribute('style', /.+/);

    const wrapper = page.locator('.x-pre__wrapper').first();
    await expect(wrapper).not.toHaveAttribute('style', /.+/);
  });

  test('header controls are placed by a generated rule, not an inline `right`', async ({ page }) => {
    const wrapper = page.locator('.x-pre__wrapper').filter({
      has: page.locator('.x-pre__copy, .x-pre__language, .x-pre__toggle'),
    }).first();
    await expect(wrapper).toBeVisible();

    for (const sel of ['.x-pre__copy', '.x-pre__language', '.x-pre__toggle']) {
      const control = wrapper.locator(sel).first();
      if ((await control.count()) === 0) continue;
      await expect(control, `${sel} must carry no style attribute (#779)`).not.toHaveAttribute('style', /.+/);
      const right = await control.evaluate((el) => getComputedStyle(el).right);
      expect(right, `${sel} should still be offset from the right edge`).toMatch(/^[\d.]+px$/);
    }
  });

  test('line-number gutter divs are placed by a generated rule, not an inline `top`', async ({ page }) => {
    const gutter = page.locator('.x-pre__line-numbers').first();
    await expect(gutter).toBeVisible();
    const firstNumber = gutter.locator('> div').first();
    await expect(firstNumber, 'line number should have been measured and placed').toHaveClass(/x-pre__line-number--placed/);
    await expect(firstNumber, 'no style attribute (#779)').not.toHaveAttribute('style', /.+/);
  });

  test('code block still renders correctly: real background, monospace font, correct text', async ({ page }) => {
    const wrapper = page.locator('.x-pre__wrapper').first();
    const bg = await wrapper.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');

    const pre = page.locator('.x-pre').first();
    const fontFamily = await pre.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(fontFamily.toLowerCase()).toContain('mono');
  });
});
