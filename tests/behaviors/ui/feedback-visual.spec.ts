import { test, expect } from '@playwright/test';

/**
 * FEEDBACK COMPONENT VISUAL TESTS
 * ===============================
 * Tests for progress bars, spinners, skeleton loaders
 * Creates test elements directly rather than relying on page structure
 */

test.describe('Progress Bars', () => {
  test('should have appropriate height', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-progress-height';
      el.setAttribute('data-wb', 'progress');
      el.setAttribute('data-value', '75');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const progress = page.locator('#test-progress-height');
    const height = await progress.evaluate(el => parseFloat(getComputedStyle(el).height));
    
    // Should have some height (0.6rem ≈ 9.6px)
    expect(height).toBeLessThanOrEqual(12);
    expect(height).toBeGreaterThan(5);
  });
  
  test('should animate from 0 to target value', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-progress-anim';
      el.setAttribute('data-wb', 'progress');
      el.setAttribute('data-value', '75');
      el.setAttribute('data-animated', 'true');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    // Wait for animation to complete
    await page.waitForTimeout(1200);
    
    // Check final width matches value
    const progressBar = page.locator('#test-progress-anim .wb-progress__bar');
    const barWidth = await progressBar.evaluate(el => el.style.width);
    
    expect(barWidth).toBe('75%');
  });
});

test.describe('Spinners', () => {
  test('should render with spinning animation', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-spinner';
      el.setAttribute('data-wb', 'spinner');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const spinner = page.locator('#test-spinner');
    await expect(spinner).toHaveClass(/wb-spinner/);
    
    const inner = spinner.locator('div').first();
    const style = await inner.getAttribute('style');
    expect(style).toContain('animation');
    expect(style).toContain('wb-spin');
  });
  
  test('should have different colors based on data-color', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const primary = document.createElement('div');
      primary.id = 'spinner-primary';
      primary.setAttribute('data-wb', 'spinner');
      primary.setAttribute('data-color', 'primary');
      document.body.appendChild(primary);
      
      const success = document.createElement('div');
      success.id = 'spinner-success';
      success.setAttribute('data-wb', 'spinner');
      success.setAttribute('data-color', 'success');
      document.body.appendChild(success);
      
      (window as any).WB.scan();
    });
    
    const primaryInner = page.locator('#spinner-primary > div').first();
    const successInner = page.locator('#spinner-success > div').first();
    
    const primaryColor = await primaryInner.evaluate(el => getComputedStyle(el).borderTopColor);
    const successColor = await successInner.evaluate(el => getComputedStyle(el).borderTopColor);
    
    expect(primaryColor).not.toBe(successColor);
  });
});

test.describe('Skeleton Loaders', () => {
  test('should have shimmer animation', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-skeleton';
      el.setAttribute('data-wb', 'skeleton');
      el.setAttribute('data-variant', 'text');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const skeleton = page.locator('#test-skeleton');
    await expect(skeleton).toBeVisible();
    
    // Check for shimmer animation in inner div
    const innerDiv = skeleton.locator('div').first();
    const style = await innerDiv.getAttribute('style');
    expect(style).toContain('animation');
    expect(style).toContain('shimmer');
  });
  
  test('text variant creates multiple lines', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-skeleton-lines';
      el.setAttribute('data-wb', 'skeleton');
      el.setAttribute('data-variant', 'text');
      el.setAttribute('data-lines', '3');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const skeleton = page.locator('#test-skeleton-lines');
    const lines = skeleton.locator('.wb-skeleton__line');
    const lineCount = await lines.count();
    
    expect(lineCount).toBe(3);
  });
});

test.describe('Clickable Card', () => {
  test('should toggle active state on click', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-clickable-card';
      el.setAttribute('data-wb', 'card');
      el.setAttribute('data-clickable', '');
      el.textContent = 'Click me';
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const card = page.locator('#test-clickable-card');
    
    // Check cursor is pointer
    const cursor = await card.evaluate(el => getComputedStyle(el).cursor);
    expect(cursor).toBe('pointer');
    
    // Click and check for active class
    await card.click();
    await page.waitForTimeout(150);
    
    await expect(card).toHaveClass(/wb-card--active/);
    
    // Click again to toggle off
    await card.click();
    await page.waitForTimeout(150);
    
    await expect(card).not.toHaveClass(/wb-card--active/);
  });
});

test.describe('Card Structure', () => {
  test('card with title and footer has proper structure', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-card-structure';
      el.setAttribute('data-wb', 'card');
      el.setAttribute('data-title', 'Test Title');
      el.setAttribute('data-footer', 'Footer text');
      el.textContent = 'Card content';
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const card = page.locator('#test-card-structure');
    
    const header = card.locator('header');
    const main = card.locator('main');
    const footer = card.locator('footer');
    
    expect(await header.count()).toBe(1);
    expect(await main.count()).toBe(1);
    expect(await footer.count()).toBe(1);
  });
});
