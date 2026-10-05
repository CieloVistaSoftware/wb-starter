/**
 * #1240 -- John, on a behavior doc's "Schema: button.schema.json" link:
 * "Ensure these show the schema in color coded format. Not just plain text."
 *
 * The link opened the raw .json file. The doc viewer now rewrites a .json
 * link to open in itself, and shows a .json file as a ```json block that its
 * highlighting pass colours: keys, strings, numbers and literals each carry
 * highlight.js token classes, in the light and the dark theme.
 */
import { test, expect } from '../fixtures/offline';

for (const theme of ['light', 'dark']) {
  test(`a doc's Schema link opens colour-coded JSON (${theme})`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('x-theme', t), theme);
    await page.goto('/public/doc-viewer.html?file=docs/behaviors/button.md');
    const link = page.locator('#content a', { hasText: 'button.schema.json' }).first();
    await expect(link).toBeVisible({ timeout: 15_000 });
    // A real viewer URL, so a new tab or a copied link shows it too.
    await expect(link).toHaveAttribute('href', /public\/doc-viewer\.html\?file=src%2Fwb-models%2Fbutton\.schema\.json$/);

    await link.click();
    await expect(page).toHaveURL(/file=src%2Fwb-models%2Fbutton\.schema\.json/);
    const code = page.locator('#content pre code.language-json');
    await expect(code).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#content h1')).toHaveText('button.schema.json');

    // Highlighted, not one plain text node: keys and strings are tokens...
    await expect(code.locator('.hljs-attr').first()).toBeVisible();
    await expect(code.locator('.hljs-string').first()).toBeVisible();
    expect(await code.locator('.hljs-attr').count()).toBeGreaterThan(10);
    // ...and a key is coloured differently from a string in this theme.
    const colour = (sel: string) => code.locator(sel).first().evaluate((el) => getComputedStyle(el).color);
    expect(await colour('.hljs-attr')).not.toBe(await colour('.hljs-string'));
  });
}
