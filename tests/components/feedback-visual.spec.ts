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
    
    await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-progress-height';
      el.setAttribute('x-progress', '');
      el.setAttribute('value', '75');
      document.body.appendChild(el);
      await (window as any).WB.scan();
    });

    const progress = page.locator('#test-progress-height');
    const height = await progress.evaluate(el => parseFloat(getComputedStyle(el).height));
    
    // #932: this asserted <= 12px ("0.6rem"), the BARE .x-progress height.
    // But `showLabel` defaults TRUE (progress.js: `getAttribute('show-label')
    // !== 'false'`), so every bar gets .x-progress--labeled { height: 1.25rem }
    // -- added by #280 to give the built-in % label room. 20px is the default,
    // and the test was contradicting it.
    expect(height).toBeGreaterThan(12);
    expect(height).toBeLessThanOrEqual(24);

    // ...and show-label="false" returns it to the compact bar, which is what
    // the old expectation actually described.
    const bare = await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-progress-unlabeled';
      el.setAttribute('x-progress', '');
      el.setAttribute('value', '75');
      el.setAttribute('show-label', 'false');
      document.body.appendChild(el);
      await (window as any).WB.scan();
      return parseFloat(getComputedStyle(el).height);
    });
    expect(bare).toBeLessThanOrEqual(12);
    expect(bare).toBeGreaterThan(2);
  });
  
  test('should animate from 0 to target value', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-progress-anim';
      el.setAttribute('x-progress', '');
      el.setAttribute('value', '75');
      el.setAttribute('animated', 'true');
      document.body.appendChild(el);
      await (window as any).WB.scan();
    });

    // Wait for animation to complete
    await page.waitForTimeout(1200);

    // Check final width matches value
    const progressBar = page.locator('#test-progress-anim .x-progress__bar');
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
    
    await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-spinner';
      el.setAttribute('x-spinner', '');
      document.body.appendChild(el);
      await (window as any).WB.scan();
    });
    
    const spinner = page.locator('#test-spinner');
    await expect(spinner).toHaveClass(/x-spinner/);
    
    // #932: this read an inline `style` attribute, which is always null now --
    // Law 9 moved these rules into CSS, and `expect(null).toContain(...)` is a
    // matcher error rather than a failed assertion. Read the COMPUTED value,
    // which is true whether the rule lives in a stylesheet or inline.
    const animation = await spinner.evaluate((el) => {
      const self = getComputedStyle(el).animationName;
      if (self && self !== 'none') return self;
      const child = el.querySelector('*');
      return child ? getComputedStyle(child).animationName : 'none';
    });
    expect(animation).not.toBe('none');
    expect(animation).toContain('spin');
  });
  
  test('should have different colors based on color', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(async () => {
      const primary = document.createElement('div');
      primary.id = 'spinner-primary';
      primary.setAttribute('x-spinner', '');
      primary.setAttribute('color', 'primary');
      document.body.appendChild(primary);
      
      const success = document.createElement('div');
      success.id = 'spinner-success';
      success.setAttribute('x-spinner', '');
      success.setAttribute('color', 'success');
      document.body.appendChild(success);
      
      await (window as any).WB.scan();
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
    
    await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-skeleton';
      el.setAttribute('x-skeleton', '');
      el.setAttribute('variant', 'text');
      document.body.appendChild(el);
      await (window as any).WB.scan();
    });

    const skeleton = page.locator('#test-skeleton');
    await expect(skeleton).toBeVisible();
    
    // #932: this waited on `skeleton.locator('div').first()` and timed out at
    // 30s -- skeleton() appends bare <span> children, and only when lines > 1,
    // so with the default lines=1 it builds nothing at all. The shimmer is a
    // CSS rule on the skeleton itself; read it computed.
    const animation = await skeleton.evaluate(
      (el) => getComputedStyle(el).animationName,
    );
    expect(animation).not.toBe('none');
    expect(animation.toLowerCase()).toContain('shimmer');
  });
  
  test('text variant creates multiple lines', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-skeleton-lines';
      el.setAttribute('x-skeleton', '');
      el.setAttribute('variant', 'text');
      el.setAttribute('lines', '3');
      document.body.appendChild(el);
      await (window as any).WB.scan();
    });
    
    const skeleton = page.locator('#test-skeleton-lines');
    // #932: `.x-skeleton__line` is emitted nowhere -- skeleton() appends
    // UNCLASSED <span> elements, one per line. The old selector could only
    // ever count 0.
    const lineCount = await skeleton.locator('span').count();

    expect(lineCount).toBe(3);
  });
});

test.describe('Clickable Card', () => {
  test('should toggle active state on click', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-clickable-card';
      el.setAttribute('x-card', '');
      // #932: was `data-clickable`. Law 11 removed data-* config; card.js:184
      // reads the plain `clickable`, and card.css selects the [clickable]
      // ATTRIBUTE for the pointer cursor ("No class: card.css reads the
      // [clickable] attribute" -- card.js:344).
      el.setAttribute('clickable', '');
      el.textContent = 'Click me';
      document.body.appendChild(el);
      await (window as any).WB.scan();
    });
    
    const card = page.locator('#test-clickable-card');
    
    // Check cursor is pointer
    const cursor = await card.evaluate(el => getComputedStyle(el).cursor);
    expect(cursor).toBe('pointer');
    
    // Click and check for active class
    await card.click();
    await page.waitForTimeout(150);
    
    await expect(card).toHaveClass(/x-card--active/);
    
    // Click again to toggle off
    await card.click();
    await page.waitForTimeout(150);
    
    await expect(card).not.toHaveClass(/x-card--active/);
  });
});

test.describe('Card Structure', () => {
  test('card with title and footer has proper structure', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-card-structure';
      el.setAttribute('x-card', '');
      el.setAttribute('data-title', 'Test Title');
      el.setAttribute('data-footer', 'Footer text');
      el.textContent = 'Card content';
      document.body.appendChild(el);
      await (window as any).WB.scan();
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
