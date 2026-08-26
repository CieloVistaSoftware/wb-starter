/**
 * x-toast — toast type drives the variant class/color (issue #126)
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  // #735: NOT WBSite. This page is a standalone harness, not an SPA route, so
  // window.WBSite is never created here -- the wait burned its full timeout and
  // failed before a single assertion ran. WB.behaviors is the readiness signal
  // that applies, and this setup scans the DOM itself below.
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'toast-test-area';
    c.style.cssText = 'padding:20px;';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(300);
}

test.describe('x-toast', () => {
  for (const type of ['success', 'warning', 'error']) {
    test(`toast-variant="${type}" produces a x-toast--${type}`, async ({ page }) => {
      await setup(page, `<button id="bt-${type}" x-toast message="${type} msg" toast-variant="${type}">Go</button>`);
      await page.locator(`#bt-${type}`).click();
      const toast = page.locator(`.x-toast--${type}`);
      await expect(toast).toHaveCount(1);
      await expect(toast).toContainText(`${type} msg`);
    });
  }

  test('different types yield different background colors', async ({ page }) => {
    await setup(page, `
      <button id="b-succ" x-toast message="s" toast-variant="success">S</button>
      <button id="b-err" x-toast message="e" toast-variant="error">E</button>`);
    await page.locator('#b-succ').click();
    await page.locator('#b-err').click();
    await page.waitForTimeout(200);
    const succBg = await page.locator('.x-toast--success').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    const errBg = await page.locator('.x-toast--error').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(succBg).not.toBe(errBg);
  });
});
