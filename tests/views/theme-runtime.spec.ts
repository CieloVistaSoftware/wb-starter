import { test, expect } from '@playwright/test';

test.describe('theme runtime (CSS-first contract)', () => {
  test('Theme.get() prefers CSS-derived dark on first paint and does not let persisted light win', async ({ page }) => {
    // Ensure a persisted light value exists (simulate user previously choosing light)
    await page.addInitScript(() => { try { localStorage.setItem('wb-theme', 'light'); } catch(e){} });

    // Navigate to a demo that includes site.css
    await page.goto('/demos/wb-page-demo.html');
    await page.waitForLoadState('domcontentloaded');

    // 1) runtime API: import theme module in-page and call Theme.get()
    const theme = await page.evaluate(async () => {
      const mod = await import('/src/core/theme.js');
      return mod.Theme.get();
    });

    expect(theme).toBe('dark');

    // 2) ensure computed token matches the dark token (first-paint contract)
    const bg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim());
    expect(bg).toContain('10%');

    // 3) ensure the persisted 'light' value did not cause first-paint lightness
    const htmlAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(htmlAttr === null || htmlAttr === 'dark').toBeTruthy();

    // cleanup
    await page.evaluate(() => { try { localStorage.removeItem('wb-theme'); } catch(e){} });
  });
});