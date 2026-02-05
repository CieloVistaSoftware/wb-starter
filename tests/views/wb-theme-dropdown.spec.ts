import { test, expect } from '@playwright/test';

test.describe('wb-theme-dropdown visibility', () => {
  test('theme dropdown is visible and functional', async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => console.log(`[Browser] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[Browser Error]`, err));

    await page.goto('/demos/wb-page-demo.html', { waitUntil: 'networkidle' });

    // Wait for WB to initialize
    await page.waitForFunction(() => {
      const el = document.querySelector('wb-theme-dropdown');
      return el && el.dataset.wbReady?.includes('theme-dropdown');
    }, { timeout: 10000 }).catch(() => {
      // If timeout, continue to diagnose
    });

    // Check the wb-theme-dropdown element exists
    const themeDropdown = page.locator('wb-theme-dropdown');
    await expect(themeDropdown).toBeAttached();

    // Check if the select dropdown was created inside
    const select = themeDropdown.locator('select.wb-theme-dropdown__select');
    const selectVisible = await select.isVisible().catch(() => false);
    
    if (!selectVisible) {
      // Debug: log what's inside the element
      const innerHTML = await themeDropdown.innerHTML();
      console.log('[Debug] wb-theme-dropdown innerHTML:', innerHTML);
      
      const wbReady = await themeDropdown.getAttribute('data-wb-ready');
      console.log('[Debug] data-wb-ready:', wbReady);
      
      const classList = await themeDropdown.evaluate(el => el.className);
      console.log('[Debug] classList:', classList);
    }

    // The select MUST be visible
    await expect(select).toBeVisible({ timeout: 5000 });

    // Verify it has theme options
    const optionCount = await select.locator('option').count();
    expect(optionCount).toBeGreaterThan(5);

    // Verify current value is 'dark' (page default)
    const currentValue = await select.inputValue();
    expect(currentValue).toBe('dark');

    // Test theme switching works
    await select.selectOption('ocean');
    const theme = await page.locator('html').getAttribute('data-theme');
    expect(theme).toBe('ocean');
  });
});
