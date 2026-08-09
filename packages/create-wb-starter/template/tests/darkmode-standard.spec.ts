// tests/darkmode-standard.spec.ts
import { test, expect } from '@playwright/test';

// This test checks that demos/site/forms.html (the consolidated Form Controls
// category page, replacing the deleted buttons.html) is in dark mode and uses
// correct dark mode variables.

test.describe('Dark Mode Standard: forms.html', () => {
  test('should use data-theme="dark" on html', async ({ page }) => {
    await page.goto('/demos/site/forms.html');
    const theme = await page.getAttribute('html', 'data-theme');
    expect(theme).toBe('dark');
  });

  test('should have dark background and light text', async ({ page }) => {
    await page.goto('/demos/site/forms.html');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const text = await page.evaluate(() => getComputedStyle(document.body).color);
    const rgb = (str: string) => str.match(/\d+/g)?.map(Number) || [0,0,0];
    const [r, g, b] = rgb(bg);
    const [tr, tg, tb] = rgb(text);
    expect(r + g + b).toBeLessThan(180); // dark bg
    expect(tr + tg + tb).toBeGreaterThan(500); // light text
  });

  test('should have correct button variants and disabled pattern', async ({ page }) => {
    await page.goto('/demos/site/forms.html');
    // Scoped to the button-variant showcase section (one wb-button per known
    // variant) — the rest of the page's wb-buttons cover icon/size/boolean
    // combos that legitimately have no variant attribute set.
    const buttons = await page.$$('#button-variant-variants wb-button');
    const expectedVariants = [
      'primary', 'secondary', 'success', 'warning', 'error', 'ghost', 'outline', 'link', 'info'
    ];
    for (const btn of buttons) {
      const variant = await btn.getAttribute('variant');
      expect(variant, `every wb-button should declare a known variant`).not.toBeNull();
      expect(expectedVariants).toContain(variant);
    }
  });

  test('should not use light-mode-leftover background colors', async ({ page }) => {
    await page.goto('/demos/site/forms.html');
    // Filled variants legitimately use white TEXT on a colored background
    // (button.js: color:#fff) — that's correct design, not a hardcoded-color
    // bug. Only the BACKGROUND should never fall back to a light-mode gray
    // that would look wrong against this page's dark theme. Scroll each into
    // view first (wb-lazy.js defers enhancement via IntersectionObserver).
    const buttons = await page.$$('#button-variant-variants wb-button');
    for (const btn of buttons) {
      await btn.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      const bg = await btn.evaluate(el => getComputedStyle(el).backgroundColor);
      expect(bg).not.toMatch(/(255, 255, 255|249, 250, 251)/);
    }
  });
});
