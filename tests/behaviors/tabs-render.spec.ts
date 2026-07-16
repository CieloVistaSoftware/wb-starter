/**
 * wb-tabs — headers from tab-title, panel switching (issue #130)
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'tabs-test-area';
    c.style.cssText = 'padding:20px; width:500px;';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(400);
}

const MARKUP = `
  <wb-tabs id="tabs">
    <div tab-title="Overview"><p>Overview content</p></div>
    <div tab-title="Features"><p>Features content</p></div>
    <div tab-title="Installation"><p>Installation content</p></div>
  </wb-tabs>`;

test.describe('wb-tabs', () => {
  test('renders the tab-title labels (not generic "Tab 1")', async ({ page }) => {
    await setup(page, MARKUP);
    const tabs = page.locator('#tabs .wb-tabs__tab');
    await expect(tabs).toHaveCount(3);
    await expect(tabs.nth(0)).toHaveText('Overview');
    await expect(tabs.nth(1)).toHaveText('Features');
    await expect(tabs.nth(2)).toHaveText('Installation');
  });

  test('first panel active by default, clicking switches', async ({ page }) => {
    await setup(page, MARKUP);
    const panels = page.locator('#tabs .wb-tabs__panel');
    await expect(panels.nth(0)).toBeVisible();
    await expect(panels.nth(1)).toBeHidden();
    await page.locator('#tabs .wb-tabs__tab', { hasText: 'Features' }).click();
    await expect(panels.nth(1)).toBeVisible();
    await expect(panels.nth(0)).toBeHidden();
  });
});
