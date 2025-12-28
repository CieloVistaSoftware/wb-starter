import { test, expect, Page } from '@playwright/test';

test.describe('Card Button (integration)', () => {
  test('should render button with primary action', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-cardbutton';
      el.setAttribute('data-wb', 'cardbutton');
      el.setAttribute('data-title', 'Card Title');
      el.setAttribute('data-primary', 'Click Me');
      el.textContent = 'Card content here';
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const card = page.locator('#test-cardbutton');
    await expect(card).toHaveClass(/wb-card/);
    await expect(card).toHaveClass(/wb-card--button/);
    
    // Check primary button exists
    const primaryBtn = card.locator('.wb-card__btn--primary');
    await expect(primaryBtn).toHaveText('Click Me');
  });

  test('should render both primary and secondary buttons', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-cardbutton-2';
      el.setAttribute('data-wb', 'cardbutton');
      el.setAttribute('data-title', 'Actions');
      el.setAttribute('data-primary', 'Save');
      el.setAttribute('data-secondary', 'Cancel');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const card = page.locator('#test-cardbutton-2');
    const primaryBtn = card.locator('.wb-card__btn--primary');
    const secondaryBtn = card.locator('.wb-card__btn--secondary');
    
    await expect(primaryBtn).toHaveText('Save');
    await expect(secondaryBtn).toHaveText('Cancel');
  });

  test('should have border', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-cardbutton-border';
      el.setAttribute('data-wb', 'cardbutton');
      el.setAttribute('data-primary', 'Action');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const card = page.locator('#test-cardbutton-border');
    await expect(card).toHaveCSS('border-style', 'solid');
  });
});
