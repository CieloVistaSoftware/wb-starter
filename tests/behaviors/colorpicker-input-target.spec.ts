/**
 * x-colorpicker always created a NEW <input type="color"> and appended it
 * as a child of the target element. <input> is a void element — it can
 * never hold a child — so on its actual demoed usage (x-colorpicker
 * applied directly to a real <input>, e.g.
 * pages/behaviors.html: <input type="text" x-colorpicker value="#...">)
 * the appendChild was a silent no-op: no swatch, just plain text.
 *
 * Fixed in src/wb-viewmodels/colorpicker.js: an <input> target is now
 * converted in place (type="color") instead of nesting a new one inside
 * it. Non-input targets keep the original append-a-child behavior.
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'colorpicker-test-area';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(400);
}

test.describe('x-colorpicker on a real <input> (its actual demoed usage)', () => {
  test('the input itself is converted to type="color", not left as plain text', async ({ page }) => {
    await setup(page, '<input id="cp1" type="text" x-colorpicker value="#6366f1">');
    await expect(page.locator('#cp1')).toHaveJSProperty('type', 'color');
    await expect(page.locator('#cp1')).toHaveJSProperty('value', '#6366f1');
  });

  test('no child <input type=color> was appended (would be invalid on a void element)', async ({ page }) => {
    await setup(page, '<input id="cp2" type="text" x-colorpicker value="#22c55e">');
    const childCount = await page.locator('#cp2').evaluate((el) => el.children.length);
    expect(childCount).toBe(0);
  });

  test('the wb-colorpicker class is applied', async ({ page }) => {
    await setup(page, '<input id="cp3" type="text" x-colorpicker value="#f59e0b">');
    await expect(page.locator('#cp3')).toHaveClass(/wb-colorpicker/);
  });
});
