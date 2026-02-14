// tests/darkmode-standard.spec.ts
import { test, expect } from '@playwright/test';

// This test checks that the button-variants-demo.html page is in dark mode and uses correct dark mode variables

test.describe('Dark Mode Standard: button-variants-demo.html', () => {
  test('should use data-theme="dark" on html', async ({ page }) => {
    await page.goto('button-variants-demo.html');
    const theme = await page.getAttribute('html', 'data-theme');
    expect(theme).toBe('dark');
  });

  test('should have dark background and light text', async ({ page }) => {
    await page.goto('button-variants-demo.html');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const text = await page.evaluate(() => getComputedStyle(document.body).color);
    const rgb = (str: string) => str.match(/\d+/g)?.map(Number) || [0,0,0];
    const [r, g, b] = rgb(bg);
    const [tr, tg, tb] = rgb(text);
    expect(r + g + b).toBeLessThan(180); // dark bg
    expect(tr + tg + tb).toBeGreaterThan(500); // light text
  });

  test('should use .page class for margins', async ({ page }) => {
    await page.goto('button-variants-demo.html');
    const hasPageClass = await page.evaluate(() => document.body.classList.contains('page'));
    expect(hasPageClass).toBe(true);
    const margin = await page.evaluate(() => getComputedStyle(document.body).margin);
    expect(margin).not.toBe('0px');
  });

  test('should have correct button variants and disabled pattern', async ({ page }) => {
    await page.goto('button-variants-demo.html');
    // Collect all button elements
    const buttons = await page.$$('button');
    // List of expected variants
    const expectedVariants = [
      'primary', 'secondary', 'ghost', 'success', 'danger', 'warning', 'link', 'sm', 'md', 'lg'
    ];
    for (const btn of buttons) {
      const classList = await btn.getAttribute('class');
      // Check for at least one variant
      const hasVariant = expectedVariants.some(v => classList.includes(`wb-button--${v}`));
      expect(hasVariant).toBe(true);
      // Disabled pattern: should use native disabled attribute
      const isDisabled = await btn.getAttribute('disabled');
      if (classList.includes('Disabled')) {
        expect(isDisabled).not.toBeNull();
      }
    }
    // Check that no unknown variants are used
    for (const btn of buttons) {
      const classList = await btn.getAttribute('class');
      const unknown = classList.match(/wb-button--([a-zA-Z0-9]+)/g)?.filter(v => !expectedVariants.includes(v.replace('wb-button--', '')));
      expect(unknown?.length || 0).toBe(0);
    }
  });

  test('should not use hardcoded or fallback colors', async ({ page }) => {
    await page.goto('button-variants-demo.html');
    // Check computed styles for theme variables
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const color = await btn.evaluate(el => getComputedStyle(el).color);
      const bg = await btn.evaluate(el => getComputedStyle(el).backgroundColor);
      // Should not be pure #fff or #f9fafb or #111827 etc.
      expect(color).not.toMatch(/(255, 255, 255|249, 250, 251|17, 24, 39)/);
      expect(bg).not.toMatch(/(255, 255, 255|249, 250, 251|17, 24, 39)/);
    }
  });
});
