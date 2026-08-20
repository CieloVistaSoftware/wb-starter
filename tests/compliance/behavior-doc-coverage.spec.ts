/**
 * #713 — every behavior on the showcase must have a doc.
 *
 * John, on `button`: "We need to write some doc." The Documentation panel reads
 * "No doc yet for button." #673 stopped that panel from *vanishing* for an
 * undocumented behavior; it did not fill the gap, and nothing failed when one
 * shipped without a doc.
 *
 * This drives the real page and reads what the panel actually renders, rather
 * than checking docs/behaviors/*.md from Node. The lookup name is
 * `extensionMap[token] || token.replace(/^x-/, '')` — resolved at runtime from
 * the x-* registry — so a Node-side check would re-implement that mapping and
 * drift from the page. Reading the panel's own words cannot drift.
 */
import { test, expect } from '@playwright/test';

const NO_DOC = /^No doc yet for (.+)\.$/;

test('every behavior on the showcase has a doc', async ({ page }) => {
  test.setTimeout(300_000);

  await page.goto('/?page=behaviors');
  await page.waitForSelector('#behaviors-search', { timeout: 30000 });
  await page.fill('#behaviors-search', 'x-');
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 50,
    { timeout: 30000 },
  );

  // One row per distinct behavior — the doc is per behavior, not per variant.
  const rowIndexes = await page.evaluate(() => {
    const seen = new Map<string, number>();
    [...document.querySelectorAll('.behaviors-search-results__row')].forEach((r, i) => {
      const t = r.getAttribute('data-browse-token') || '';
      if (!seen.has(t)) seen.set(t, i);
    });
    return [...seen.entries()].map(([token, index]) => ({ token, index }));
  });

  expect(rowIndexes.length, 'expected the behaviour list to be populated').toBeGreaterThan(50);

  const missing: string[] = [];
  const documented: string[] = [];

  // Chunked so one long evaluate cannot outlive its own timeout.
  for (let start = 0; start < rowIndexes.length; start += 20) {
    const chunk = rowIndexes.slice(start, start + 20);
    const results = await page.evaluate(async (items: { token: string; index: number }[]) => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const rows = [...document.querySelectorAll('.behaviors-search-results__row')] as HTMLElement[];
      const out: { token: string; docText: string }[] = [];
      for (const { token, index } of items) {
        rows[index].click();
        // The doc is fetched; give it a real chance before reading the panel.
        await sleep(220);
        const body = document.getElementById('behaviors-live-doc-body');
        out.push({ token, docText: (body?.textContent || '').trim() });
      }
      return out;
    }, chunk);

    for (const r of results) {
      const m = NO_DOC.exec(r.docText);
      if (m) missing.push(`${r.token} → docs/behaviors/${m[1]}.md`);
      else documented.push(r.token);
    }
  }

  const total = missing.length + documented.length;
  // Progress is the point between batches, so report it either way.
  console.log(`[#713] behavior docs: ${documented.length}/${total} documented, ${missing.length} missing`);

  expect(
    missing,
    `${missing.length} of ${total} behaviors have no doc — the panel says "No doc yet for …":\n  ` +
    missing.join('\n  '),
  ).toEqual([]);
});
