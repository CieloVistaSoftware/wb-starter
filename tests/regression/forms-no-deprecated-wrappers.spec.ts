import { test, expect } from '@playwright/test';

/**
 * #390: demos/site/forms.html used <div x-checkbox>/<textarea> — both
 * explicitly DEPRECATED (see the console warning + header comment in
 * src/wb-viewmodels/semantics/checkbox.js and textarea.js: "prefer a bare
 * <input type=\"checkbox\">/<textarea> directly ... no wrapper element
 * ever needed"). Converted all 31 instances to native
 * <label><input type="checkbox">text</label> / <textarea>...</textarea>,
 * preserving every attribute (variant, size, checked, disabled,
 * indeterminate, required, placeholder, rows, autosize, max-length,
 * show-count, readonly).
 */
test.describe('demos/site/forms.html uses native elements, not deprecated wrappers (#390)', () => {
  test('no <div x-checkbox> or <textarea> custom elements remain', async ({ page }) => {
    await page.goto('/demos/site/forms.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
    const wbCheckboxCount = await page.locator('[x-checkbox]').count();
    const wbTextareaCount = await page.locator('.x-textarea').count();
    expect(wbCheckboxCount).toBe(0);
    expect(wbTextareaCount).toBe(0);
  });

  test('no [x-checkbox]/[x-textarea] deprecation warning fires on a fresh load', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning' && /x-checkbox|x-textarea/.test(msg.text())) {
        warnings.push(msg.text());
      }
    });
    await page.goto('/demos/site/forms.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
    await page.waitForTimeout(500);
    expect(warnings).toEqual([]);
  });

  test('checkboxes and textareas actually render (regression didn\'t just hide them)', async ({ page }) => {
    await page.goto('/demos/site/forms.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
    // `WB.behaviors` existing only means the runtime loaded — it says nothing
    // about injection having produced these controls. A plain .count() does not
    // retry, so it sampled mid-construction and saw only the pre-existing
    // native inputs, reporting "expected > 15, received 3" as though the page
    // were broken. expect.poll retries until the counts settle, no fixed sleep.
    await expect
      .poll(() => page.locator('input[type="checkbox"]').count(), { timeout: 15000 })
      .toBeGreaterThan(15); // 17 converted + pre-existing native ones
    await expect
      .poll(() => page.locator('textarea').count(), { timeout: 15000 })
      .toBeGreaterThan(10); // 14 converted + pre-existing native ones
  });
});
