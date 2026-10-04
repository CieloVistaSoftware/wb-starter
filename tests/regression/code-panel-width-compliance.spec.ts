/**
 * Code Panel Width Compliance Test
 * =================================
 * Validates that code panels follow Standard §28:
 * - Use data-code-width attributes for width control
 * - Presets: narrow (400px), normal (600px), wide (800px), full (100%)
 * - Code panels should not be unnecessarily wide for short snippets
 */

import { test, expect } from '../fixtures/offline';

test.describe('Code Panel Width Compliance (Standard §28)', () => {
  // #1092: "demos with short code snippets use data-code-width=narrow" is gone.
  // It looked for CSS selectors ('.x-link', '.x-badge') in each demo's
  // innerHTML, which holds markup (class="x-link"), so no demo ever matched
  // and its one assertion -- that a width, if set, is a valid preset -- never
  // ran. That check is the next test's, over every demo. §28 makes
  // data-code-width optional, so there is no short-snippet rule to enforce.

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

    // #1092: each preset was checked only "if" a demo with that preset was
    // visible. content.html has one (narrow, the Link demo) and none for
    // normal or wide, so two of the three checks never ran. Author one demo per
    // preset, the way a page does, and measure the code panel each one builds.
    // (Switching data-code-width on an already-built demo is not how an author
    // uses it, and it stalled this test.)
    const presets: Array<[string, string]> = [
      ['narrow', '400px'], // narrow should be 400px
      ['normal', '600px'], // normal should be 600px
      ['wide', '800px'],   // wide should be 800px
    ];
    await page.evaluate((list) => {
      for (const [preset] of list) {
        const demo = document.createElement('div');
        demo.setAttribute('x-demo', '');
        demo.setAttribute('columns', '1');
        demo.setAttribute('data-code-width', preset);
        demo.id = `code-width-${preset}`;
        demo.innerHTML = '<a href="#" class="x-link">Styled Link</a>';
        document.body.appendChild(demo);
      }
    }, presets);

    for (const [preset, expected] of presets) {
      const demo = page.locator(`#code-width-${preset}`);
      // x-demo builds its code panel when it nears the viewport.
      await demo.scrollIntoViewIfNeeded();
      const codePanel = demo.locator('.x-demo__code');
      await expect(codePanel, `the ${preset} demo never built its code panel`).toBeAttached({ timeout: 15000 });
      const maxWidth = await codePanel.evaluate((el) => window.getComputedStyle(el).maxWidth);
      expect(maxWidth, `data-code-width="${preset}" code panel max-width`).toContain(expected);
    }
  });

  test('link demo uses narrow width for short snippet', async ({ page }) => {
    await page.goto('/demos/site/content.html');

    // Scroll to link section
    const linkSection = page.locator('h2:has-text("Link")').first();
    await linkSection.scrollIntoViewIfNeeded();

    // Find the demo after the Link heading. `[x-demo]`, not `//x-demo`: the
    // <x-demo> tag went away in 4.0.0, so the XPath matched nothing and the
    // getAttribute below waited out the whole test timeout.
    const linkDemo = linkSection.locator('xpath=following-sibling::*[1]').locator('[x-demo]').first();
    const dataCodeWidth = await linkDemo.getAttribute('data-code-width');

    expect(
      dataCodeWidth,
      'Link demo should have data-code-width attribute set to narrow for short snippet'
    ).toBe('narrow');
  });
});
