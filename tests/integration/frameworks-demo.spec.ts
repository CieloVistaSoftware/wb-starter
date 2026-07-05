import { test, expect } from '@playwright/test';

/**
 * #241 — frameworks.html code examples must be syntax-highlighted (theme colors)
 * and have a copy button. They shipped as plain, uncolored monospace text because
 * the `language="…"` / `copy="true"` shorthand on <pre> never mapped to a
 * highlighter. The page now highlights them directly (local highlight.js +
 * theme-variable colors) and adds a copy button per block.
 */
test.describe('frameworks demo: code examples highlighted + copyable (#241)', () => {
  test('every pre[language] block is highlighted, vertical, and has a copy button', async ({ page }) => {
    await page.goto('/demos/frameworks.html', { waitUntil: 'domcontentloaded' });

    const pres = page.locator('pre[language]');
    const n = await pres.count();
    expect(n, 'expected the framework code-example blocks').toBeGreaterThanOrEqual(6);

    // Every inner <code> is highlighted (hljs), not plain text.
    const codes = page.locator('pre[language] code');
    await expect(codes.first()).toHaveClass(/hljs/, { timeout: 15000 });
    for (let i = 0; i < n; i++) {
      await expect(codes.nth(i), `code block ${i} must be highlighted`).toHaveClass(/hljs/);
    }

    // Real tokens (colored spans), not one blob.
    expect(
      await codes.first().locator('span[class*="hljs-"]').count(),
      'code should be tokenized into colored spans'
    ).toBeGreaterThan(2);

    // A copy button on every block.
    expect(await page.locator('pre[language] .code-copy-btn').count()).toBe(n);

    // Standard §6: code wraps — no horizontal scrollbar on any block.
    const scrollers = await page.$$eval('pre[language]', (els) =>
      els.filter((el) => el.scrollWidth > el.clientWidth + 2).length
    );
    expect(scrollers, 'no pre[language] block may horizontally scroll').toBe(0);
  });
});
