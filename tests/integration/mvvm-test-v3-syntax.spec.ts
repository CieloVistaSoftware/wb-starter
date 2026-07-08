import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * #235: src/core/mvvm-test.html had two "data-wb Attribute" comparison
 * boxes left over from pre-v3 — not just stale wording, but literally
 * malformed HTML: `<wb-card title="…"` missing its closing `>`, closed
 * with a mismatched `</article>`. Replaced with "Generated DOM" output
 * boxes (dom-output-1/dom-output-3), matching the pattern already used by
 * the other card examples on this page.
 */
test.describe('src/core/mvvm-test.html uses v3 syntax (#235)', () => {
  test('no data-wb legacy attribute anywhere in the file', () => {
    const html = fs.readFileSync(path.join(process.cwd(), 'src/core/mvvm-test.html'), 'utf8');
    expect(html).not.toContain('data-wb');
  });

  test('page loads, schema builder initializes, and the two fixed examples render real generated DOM', async ({ page }) => {
    await page.goto('/src/core/mvvm-test.html', { waitUntil: 'networkidle' });
    await expect(page.locator('#status')).toContainText('ready', { timeout: 15000 });

    const dom1 = page.locator('#dom-output-1');
    const dom3 = page.locator('#dom-output-3');
    await expect(dom1).not.toContainText('Loading...', { timeout: 5000 });
    await expect(dom3).not.toContainText('Loading...', { timeout: 5000 });
    await expect(dom1).toContainText('wb-card');
    await expect(dom3).toContainText('wb-card');
  });
});
