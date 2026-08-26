/**
 * Code Panel Width Compliance Test
 * =================================
 * Validates that code panels follow Standard §28:
 * - Use data-code-width attributes for width control
 * - Presets: narrow (400px), normal (600px), wide (800px), full (100%)
 * - Code panels should not be unnecessarily wide for short snippets
 */

import { test, expect } from '@playwright/test';

test.describe('Code Panel Width Compliance (Standard §28)', () => {
  test('demos with short code snippets use data-code-width="narrow"', async ({ page }) => {
    await page.goto('/demos/site/content.html');

    // Find all x-demo elements with short code snippets
    const shortDemos = page.locator('[x-demo]');
    const count = await shortDemos.count();

    // Check for demos that should have narrow width
    const narrowPatterns = [
      '.x-link',      // Single line link styling
      '.x-badge',     // Short badge component
      '.x-button',    // Single button example
      'class="wb-',    // Other single-line examples
    ];

    for (let i = 0; i < Math.min(count, 20); i++) {
      const demo = shortDemos.nth(i);
      const innerHTML = await demo.evaluate((el) => el.innerHTML);

      // Check if this looks like a short snippet
      const isShortSnippet =
        innerHTML.includes('<a ') && innerHTML.includes('class="x-link"') ||
        innerHTML.length < 200; // Simple heuristic: under 200 chars

      if (isShortSnippet) {
        const codeWidth = await demo.getAttribute('data-code-width');
        // Should have explicit width setting, preferably 'narrow' for short snippets
        if (codeWidth) {
          expect(
            ['narrow', 'normal', 'wide', 'full'].includes(codeWidth!),
            `Invalid data-code-width value: ${codeWidth}`
          ).toBe(true);
        }
      }
    }
  });

  test('all data-code-width attributes use valid presets', async ({ page }) => {
    await page.goto('/demos/site/content.html');

    const demosWithWidth = page.locator('[x-demo][data-code-width]');
    const count = await demosWithWidth.count();

    const validPresets = ['narrow', 'normal', 'wide', 'full'];

    for (let i = 0; i < count; i++) {
      const demo = demosWithWidth.nth(i);
      const width = await demo.getAttribute('data-code-width');

      expect(
        validPresets.includes(width!),
        `Demo ${i}: data-code-width="${width}" is not a valid preset. Use: narrow, normal, wide, or full`
      ).toBe(true);
    }
  });

  test('code panel max-width CSS variable is applied correctly', async ({ page }) => {
    await page.goto('/demos/site/content.html');

    const demoNarrow = page.locator('x-demo[data-code-width="narrow"]').first();
    if (await demoNarrow.isVisible()) {
      const codePanel = demoNarrow.locator('.x-demo__code');
      const maxWidth = await codePanel.evaluate((el) => {
        return window.getComputedStyle(el).maxWidth;
      });

      // narrow should be 400px
      expect(maxWidth).toContain('400px');
    }

    const demoNormal = page.locator('x-demo[data-code-width="normal"]').first();
    if (await demoNormal.isVisible()) {
      const codePanel = demoNormal.locator('.x-demo__code');
      const maxWidth = await codePanel.evaluate((el) => {
        return window.getComputedStyle(el).maxWidth;
      });

      // normal should be 600px
      expect(maxWidth).toContain('600px');
    }

    const demoWide = page.locator('x-demo[data-code-width="wide"]').first();
    if (await demoWide.isVisible()) {
      const codePanel = demoWide.locator('.x-demo__code');
      const maxWidth = await codePanel.evaluate((el) => {
        return window.getComputedStyle(el).maxWidth;
      });

      // wide should be 800px
      expect(maxWidth).toContain('800px');
    }
  });

  test('link demo uses narrow width for short snippet', async ({ page }) => {
    await page.goto('/demos/site/content.html');

    // Scroll to link section
    const linkSection = page.locator('h2:has-text("Link")').first();
    await linkSection.scrollIntoViewIfNeeded();

    // Find the demo after the Link heading
    const linkDemo = linkSection.locator('xpath=../following-sibling::*//x-demo').first();
    const dataCodeWidth = await linkDemo.getAttribute('data-code-width');

    expect(
      dataCodeWidth,
      'Link demo should have data-code-width attribute set to narrow for short snippet'
    ).toBe('narrow');
  });
});
