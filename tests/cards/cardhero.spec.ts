import { test, expect, Page } from '@playwright/test';

test.describe('Card Hero (integration)', () => {
  test('should render hero card with title', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-hero';
      el.setAttribute('x-cardhero', '');
      el.setAttribute('data-title', 'Hero Title');
      el.setAttribute('data-subtitle', 'Hero Subtitle');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const card = page.locator('#test-hero');
    await expect(card).toHaveClass(/wb-card/);
    await expect(card).toHaveClass(/wb-card--hero/);
    
    // Check title exists
    const title = card.locator('.wb-card__hero-title');
    await expect(title).toHaveText('Hero Title');
    
    // Check subtitle exists
    const subtitle = card.locator('.wb-card__hero-subtitle');
    await expect(subtitle).toHaveText('Hero Subtitle');
  });

  test('should have minimum height', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-hero-height';
      el.setAttribute('x-cardhero', '');
      el.setAttribute('data-title', 'Big Hero');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const card = page.locator('#test-hero-height');
    await expect(card).toHaveCSS('min-height', '400px');
  });

  test('should support background image', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-hero-bg';
      el.setAttribute('x-cardhero', '');
      el.setAttribute('data-title', 'Background Hero');
      el.setAttribute('data-background', 'https://picsum.photos/800/400');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const card = page.locator('#test-hero-bg');
    const bgImage = await card.evaluate(el => getComputedStyle(el).backgroundImage);
    expect(bgImage).toContain('url');
  });

  test('should support text alignment', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-hero-left';
      el.setAttribute('x-cardhero', '');
      el.setAttribute('data-title', 'Left Aligned');
      el.setAttribute('data-align', 'left');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const card = page.locator('#test-hero-left');
    await expect(card).toHaveClass(/wb-card--align-left/);
  });
});
