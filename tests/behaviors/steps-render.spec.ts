/**
 * x-steps — renders wizard from items with current (issue #134)
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'steps-test-area';
    c.style.cssText = 'padding:20px; width:600px;';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(400);
}

test.describe('x-steps', () => {
  test('renders one item per items entry', async ({ page }) => {
    await setup(page, '<div id="st" x-steps items="Cart,Shipping,Payment,Confirm" current="2"></div>');
    const items = page.locator('#st .wb-steps__item');
    await expect(items).toHaveCount(4);
    await expect(page.locator('#st')).toContainText('Cart');
    await expect(page.locator('#st')).toContainText('Confirm');
  });

  test('completed step shows a check, current shows its number', async ({ page }) => {
    await setup(page, '<div id="st2" x-steps items="Cart,Shipping,Payment,Confirm" current="2"></div>');
    const first = page.locator('#st2 .wb-steps__item').nth(0);
    await expect(first).toContainText('✓'); // step 1 complete
    const second = page.locator('#st2 .wb-steps__item').nth(1);
    await expect(second).toContainText('2'); // step 2 current
  });
});
