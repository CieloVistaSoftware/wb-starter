import { test, expect } from '@playwright/test';

/**
 * Standard §6 (#248): doc-viewer code blocks WRAP — they never show a horizontal
 * scrollbar. This supersedes the earlier #195 "editor-style horizontal scroll"
 * decision; the project standard is now "no horizontal scrollbars on code", so
 * long lines wrap. Line breaks are still preserved (pre-wrap), so multi-line code
 * stays multi-line (guarded separately by doc-viewer-code-multiline.spec.ts).
 */
test('doc-viewer code blocks wrap — no horizontal scrollbar (§6, supersedes #195)', async ({ page }) => {
  await page.goto('/public/doc-viewer.html?file=docs/V3-GUIDE.md', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector('#content pre code'), { timeout: 20000 });

  const r = await page.evaluate(() => {
    const pres = Array.from(document.querySelectorAll('#content pre')) as HTMLElement[];
    return {
      count: pres.length,
      allWrap: pres.every((p) => getComputedStyle(p).whiteSpace === 'pre-wrap'),
      scrollers: pres.filter((p) => p.scrollWidth > p.clientWidth + 2).length,
    };
  });

  expect(r.count, 'expected code blocks in the doc').toBeGreaterThan(0);
  expect(r.allWrap, 'code blocks must wrap (white-space: pre-wrap)').toBe(true);
  expect(r.scrollers, 'no doc-viewer code block may horizontally scroll').toBe(0);
});
