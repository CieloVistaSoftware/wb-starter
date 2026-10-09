/**
 * THE BEHAVIORS LIST SAYS WHAT EACH BEHAVIOR DOES (#286)
 * =====================================================
 * #286: "The Behaviors page should open with a reference table of every x-*
 * behavior and what it does -- so a developer can scan the full vocabulary at
 * a glance before the demos."
 *
 * The page already lists every registered behavior (#666, #1056), but each line
 * showed only a name and an option. What the behavior does appeared only after
 * clicking it. Now every behavior's line carries its schema's description,
 * under the name: on a single-option row, inside the row; on a group of
 * options, under the collapsed group's name.
 *
 * The expected text is derived at run time from the registries and
 * data/schema-index.json, never listed here, so a behavior added tomorrow is
 * checked the same way.
 *
 * See it by hand: open /?page=behaviors. Before: names and options only. Now:
 * each behavior has a one-line description under its name.
 */
import fs from 'fs';
import { test, expect } from '../fixtures/offline';

async function expectedDescriptions(): Promise<Map<string, string>> {
  const tag = await import(new URL('../../src/core/tag-map.js', import.meta.url).href);
  let lazy: Record<string, unknown> = {};
  try {
    lazy = await import(new URL('../../src/core/wb-lazy.js', import.meta.url).href);
  } catch { /* the page tolerates this too */ }
  const registry: Record<string, string> = {
    ...((lazy as { WB_LAZY_ONLY_ATTRIBUTES?: Record<string, string> }).WB_LAZY_ONLY_ATTRIBUTES || {}),
    ...tag.extensionMap,
  };
  const index = JSON.parse(fs.readFileSync('data/schema-index.json', 'utf8'));
  const byName = new Map<string, string>(
    index.schemas.map((s: { name: string; description?: string }) => [s.name, String(s.description || '').trim()]));
  const out = new Map<string, string>();
  for (const [attr, behavior] of Object.entries(registry)) {
    const d = byName.get(behavior);
    if (d) out.set(attr, d);
  }
  return out;
}

test('every behavior with a schema shows what it does on its line, at rest', async ({ page, baseURL }) => {
  test.slow();
  const expected = await expectedDescriptions();
  expect(expected.size, 'no behavior resolved to a described schema -- the derivation is broken').toBeGreaterThan(100);

  await page.goto(`${baseURL}/?page=behaviors`, { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.locator('.behaviors-search-results__row').count(), { timeout: 30_000 }).toBeGreaterThan(100);

  // One entry per behavior line: a top-level <li>, holding either a row or a group.
  const lines = await page.evaluate(() =>
    [...document.querySelectorAll('#behaviors-search-results > li, .behaviors-search-results > li')].map((li) => {
      const token = (li.querySelector('[data-browse-token]') as HTMLElement | null)?.dataset.browseToken || '';
      const desc = li.querySelector(':scope > .behaviors-search-results__row > .behaviors-search-results__desc, :scope > .behaviors-search-results__desc');
      const shown = !!desc && (desc as HTMLElement).offsetParent !== null && (desc as HTMLElement).getBoundingClientRect().height > 0;
      // The selected behavior's group opens on load; an open group's line steps aside.
      const open = !!li.querySelector(':scope > details[open]');
      return { token, text: desc ? (desc.textContent || '').trim() : '', shown, open };
    }));
  expect(lines.length).toBeGreaterThan(100);

  const wrong = lines
    .filter((l) => expected.has(l.token))
    .filter((l) => l.text !== expected.get(l.token) || l.shown === l.open)
    .map((l) => `${l.token}${l.open ? ' (open)' : ''}: ${l.shown ? 'shown' : 'not shown'} "${l.text}" -- expected "${expected.get(l.token)}", ${l.open ? 'hidden' : 'shown'}`);
  expect(wrong, 'every described behavior shows its schema description under its name').toEqual([]);
});

test("a group's line steps aside while the group is open, and comes back when it closes", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/?page=behaviors`, { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.locator('.behaviors-search-results__group').count(), { timeout: 30_000 }).toBeGreaterThan(0);
  // A collapsed one: the selected behavior's group is already open on load.
  // Pinned by its token, so opening it does not move the locator to the next
  // closed group.
  const token = await page.locator('.behaviors-search-results__group')
    .filter({ has: page.locator('.behaviors-search-results__desc--group') })
    .filter({ hasNot: page.locator('details[open]') }).first()
    .locator('[data-browse-token]').first().getAttribute('data-browse-token');
  const group = page.locator('.behaviors-search-results__group')
    .filter({ has: page.locator(`[data-browse-token="${token}"]`) }).first();
  const desc = group.locator('.behaviors-search-results__desc--group');
  await expect(desc).toBeVisible();
  // The open state is what the rule keys on; set it the way the page's own
  // search does (details.open = true).
  const details = group.locator(':scope > details');
  await details.evaluate((d) => { (d as HTMLDetailsElement).open = true; });
  await expect(desc).toBeHidden();
  await details.evaluate((d) => { (d as HTMLDetailsElement).open = false; });
  await expect(desc).toBeVisible();
});
