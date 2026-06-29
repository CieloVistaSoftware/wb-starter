/**
 * #183 — showcase code blocks must render like a code editor (highlight.js syntax
 * tokens, monospace, dark theme), not raw text.
 *
 * The breakage was a side effect of the wb-demo disconnect crash (#174/#175) which
 * tore down rendering, plus the missing highlight theme. This regression test locks
 * the working state: every demo code block is highlighted.
 */
import { test, expect } from '@playwright/test';

test.describe('#183 — code blocks highlight', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/?page=behaviors');
    await page.waitForSelector('#mainPage-behaviors', { timeout: 20000 });
    await page.waitForTimeout(2500); // demo build + highlight.js
  });

  test('demo code blocks carry the hljs class and token spans', async ({ page }) => {
    const r = await page.evaluate(() => {
      const blocks = [...document.querySelectorAll('pre code, code.language-html')];
      const highlighted = blocks.filter((c) => c.classList.contains('hljs'));
      const withTokens = highlighted.filter((c) => c.querySelector('[class^="hljs-"]'));
      return { total: blocks.length, highlighted: highlighted.length, withTokens: withTokens.length };
    });
    expect(r.total, 'no code blocks on showcase').toBeGreaterThan(5);
    expect(r.highlighted, 'code blocks not highlighted (no hljs class)').toBeGreaterThan(5);
    expect(r.withTokens, 'highlighted blocks have no syntax token spans').toBeGreaterThan(5);
  });

  test('code blocks render in a monospace font (editor-like)', async ({ page }) => {
    const font = await page.evaluate(() => {
      const c = document.querySelector('pre code.hljs, code.hljs') as HTMLElement;
      return c ? getComputedStyle(c).fontFamily.toLowerCase() : 'NONE';
    });
    expect(font).not.toBe('NONE');
    expect(font, `code font is not monospace: ${font}`).toMatch(/mono|consolas|menlo|courier/);
  });

  test('highlight theme stylesheet is loaded', async ({ page }) => {
    const loaded = await page.evaluate(() =>
      [...document.styleSheets].some((s) => /highlight|atom-one|hljs/i.test(s.href || ''))
    );
    expect(loaded, 'no highlight.js theme stylesheet loaded').toBe(true);
  });
});
