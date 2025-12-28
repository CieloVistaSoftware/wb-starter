import { test, expect, Page } from '@playwright/test';

test.describe('Chip (integration)', () => {
  test('should render chip with wb-chip class', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-chip';
      el.setAttribute('data-wb', 'chip');
      el.textContent = 'Tag Label';
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const chip = page.locator('#test-chip');
    await expect(chip).toHaveClass(/wb-chip/);
    await expect(chip).toBeVisible();
  });

  test('should have pill-shaped border radius', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-chip-pill';
      el.setAttribute('data-wb', 'chip');
      el.textContent = 'Pill Chip';
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const chip = page.locator('#test-chip-pill');
    await expect(chip).toHaveCSS('border-radius', '999px');
  });

  test('should add dismiss button when dismissible', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-chip-dismiss';
      el.setAttribute('data-wb', 'chip');
      el.setAttribute('data-dismissible', '');
      el.textContent = 'Dismissible';
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const chip = page.locator('#test-chip-dismiss');
    const removeBtn = chip.locator('.wb-chip__remove');
    await expect(removeBtn).toBeVisible();
    await expect(removeBtn).toHaveText('×');
  });
});
