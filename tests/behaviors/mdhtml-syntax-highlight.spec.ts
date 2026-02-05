import { test, expect } from '@playwright/test';

test.describe('wb-mdhtml Syntax Highlighting', () => {

  test('Code blocks inside wb-mdhtml get hljs classes', async ({ page }) => {
    await page.goto('http://localhost:3000/?page=components');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for wb-mdhtml to be hydrated
    await page.waitForSelector('wb-mdhtml[data-wb-hydrated="1"]', { timeout: 10000 });
    
    // Find a code block inside wb-mdhtml
    const codeBlock = page.locator('wb-mdhtml pre code').first();
    
    // Check that hljs has been applied (should have 'hljs' class)
    await expect(codeBlock).toHaveClass(/hljs/);
    
    // Check that syntax tokens have been highlighted (should have span children with hljs-* classes)
    const highlightedSpan = codeBlock.locator('span[class^="hljs-"]').first();
    await expect(highlightedSpan).toBeVisible();
  });

  test('Code blocks have colored syntax tokens', async ({ page }) => {
    await page.goto('http://localhost:3000/?page=components');
    
    // Wait for hydration
    await page.waitForSelector('wb-mdhtml[data-wb-hydrated="1"]', { timeout: 10000 });
    
    // Find an HTML code block
    const codeBlock = page.locator('wb-mdhtml pre code.language-html, wb-mdhtml pre code.language-js').first();
    
    // Get the computed color of a keyword/tag span
    const tagSpan = codeBlock.locator('span.hljs-tag, span.hljs-keyword, span.hljs-name').first();
    
    // The color should NOT be the default text color (it should be highlighted)
    const color = await tagSpan.evaluate(el => getComputedStyle(el).color);
    
    // Most highlight themes use colors other than pure white/gray for tags
    // atom-one-dark-reasonable uses colors like #e06c75, #98c379, #61afef, etc.
    expect(color).not.toBe('rgb(255, 255, 255)');
    expect(color).not.toBe('rgb(0, 0, 0)');
  });

  test('hljs theme CSS is loaded', async ({ page }) => {
    await page.goto('http://localhost:3000/?page=components');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the hljs theme stylesheet is in the document
    const themeLink = page.locator('link[data-highlight-theme="true"]');
    await expect(themeLink).toHaveCount(1);
    
    // Verify the href points to CDNJS hljs styles
    const href = await themeLink.getAttribute('href');
    expect(href).toContain('cdnjs.cloudflare.com/ajax/libs/highlight.js');
  });
});
