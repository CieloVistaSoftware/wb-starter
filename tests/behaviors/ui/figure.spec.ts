import { test, expect, Page } from '@playwright/test';

test.describe('Figure Component', () => {
  test('should render caption from data-caption attribute', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    
    await page.evaluate(() => {
      const el = document.createElement('figure');
      el.id = 'test-figure-caption';
      el.setAttribute('data-wb', 'figure');
      el.setAttribute('data-caption', 'Test Caption');
      const img = document.createElement('img');
      img.src = 'https://picsum.photos/200';
      el.appendChild(img);
      document.body.appendChild(el);
      document.body.appendChild(el);
    });

    await waitForWBScan(page, '#test-figure');
    const figure = page.locator('#test-figure-caption');
    const caption = figure.locator('figcaption');
    await expect(caption).toBeVisible();
    await expect(caption).toHaveText('Test Caption');
  });
});
