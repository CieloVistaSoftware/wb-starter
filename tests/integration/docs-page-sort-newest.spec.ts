import { test, expect } from '../fixtures/offline';
import { readFileSync } from 'fs';

/**
 * The Docs page opens newest first. Every entry in docs/manifest.json carries
 * a `modified` date (its last commit, kept current by
 * scripts/update-docs-manifest.js), the list renders as one section sorted by
 * that date, and the "Sort documents" control switches to the grouped view.
 * The reader's pick is remembered and kept in ?sort=.
 */
const manifest = JSON.parse(readFileSync('docs/manifest.json', 'utf-8'));
const entries = manifest.categories.flatMap(
  (c: { docs?: object[]; pages?: object[] }) => [...(c.docs || []), ...(c.pages || [])]
) as Array<{ title: string; modified?: string }>;

test('every docs/manifest.json entry carries a YYYY-MM-DD modified date', () => {
  const undated = entries.filter((e) => !/^\d{4}-\d{2}-\d{2}$/.test(e.modified || ''));
  expect(undated.map((e) => e.title)).toEqual([]);
});

test('the Docs page opens newest first and the sort control switches to by-category', async ({ page }) => {
  await page.goto('/?page=docs', { waitUntil: 'domcontentloaded' });
  const sort = page.locator('#docs-sort');
  const headings = page.locator('#docs-container .docs-category__title');
  const metas = page.locator('#docs-container .docs-card__meta');

  await expect(sort).toHaveValue('newest');
  await expect(headings).toHaveCount(1);
  await expect(headings.first()).toContainText('Newest first');
  await expect(page.locator('#docs-container .docs-card')).toHaveCount(entries.length);

  const dates = (await metas.allTextContents()).map((t) => (t.match(/\d{4}-\d{2}-\d{2}/) || [''])[0]);
  expect(dates).toEqual([...dates].sort().reverse());
  expect(dates[0]).toBe(entries.map((e) => e.modified || '').sort().reverse()[0]);

  await sort.selectOption('category');
  await expect(headings).toHaveCount(manifest.categories.length);
  await expect(page).toHaveURL(/[?&]sort=category/);

  // Remembered: a fresh visit without ?sort= keeps the reader's pick.
  await page.goto('/?page=docs', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#docs-sort')).toHaveValue('category');
  await expect(headings).toHaveCount(manifest.categories.length);
});
