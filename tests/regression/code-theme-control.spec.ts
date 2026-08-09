import { test, expect } from '@playwright/test';

/**
 * pages/themes.html previously had no code-theme control at all -- the
 * only existing one, <wb-codecontrol> (src/wb-viewmodels/codecontrol.js,
 * 48 real highlight.js syntax themes across Dark/Light/Minimal/Special
 * categories, already fully wired into tag-map.js/index.js), was only ever
 * placed on demos/site/content.html, a sandbox page nobody visits in
 * normal navigation -- effectively invisible. Moved the real control onto
 * the Themes page instead of building a new, weaker one.
 *
 * codecontrol swaps highlight.js's actual per-token stylesheet
 * (<link data-highlight-theme>), which is what governs the .hljs-* classes
 * code.js's hljs.highlightElement() call produces on syntax-highlighted
 * <code> blocks -- a real theme switch, not just two flat CSS variables.
 */
test.describe('wb-codecontrol on the Themes page swaps real highlight.js syntax themes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=themes', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('wb-codecontrol', { timeout: 20000 });
    await page.waitForTimeout(500);
  });

  test('the dropdown lists all 49 themes grouped into the 4 documented categories', async ({ page }) => {
    const select = page.locator('wb-codecontrol .x-codecontrol__select');
    const optgroups = select.locator('optgroup');
    await expect(optgroups).toHaveCount(4);

    const labels = await optgroups.evaluateAll((els) => els.map((el) => el.getAttribute('label')));
    expect(labels.sort()).toEqual(['Dark', 'Light', 'Minimal', 'Special'].sort());

    const options = select.locator('option');
    await expect(options).toHaveCount(49);
  });

  test('selecting a theme swaps the highlight.js stylesheet and persists it', async ({ page }) => {
    const select = page.locator('wb-codecontrol .x-codecontrol__select');
    const themeLink = page.locator('link[data-highlight-theme]');

    await select.selectOption('github-dark');
    await page.waitForTimeout(200);

    await expect(themeLink).toHaveAttribute('href', /github-dark\.min\.css/);

    const stored = await page.evaluate(() => localStorage.getItem('x-code-theme'));
    expect(stored).toBe('github-dark');
  });

  test('selecting Default resets to highlight.js\'s own baseline theme', async ({ page }) => {
    const select = page.locator('wb-codecontrol .x-codecontrol__select');
    const themeLink = page.locator('link[data-highlight-theme]');

    await select.selectOption('monokai');
    await page.waitForTimeout(200);
    await select.selectOption('default');
    await page.waitForTimeout(200);

    await expect(themeLink).toHaveAttribute('href', /\/default\.min\.css/);

    const stored = await page.evaluate(() => localStorage.getItem('x-code-theme'));
    expect(stored).toBe('default');
  });

  test('the sample code block is actually syntax-tokenized (hljs ran)', async ({ page }) => {
    const codeBlock = page.locator('#themes-code-colors code').first();
    const tokenCount = await codeBlock.locator('[class^="hljs-"]').count();
    expect(tokenCount, 'expected hljs.highlightElement() to have produced real .hljs-* token spans').toBeGreaterThan(0);
  });
});
