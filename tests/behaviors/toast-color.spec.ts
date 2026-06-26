/**
 * x-toast — toast type drives the variant class/color (issue #126)
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'toast-test-area';
    c.style.cssText = 'padding:20px;';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(); });
  await page.waitForTimeout(300);
}

test.describe('x-toast', () => {
  for (const type of ['success', 'warning', 'error']) {
    test(`data-type="${type}" produces a wb-toast--${type}`, async ({ page }) => {
      await setup(page, `<button id="bt-${type}" x-toast data-message="${type} msg" data-type="${type}">Go</button>`);
      await page.locator(`#bt-${type}`).click();
      const toast = page.locator(`.wb-toast--${type}`);
      await expect(toast).toHaveCount(1);
      await expect(toast).toContainText(`${type} msg`);
    });
  }

  test('different types yield different background colors', async ({ page }) => {
    await setup(page, `
      <button id="b-succ" x-toast data-message="s" data-type="success">S</button>
      <button id="b-err" x-toast data-message="e" data-type="error">E</button>`);
    await page.locator('#b-succ').click();
    await page.locator('#b-err').click();
    await page.waitForTimeout(200);
    const succBg = await page.locator('.wb-toast--success').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    const errBg = await page.locator('.wb-toast--error').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(succBg).not.toBe(errBg);
  });
});
