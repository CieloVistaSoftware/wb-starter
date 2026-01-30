/**
 * Issue: note-1769469912373-p0
 * Title: code sections not colored (use mdhtml)
 * Goal: verify that article/code examples render via `wb-mdhtml` and get syntax highlighting / <pre><code> content.
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769469912373-p0 — mdhtml code rendering + highlighting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/articles/resilience-through-separation.html');
    await page.waitForLoadState('networkidle');
  });

  test('code blocks render and are syntax-highlighted', async ({ page }) => {
    const md = page.locator('wb-mdhtml, [data-wb="mdhtml"]');
    await expect(md).toHaveCountGreaterThan(0);
    const pre = md.locator('pre');
    await expect(pre).toHaveCountGreaterThan(0);

    const code = pre.locator('code');
    await expect(code).toHaveCountGreaterThan(0);
    // ensure some expected token from the article's code appears
    await expect(code.first()).toContainText('class');
    // highlight.js adds language-specific classes or <span> tokens — assert presence
    const highlighted = code.locator('span[class^="hljs"], .hljs');
    const hlCount = await highlighted.count().catch(() => 0);
    expect(hlCount).toBeGreaterThan(0);
  });
});