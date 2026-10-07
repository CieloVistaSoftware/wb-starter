import { test, expect, Page } from '../fixtures/offline';

test.describe('Spinner (integration)', () => {
  test('should render a spinner with animation', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    
    await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-spinner';
      el.setAttribute('x-spinner', '');
      el.setAttribute('variant', 'primary');
      document.body.appendChild(el);
      await (window as any).WB.scan();
    });
    
    // The spinner behavior adds x-spinner class
    const spinner = page.locator('#test-spinner');
    await expect(spinner).toHaveClass(/x-spinner/);
    
    // Check the inner spinning div exists and has animation
    const innerDiv = spinner.locator('div');
    await expect(innerDiv).toBeVisible();
    
    // Verify animation is applied (x-spin). Computed, not the style
    // attribute: the ring's animation lives in the spinner stylesheet now
    // (Law 9, #370) -- the inline style it used to be read from is gone.
    await expect(innerDiv).toHaveCSS('animation-name', 'x-spin');
  });

  test('should have border-radius for circular spinner', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    
    await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-spinner-2';
      el.setAttribute('x-spinner', '');
      document.body.appendChild(el);
      await (window as any).WB.scan();
    });
    
    const innerDiv = page.locator('#test-spinner-2 div');
    await expect(innerDiv).toHaveCSS('border-radius', '50%');
  });

  test('should have spinning border (border-top different color)', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    
    await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-spinner-3';
      el.setAttribute('x-spinner', '');
      el.setAttribute('variant', 'primary');
      document.body.appendChild(el);
      await (window as any).WB.scan();
    });
    
    const innerDiv = page.locator('#test-spinner-3 div');
    await expect(innerDiv).toBeVisible();

    // Should have a border whose top edge is a different colour -- that
    // contrast IS the spinning effect. Computed styles: the border moved from
    // an inline style into CSS (Law 9, #370).
    const b = await innerDiv.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { width: parseFloat(cs.borderTopWidth), top: cs.borderTopColor, right: cs.borderRightColor };
    });
    expect(b.width).toBeGreaterThan(0);
    expect(b.top).not.toBe(b.right);
  });
});
