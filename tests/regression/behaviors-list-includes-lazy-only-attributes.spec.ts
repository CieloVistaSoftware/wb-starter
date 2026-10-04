import { test, expect } from '../fixtures/offline';

/**
 * #1056 -- the Behaviors list offers every behavior the runtime knows.
 *
 * There are TWO attribute registries: tag-map.js's extensionMap and wb-lazy.js's
 * WB_LAZY_ONLY_ATTRIBUTES (behaviors that resolve only through the lazy runtime).
 * pages/behaviors.html built its list from tag-map alone, so 35 working
 * behaviors had no row on the page meant to show them all. The page now merges
 * both; this holds it -- every lazy-only attribute must have a row.
 */
const LIST = '#behaviors-search-results';
const ROW = '.behaviors-search-results__row';

test('every WB_LAZY_ONLY_ATTRIBUTES behavior has a row on the Behaviors page', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.locator(`${LIST} ${ROW}`).count(), { timeout: 30_000 }).toBeGreaterThan(100);

  const { lazyOnly, tokens } = await page.evaluate(async ({ LIST, ROW }) => {
    const mod: any = await import('/src/core/wb-lazy.js');
    const lazyOnly = Object.keys(mod.WB_LAZY_ONLY_ATTRIBUTES || {});
    const tokens = new Set(
      Array.from(document.querySelectorAll(`${LIST} ${ROW}`)).map((r) => (r as HTMLElement).dataset.browseToken || ''),
    );
    return { lazyOnly, tokens: Array.from(tokens) };
  }, { LIST, ROW });

  expect(lazyOnly.length, 'WB_LAZY_ONLY_ATTRIBUTES is empty -- the registry moved or the import failed').toBeGreaterThan(10);
  const have = new Set(tokens);
  const missing = lazyOnly.filter((attr) => !have.has(attr));
  expect(missing, 'behaviors the lazy runtime resolves but the Behaviors page does not list').toEqual([]);
});
