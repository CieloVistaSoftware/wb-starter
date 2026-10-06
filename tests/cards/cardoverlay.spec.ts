import { test, expect, Page } from '../fixtures/offline';

test.describe('Card Overlay (integration)', () => {
  test('should create overlay element with data-title text', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-overlay';
      el.setAttribute('x-cardoverlay', '');
      el.setAttribute('data-title', 'My Overlay Title');
      el.setAttribute('data-image', 'https://picsum.photos/400/300');
      document.body.appendChild(el);
      await (window as any).WB.scan();
    });
    
    const card = page.locator('#test-overlay');
    // #969: the variant is the x-cardoverlay attribute; the built card carries its position class.
    await expect(card).toHaveClass(/\bx-card--overlay-(top|center|bottom)\b/);
    
    // Should have overlay content with title
    const overlayContent = card.locator('.x-card__overlay-content');
    await expect(overlayContent).toBeVisible();
    
    // Title should be visible
    const title = card.locator('.x-card__overlay-title');
    await expect(title).toHaveText('My Overlay Title');
  });

  test('should have gradient background on overlay', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-overlay-gradient';
      el.setAttribute('x-cardoverlay', '');
      el.setAttribute('data-title', 'Gradient Test');
      document.body.appendChild(el);
      await (window as any).WB.scan();
    });
    
    const overlayContent = page.locator('#test-overlay-gradient .x-card__overlay-content');
    await expect(overlayContent).toBeVisible();
    // Computed, not the style attribute: #779 moved the gradient into
    // card.css's .x-card__overlay-content--gradient-* rules.
    const bg = await overlayContent.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain('gradient');
  });

  test('should position overlay at bottom by default', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-overlay-position';
      el.setAttribute('x-cardoverlay', '');
      el.setAttribute('data-title', 'Bottom Position');
      document.body.appendChild(el);
      await (window as any).WB.scan();
    });
    
    const card = page.locator('#test-overlay-position');
    await expect(card).toHaveClass(/x-card--overlay-bottom/);
    await expect(card).toHaveCSS('align-items', 'flex-end');
  });

  test('should support background image', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-overlay-image';
      el.setAttribute('x-cardoverlay', '');
      el.setAttribute('data-title', 'Image Test');
      el.setAttribute('data-image', 'https://picsum.photos/400/300');
      document.body.appendChild(el);
      await (window as any).WB.scan();
    });
    
    const card = page.locator('#test-overlay-image');
    // Computed background-image: since #779 the image URL reaches the card
    // through a generated stylesheet rule, not its style attribute.
    const bg = await card.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain('url');
    expect(bg).toContain('picsum.photos');
  });
});
