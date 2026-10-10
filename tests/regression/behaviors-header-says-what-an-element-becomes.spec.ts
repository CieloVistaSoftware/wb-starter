/**
 * THE HEADER SAYS WHICH BEHAVIOR AN ELEMENT BECOMES (#835)
 * ========================================================
 * Picking the semantic `article` row headed the example `article · glass`,
 * while the API and doc panels under it were card's -- and nothing on the page
 * said that <article> becomes card. Schemas now declare it ("kind": "element",
 * "element": "article"), so the header reads `article → card`.
 *
 * Only a semantic row of an element behavior gets the arrow: the attribute row
 * already says `x-card`, and a decorator (x-ripple) becomes nothing.
 */

import { test, expect } from '../fixtures/offline';

const ROW = '.behaviors-search-results__row';
const TOKEN = '#behaviors-live-token';

async function pick(page, selector: string) {
  await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
  const row = page.locator(selector).first();
  await expect(row).toHaveCount(1, { timeout: 30_000 });
  await row.evaluate((el) => (el as HTMLElement).click());
}

test.describe('the live header says which behavior an element becomes (#835)', () => {
  test('a semantic article row reads article → card', async ({ page }) => {
    await pick(page, `${ROW}[data-form="semantic"][data-label="article"]`);
    await expect(page.locator(TOKEN)).toContainText('article → card', { timeout: 15_000 });
  });

  test('the x-card attribute row has no arrow -- it already names the behavior', async ({ page }) => {
    await pick(page, `${ROW}[data-form="attribute"][data-browse-token="x-card"]`);
    await expect(page.locator(TOKEN)).toContainText('x-card', { timeout: 15_000 });
    await expect(page.locator(TOKEN)).not.toContainText('→');
  });

  test('a decorator row has no arrow -- x-ripple is not an element', async ({ page }) => {
    await pick(page, `${ROW}[data-browse-token="x-ripple"]`);
    await expect(page.locator(TOKEN)).toContainText('x-ripple', { timeout: 15_000 });
    await expect(page.locator(TOKEN)).not.toContainText('→');
  });
});
