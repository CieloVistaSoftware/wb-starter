import { test, expect, Page } from '@playwright/test';

test.describe('Spinner (integration)', () => {
  test('should render a spinner with animation', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-spinner';
      el.setAttribute('data-wb', 'spinner');
      el.setAttribute('data-color', 'primary');
      document.body.appendChild(el);
    });

    await waitForWBScan(page, '#test-spinner');

    // The spinner behavior adds wb-spinner class
    const spinner = page.locator('#test-spinner');
    await expect(spinner).toHaveClass(/wb-spinner/);
    
    // Check the inner spinning div exists and has animation
    const innerDiv = spinner.locator('div');
    await expect(innerDiv).toBeVisible();
    
    // Verify animation is applied (wb-spin)
    const style = await innerDiv.getAttribute('style');
    expect(style).toContain('animation');
    expect(style).toContain('wb-spin');
  });

  test('should have border-radius for circular spinner', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-spinner-2';
      el.setAttribute('data-wb', 'spinner');
      document.body.appendChild(el);
    });

    await waitForWBScan(page, '#test-spinner-2');
    const innerDiv = page.locator('#test-spinner-2 div');
    await expect(innerDiv).toHaveCSS('border-radius', '50%');
  });

  test('should have spinning border (border-top different color)', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-spinner-3';
      el.setAttribute('data-wb', 'spinner');
      el.setAttribute('data-color', 'primary');
      document.body.appendChild(el);
    });

    await waitForWBScan(page, '#test-spinner-3');
    const innerDiv = page.locator('#test-spinner-3 div');
    const style = await innerDiv.getAttribute('style');
    
    // Should have border and border-top-color for the spinning effect
    expect(style).toContain('border');
    expect(style).toContain('border-top-color');
  });
});
