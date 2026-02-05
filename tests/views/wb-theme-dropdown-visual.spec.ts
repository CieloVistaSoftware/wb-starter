import { test, expect } from '@playwright/test';

test.describe('wb-theme-dropdown visual changes', () => {
  test('theme change updates background color', async ({ page }) => {
    page.on('console', msg => console.log(`[Browser] ${msg.type()}: ${msg.text()}`));

    await page.goto('/demos/wb-page-demo.html', { waitUntil: 'networkidle' });

    // Wait for theme-dropdown to initialize
    await page.waitForFunction(() => {
      const el = document.querySelector('wb-theme-dropdown');
      return el && el.dataset.wbReady?.includes('theme-dropdown');
    }, { timeout: 10000 });

    const html = page.locator('html');
    const body = page.locator('body');
    const select = page.locator('wb-theme-dropdown select');

    // Get initial background color (should be dark)
    const initialTheme = await html.getAttribute('data-theme');
    console.log('[Test] Initial theme:', initialTheme);
    
    const initialBgColor = await body.evaluate(el => getComputedStyle(el).backgroundColor);
    console.log('[Test] Initial body background:', initialBgColor);

    // Change to light theme
    await select.selectOption('light');
    
    // Verify attribute changed
    const newTheme = await html.getAttribute('data-theme');
    console.log('[Test] New theme:', newTheme);
    expect(newTheme).toBe('light');

    // Wait a tick for CSS to recompute
    await page.waitForTimeout(100);

    // Get new background color
    const newBgColor = await body.evaluate(el => getComputedStyle(el).backgroundColor);
    console.log('[Test] New body background:', newBgColor);

    // The colors MUST be different
    expect(newBgColor).not.toBe(initialBgColor);

    // Light theme should have a light background (close to white)
    // rgb(255, 255, 255) or similar
    const match = newBgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      console.log('[Test] RGB values:', r, g, b);
      // Light theme bg should be bright (> 200 for each channel)
      expect(r).toBeGreaterThan(200);
      expect(g).toBeGreaterThan(200);
      expect(b).toBeGreaterThan(200);
    }
  });
});
