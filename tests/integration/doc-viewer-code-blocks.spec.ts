import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#195): doc-viewer code blocks must render like an editor —
 * white-space: pre with horizontal scroll — NOT wrapped mid-line.
 *
 * The doc-viewer previously forced `white-space: pre-wrap !important` on code
 * (from #147/#150), so long lines wrapped mid-token and lost their formatting.
 * Editor-style preserves formatting and scrolls horizontally instead.
 */
test('doc-viewer code blocks are editor-style (white-space: pre + horizontal scroll) (#195)', async ({ page }) => {
  await page.goto('/public/doc-viewer.html?file=docs/V3-GUIDE.md', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector('#content pre code'), { timeout: 20000 });

  const r = await page.evaluate(() => {
    const code = document.querySelector('#content pre code') as HTMLElement;
    const pre = code.closest('pre') as HTMLElement;
    return {
      codeWS: getComputedStyle(code).whiteSpace,
      preWS: getComputedStyle(pre).whiteSpace,
      preOverflowX: getComputedStyle(pre).overflowX,
    };
  });

  // white-space: pre (or pre-line variants collapse to "pre" here) — never pre-wrap.
  expect(r.codeWS, 'code must be white-space:pre, not wrapped').toBe('pre');
  expect(r.preWS, 'pre must be white-space:pre').toBe('pre');
  expect(['auto', 'scroll'], `pre must scroll horizontally (got overflow-x:${r.preOverflowX})`).toContain(r.preOverflowX);
});
