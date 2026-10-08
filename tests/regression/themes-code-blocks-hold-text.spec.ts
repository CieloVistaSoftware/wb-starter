import { test, expect } from '../fixtures/offline';

/**
 * #1735 -- the Themes page's code listings must be text, not markup.
 *
 * ?page=themes logged highlight.js's "One of your code blocks includes
 * unescaped HTML. This is a potentially serious security risk." three times
 * (src/lib/highlight.js:265). The three "How to Use Themes" cards were written
 * <code language="…"><code>…escaped text…</code></code>: the text was escaped,
 * but it sat inside a second, live <code> element, and highlight.js warns
 * whenever the block it highlights has child elements. Each listing is now the
 * block's own text.
 *
 * See it by hand: open ?page=themes with the devtools console open and scroll
 * to "How to Use Themes". Before: three "unescaped HTML" warnings. Now: none,
 * and the three listings are still highlighted.
 */

test('Themes page code listings highlight with no unescaped-HTML warning', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', (m) => { if (/unescaped HTML/i.test(m.text())) warnings.push(m.text()); });

  await page.goto('/?page=themes', { waitUntil: 'domcontentloaded' });
  const blocks = page.locator('#autogen-themes-html-3 code[language]');
  await expect(blocks).toHaveCount(3, { timeout: 30000 });
  await blocks.first().scrollIntoViewIfNeeded();

  // highlightElement() warns BEFORE it highlights, so once all three carry
  // highlight.js's own done-marker every warning they could cause is logged.
  for (let i = 0; i < 3; i++) {
    await expect(blocks.nth(i)).toHaveAttribute('data-highlighted', 'yes', { timeout: 15000 });
  }

  expect(warnings, 'a highlighted block held live elements').toEqual([]);
  await expect(blocks.nth(0)).toContainText('<html data-theme="ocean">');
  await expect(blocks.nth(1)).toContainText(".setAttribute('data-theme', 'cyberpunk');");
  await expect(blocks.nth(2)).toContainText('background: var(--bg-secondary);');
});
