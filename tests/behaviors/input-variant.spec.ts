/**
 * input[variant] — success/error get a colored border (issue #133)
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  // #727/#691: NOT WBSite. /demos/test-harness.html is a standalone page, not
  // an SPA route, so window.WBSite is never created there -- this waited the
  // full 20s and then failed before a single assertion ran. Same bug as
  // details-summary.spec.ts had. WB.behaviors is the signal that applies, and
  // setup() calls WB.scan() itself below.
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'input-test-area';
    c.style.cssText = 'padding:20px; display:flex; flex-direction:column; gap:8px;';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(300);
}

test('success and error variants have distinct, colored borders', async ({ page }) => {
  await setup(page, `
    <input id="basic" type="text" placeholder="Basic">
    <input id="succ" type="text" placeholder="Success" variant="success">
    <input id="err" type="text" placeholder="Error" variant="error">`);

  const succBorder = await page.locator('#succ').evaluate((el) => getComputedStyle(el).borderColor);
  const errBorder = await page.locator('#err').evaluate((el) => getComputedStyle(el).borderColor);
  const baseBorder = await page.locator('#basic').evaluate((el) => getComputedStyle(el).borderColor);

  expect(succBorder).not.toBe(errBorder);
  expect(succBorder).not.toBe(baseBorder);
  expect(errBorder).not.toBe(baseBorder);
});
