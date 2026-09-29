import { test, expect, Page } from '../fixtures/offline';
import { settledWidthPercent } from '../helpers/settled-style';

test.describe('Progress Bar (integration)', () => {
  test('should render progress bar with progress class', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-progress';
      el.setAttribute('x-progress', '');
      el.setAttribute('value', '75');
      document.body.appendChild(el);
      await (window as any).WB.scan();
    });
    
    const bar = page.locator('#test-progress');
    await expect(bar).toHaveClass(/x-progress/);
  });

  test('should show progress bar fill', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-progress-fill';
      el.setAttribute('x-progress', '');
      // Plain value/max (v3, #224): progress() reads only the plain
      // attributes, so data-value left the bar with no width at all.
      el.setAttribute('value', '50');
      el.setAttribute('max', '100');
      document.body.appendChild(el);
      await (window as any).WB.scan();
    });
    
    const fill = page.locator('#test-progress-fill .x-progress__bar');
    await expect(fill).toBeVisible();
    
    // #779: the fill's width is a generated stylesheet rule, never a style
    // attribute -- measure what renders.
    expect(await settledWidthPercent(fill)).toBeCloseTo(50, 0);
  });

  test('should have appropriate height', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-progress-height';
      el.setAttribute('x-progress', '');
      el.setAttribute('value', '75');
      // The % label is built in by default (#280) and the labeled bar is
      // deliberately taller (1.25rem) so the text fits. This measures the
      // BAR's own height, so switch the label off.
      el.setAttribute('show-label', 'false');
      document.body.appendChild(el);
      await (window as any).WB.scan();
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
    
    await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-progress-radius';
      el.setAttribute('x-progress', '');
      el.setAttribute('value', '60');
      document.body.appendChild(el);
      await (window as any).WB.scan();
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
    
    await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-progress-anim';
      el.setAttribute('x-progress', '');
      el.setAttribute('value', '80');
      el.setAttribute('animated', '');
      document.body.appendChild(el);
      await (window as any).WB.scan();
    });

    const fill = page.locator('#test-progress-anim .x-progress__bar');
    expect(await settledWidthPercent(fill)).toBeCloseTo(80, 0);

    // Should have transition for smooth animation. Read the COMPUTED style:
    // the transition moved out of an inline style into progress.css (Law 9,
    // #370), so the style attribute now carries only the per-instance width.
    const transition = await fill.evaluate((el) => getComputedStyle(el).transitionProperty);
    expect(transition).toMatch(/width|all/);
  });
});
