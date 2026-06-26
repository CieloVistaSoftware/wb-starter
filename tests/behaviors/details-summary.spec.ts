/**
 * wb-details — summary attribute becomes the header (issue #131)
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'details-test-area';
    c.style.cssText = 'padding:20px; width:500px;';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(); });
  await page.waitForTimeout(400);
}

test.describe('wb-details', () => {
  test('header shows the summary attribute, not the literal "Details"', async ({ page }) => {
    await setup(page, '<wb-details summary="Question?"><p>Answer content here</p></wb-details>');
    const label = page.locator('.wb-details__label');
    await expect(label).toHaveText('Question?');
  });

  test('answer content lives in the body, not the summary', async ({ page }) => {
    await setup(page, '<wb-details summary="What is wb-starter?"><p id="ans">Answer content here</p></wb-details>');
    const ans = page.locator('#ans');
    await expect(ans).toHaveText('Answer content here');
    const inSummary = await ans.evaluate((el) => !!el.closest('summary'));
    expect(inSummary).toBe(false);
  });
});
