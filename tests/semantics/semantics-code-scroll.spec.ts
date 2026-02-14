import { test, expect } from '@playwright/test';

test.describe('Code Behavior Scroll Options', () => {
  
  test('Default behavior (scrollable=false) wraps text and expands', async ({ page }) => {
    await page.setContent(`
      <wb-code id="test-pre-default"><code>const veryLongLine = "This is a very long line of code that should wrap to the next line because scrollable is not set (default false).";</code></pre>
      <script src="/src/index.js" type="module"></script>
    `);

    const pre = page.locator('#test-pre-default');
    await expect(pre).toHaveClass(/x-pre/);
    
    // Check styles
    await expect(pre).toHaveCSS('white-space', 'pre-wrap');
    await expect(pre).toHaveCSS('overflow', 'visible');
  });

  test('Scrollable behavior (scrollable=true) does not wrap and scrolls', async ({ page }) => {
    await page.setContent(`
      <wb-code id="test-pre-scroll" data-scrollable="true"><code>const veryLongLine = "This is a very long line of code that should NOT wrap to the next line because scrollable is set to true.";</code></pre>
      <script src="/src/index.js" type="module"></script>
    `);

    const pre = page.locator('#test-pre-scroll');
    await expect(pre).toHaveClass(/x-pre/);
    
    // Check styles
    await expect(pre).toHaveCSS('white-space', 'pre');
    await expect(pre).toHaveCSS('overflow', 'auto');
  });

  test('Standalone code block default behavior', async ({ page }) => {
    await page.setContent(`
      <wb-code id="test-code-default" data-variant="block">const x = 1;</code>
      <script src="/src/index.js" type="module"></script>
    `);

    const code = page.locator('#test-code-default');
    await expect(code).toHaveClass(/x-code/);
    
    // Check styles
    await expect(code).toHaveCSS('white-space', 'pre-wrap');
    await expect(code).toHaveCSS('overflow', 'visible');
  });

  test('Standalone code block scrollable behavior', async ({ page }) => {
    await page.setContent(`
      <wb-code id="test-code-scroll" data-variant="block" data-scrollable="true">const x = 1;</code>
      <script src="/src/index.js" type="module"></script>
    `);

    const code = page.locator('#test-code-scroll');
    await expect(code).toHaveClass(/x-code/);
    
    // Check styles
    await expect(code).toHaveCSS('white-space', 'pre');
    await expect(code).toHaveCSS('overflow', 'auto');
  });
});
