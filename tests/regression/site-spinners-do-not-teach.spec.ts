/**
 * wb-starter's own spinners are not "nothing was given" (#1309).
 *
 * John's console on the live site showed "[WB] spinner: nothing was given, so
 * it is showing the curated example" three times. That hint is for a site
 * author who wrote a bare behavior; it fired on our own markup: the
 * page-loading spinner site-engine builds on every navigation, and the bare
 * spinners on the docs and themes pages. Each now carries a label, which is
 * its accessible name and also means the author gave something.
 */
import { test, expect } from '../fixtures/offline';

for (const pageId of ['home', 'docs', 'themes']) {
  test(`?page=${pageId} logs no teach-by-example hint for a spinner`, async ({ page }) => {
    const hints: string[] = [];
    page.on('console', (m) => { if (m.text().includes('spinner: nothing was given')) hints.push(m.text()); });

    await page.goto(`/?page=${pageId}`);
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
    // Spinners build lazily as they come into view; bring each one in.
    for (const spinner of await page.locator('[x-spinner]').all()) {
      await spinner.scrollIntoViewIfNeeded().catch(() => {});
    }
    await page.waitForTimeout(1000);

    expect(hints).toEqual([]);
    await expect(page.locator('[x-teaching-example="spinner"]')).toHaveCount(0);
  });
}
