import { test, expect } from '@playwright/test';

/**
 * The hand-written before/after code comparisons in the button demos must render
 * VERTICAL (stacked, one tag per line via white-space: pre) and IN COLOR
 * (syntax-highlighted via the page's local highlight.js + theme variables — the
 * blocks aren't WB-managed). Guards a horizontal relapse or plain-text code.
 */
const DEMOS = [
  '/demos/button-composition-demo.html',
  '/demos/button-variants-tags-demo.html',
];

test.describe('button demos: comparison code is vertical + highlighted', () => {
  for (const url of DEMOS) {
    test(`${url}: .wb-compare stacks vertically and every code block is colored`, async ({ page }) => {
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const compare = page.locator('.wb-compare').first();
      await expect(compare).toBeVisible({ timeout: 15000 });
      expect(
        await compare.evaluate((el) => getComputedStyle(el).flexDirection),
        'comparison must stack vertically'
      ).toBe('column');

      // Every comparison code block is highlighted (hljs), not plain text.
      const codes = page.locator('.wb-compare code');
      const n = await codes.count();
      expect(n, 'expected comparison code blocks').toBeGreaterThan(0);
      await expect(codes.first()).toHaveClass(/hljs/, { timeout: 15000 });
      for (let i = 0; i < n; i++) {
        await expect(codes.nth(i), `code block ${i} must be highlighted`).toHaveClass(/hljs/);
      }

      // Real tokens (tag / attr / string colored differently), not one blob.
      expect(
        await codes.first().locator('span[class*="hljs-"]').count(),
        'code should be tokenized into colored spans'
      ).toBeGreaterThan(2);

      // Vertical formatting + Standard §6: line breaks preserved AND it wraps —
      // no horizontal scrollbar on any comparison code block. Self-diagnosing:
      // the failure message names the offending block, its widths, and computed
      // styles (Linux CI fonts/metrics differ from local Windows — #271).
      const offenders = await page.$$eval('.wb-compare pre', (els) =>
        els
          .map((el, i) => {
            const cs = getComputedStyle(el);
            return {
              i,
              scrollWidth: el.scrollWidth,
              clientWidth: el.clientWidth,
              whiteSpace: cs.whiteSpace,
              overflowWrap: cs.overflowWrap,
              fontFamily: cs.fontFamily.slice(0, 40),
              sample: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70),
            };
          })
          .filter((x) => x.scrollWidth > x.clientWidth + 2)
      );
      expect(
        offenders,
        `comparison code blocks that horizontally scroll:\n${JSON.stringify(offenders, null, 2)}`
      ).toEqual([]);
    });
  }
});
