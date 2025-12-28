import { test, expect, Page } from '@playwright/test';

test.describe('Progress Bar (integration)', () => {
  test('should render progress bar with wb-progress class', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-progress';
      el.setAttribute('data-wb', 'progress');
      el.setAttribute('data-value', '75');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const bar = page.locator('#test-progress');
    await expect(bar).toHaveClass(/wb-progress/);
  });

  test('should show progress bar fill', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-progress-fill';
      el.setAttribute('data-wb', 'progress');
      el.setAttribute('data-value', '50');
      el.setAttribute('data-max', '100');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const fill = page.locator('#test-progress-fill .wb-progress__bar');
    await expect(fill).toBeVisible();
    
    // Check the style attribute contains 50%
    const style = await fill.getAttribute('style');
    expect(style).toContain('width');
    expect(style).toContain('50%');
  });

  test('should have appropriate height', async ({ page }: { page: Page }) => {
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
    
    const bar = page.locator('#test-progress-height');
    const height = await bar.evaluate(el => parseFloat(getComputedStyle(el).height));
    
    // Should have some height (0.6rem = ~9.6px)
    expect(height).toBeGreaterThan(5);
    expect(height).toBeLessThanOrEqual(12);
  });

  test('should have rounded corners', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-progress-radius';
      el.setAttribute('data-wb', 'progress');
      el.setAttribute('data-value', '60');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const bar = page.locator('#test-progress-radius');
    const borderRadius = await bar.evaluate(el => getComputedStyle(el).borderRadius);
    
    // Should have some border radius (0.3rem = ~4.8px)
    expect(parseFloat(borderRadius)).toBeGreaterThan(0);
  });

  test('should animate progress bar fill', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-progress-anim';
      el.setAttribute('data-wb', 'progress');
      el.setAttribute('data-value', '80');
      el.setAttribute('data-animated', 'true');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    // Wait for animation to complete
    await page.waitForTimeout(200);
    
    const fill = page.locator('#test-progress-anim .wb-progress__bar');
    const style = await fill.getAttribute('style');
    
    // Should have transition for smooth animation
    expect(style).toContain('transition');
  });
});
