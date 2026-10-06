/**
 * One toast per click (issue #144) — the toast behavior must not double-inject
 * its click listener.
 *
 * The Behaviors page no longer carries fixed toast buttons: it is a catalogue
 * (#666) and an x-toast trigger only exists once a toast row is picked, so the
 * old wait for `[x-badge], [x-toast]` on page load timed out. The test now
 * picks the success row and clicks the trigger it renders -- the same
 * double-injection risk, on the element a reader actually clicks.
 */
import { test, expect, Page } from '../fixtures/offline';

async function loadPage(page: Page) {
  await page.goto('/?page=behaviors');
  await expect(page.locator('.behaviors-search-results__row').first()).toBeVisible({ timeout: 25000 });
  // A query opens the collapsed x-toast group (#995) so its rows can be picked.
  await page.locator('#behaviors-search').fill('x-toast');
  const row = page.locator('.behaviors-search-results__row[data-browse-token="x-toast"][data-variant="success"]').first();
  await row.scrollIntoViewIfNeeded();
  await row.click();
}

test('clicking an x-toast button shows exactly one toast', async ({ page }) => {
  await loadPage(page);
  // #1526: the page writes the schema's name, toastVariant.
  const btn = page.locator('#behaviors-live [x-toast][toastVariant="success"]').first();
  await btn.scrollIntoViewIfNeeded();
  // Lazy runtime (#491): wait for the behavior to have attached.
  await expect(btn).toHaveAttribute('x-ready', '', { timeout: 10000 });
  await btn.click();
  await page.waitForTimeout(250);
  await expect(page.locator('.x-toast--success')).toHaveCount(1);
});
