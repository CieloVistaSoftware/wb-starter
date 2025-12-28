import { test, expect, Page } from '@playwright/test';

test.describe('Card Overlay (integration)', () => {
  test('should create overlay element with data-title text', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-overlay';
      el.setAttribute('data-wb', 'cardoverlay');
      el.setAttribute('data-title', 'My Overlay Title');
      el.setAttribute('data-image', 'https://picsum.photos/400/300');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const card = page.locator('#test-overlay');
    await expect(card).toHaveClass(/wb-card/);
    await expect(card).toHaveClass(/wb-card--overlay-card/);
    
    // Should have overlay content with title
    const overlayContent = card.locator('.wb-card__overlay-content');
    await expect(overlayContent).toBeVisible();
    
    // Title should be visible
    const title = card.locator('.wb-card__overlay-title');
    await expect(title).toHaveText('My Overlay Title');
  });

  test('should have gradient background on overlay', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-overlay-gradient';
      el.setAttribute('data-wb', 'cardoverlay');
      el.setAttribute('data-title', 'Gradient Test');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const overlayContent = page.locator('#test-overlay-gradient .wb-card__overlay-content');
    await expect(overlayContent).toBeVisible();
    const style = await overlayContent.getAttribute('style');
    expect(style).toContain('gradient');
  });

  test('should position overlay at bottom by default', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-overlay-position';
      el.setAttribute('data-wb', 'cardoverlay');
      el.setAttribute('data-title', 'Bottom Position');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const card = page.locator('#test-overlay-position');
    await expect(card).toHaveClass(/wb-card--overlay-bottom/);
    await expect(card).toHaveCSS('align-items', 'flex-end');
  });

  test('should support background image', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-overlay-image';
      el.setAttribute('data-wb', 'cardoverlay');
      el.setAttribute('data-title', 'Image Test');
      el.setAttribute('data-image', 'https://picsum.photos/400/300');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const card = page.locator('#test-overlay-image');
    // Check for background-image in style attribute
    const style = await card.getAttribute('style');
    expect(style).toContain('background-image');
    expect(style).toContain('url');
  });
});
