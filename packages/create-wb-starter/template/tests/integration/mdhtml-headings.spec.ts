import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#226 follow-on): mdhtml must render markdown headings as real
 * <h1>–<h6> elements.
 *
 * marked v5+ calls renderer.heading(token) with a single token object; the old
 * override read a non-existent `level` argument and emitted `<h${undefined}>` —
 * i.e. `<hundefined>` tags — so every doc rendered with broken, unstyled
 * headings. This guards the token-aware renderer.
 */
test('doc-viewer renders real heading tags, never <hundefined> (#226)', async ({ page }) => {
  await page.goto('/public/doc-viewer.html?file=docs/index.md', { waitUntil: 'domcontentloaded' });

  // Wait for markdown to render into #content.
  await page.waitForFunction(
    () => {
      const c = document.getElementById('content');
      return !!c && c.querySelectorAll('h1, h2, h3, hundefined').length > 0;
    },
    { timeout: 20000 }
  );

  const counts = await page.evaluate(() => {
    const c = document.getElementById('content')!;
    return {
      hundefined: c.querySelectorAll('hundefined').length,
      realHeadings: c.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
      firstH1: c.querySelector('h1')?.textContent?.trim() || null,
    };
  });

  expect(counts.hundefined, 'found <hundefined> tags — heading renderer used the wrong marked signature').toBe(0);
  expect(counts.realHeadings, 'expected real <h1>–<h6> headings in the rendered doc').toBeGreaterThan(0);
  expect(counts.firstH1).toBeTruthy();
});
