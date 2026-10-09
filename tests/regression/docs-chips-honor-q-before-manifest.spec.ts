import { test, expect } from '../fixtures/offline';

/**
 * The behavior chips above the docs list honour ?q= even when they are built
 * before the docs manifest arrives.
 *
 * pages/docs.html puts ?q= into #docs-search only after docs/manifest.json
 * loads, but the chip block filters once, when it is built, from whatever the
 * box holds then. When the chips won that race they read an empty box and
 * showed every chip unfiltered: doc-viewer-back-restores-docs-list.spec.ts
 * failed on CI with 189 non-matching chips (#1811). Here the manifest is held
 * until the chips are built, so the losing order is the one under test.
 */
test.use({ serviceWorkers: 'block' }); // #1349: this spec holds a request with page.route

test('chips built before the manifest loads still apply ?q=', async ({ page }) => {
  let open!: () => void;
  const gate = new Promise<void>((r) => { open = r; });
  await page.route('**/docs/manifest.json*', async (route) => { await gate; await route.continue(); });

  await page.goto('/?page=docs&q=behavior');
  const sections = page.locator('#behaviors-sections');
  await expect(sections).toHaveAttribute('data-built', '1', { timeout: 20_000 });
  expect(await page.locator('#docs-search').inputValue(), 'the manifest is still held, so the box is not filled yet').toBe('');

  const unfiltered = () => page.$$eval('#behaviors-sections li:not([hidden])',
    (lis) => lis.filter((li) => !(li as HTMLElement).dataset.search?.includes('behavior')).length);
  expect(await unfiltered(), 'chips shown that do not match ?q=').toBe(0);

  open();
  await expect(page.locator('#docs-search')).toHaveValue('behavior');
  expect(await unfiltered(), 'still filtered once the manifest lands').toBe(0);
});
