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
 *
 * #1035: the panel is a FRESH, empty node per selection, filled once the doc
 * fetch settles. The old read slept 220ms and treated whatever it found as
 * the answer -- so a doc fetch slower than 220ms left the panel empty, empty
 * did not match "No doc yet", and a missing doc counted as documented. Each
 * row now waits for its own panel to be filled, and a panel that never fills
 * is a failure, not a pass. The second test proves it with a slow 404.
 */
import { test, expect, type Page } from '../fixtures/offline';

const NO_DOC = /^No doc yet for (.+)\.$/;

// #1349: the slow-404 test mocks the network, and sw.js would otherwise answer
// a doc request from its cache before the route ever saw it.
test.use({ serviceWorkers: 'block' });

async function openShowcase(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForSelector('#behaviors-search', { timeout: 30000 });
  // #961: wait for the list's LAST render. It is rebuilt when the schema index
  // and examples land; on CI that landed just after the first click, every row
  // captured below was replaced, and the next 19 clicks did nothing ("the doc
  // panel never filled").
  await page.waitForSelector('#behaviors-search-results[aria-busy="false"]', { state: 'attached', timeout: 30000 });
  await page.fill('#behaviors-search', 'x-');
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 50,
    { timeout: 30000 },
  );
  // One row per distinct behavior — the doc is per behavior, not per variant.
  return page.evaluate(() => {
    const seen = new Map<string, number>();
    [...document.querySelectorAll('.behaviors-search-results__row')].forEach((r, i) => {
      const t = r.getAttribute('data-browse-token') || '';
      if (!seen.has(t)) seen.set(t, i);
    });
    return [...seen.entries()].map(([token, index]) => ({ token, index }));
  });
}

/** Click each row and report what its OWN doc panel says once filled. */
async function readDocPanels(page: Page, rows: { token: string; index: number }[]) {
  const missing: string[] = [];
  const documented: string[] = [];
  // Chunked so one long evaluate cannot outlive its own timeout.
  for (let start = 0; start < rows.length; start += 20) {
    const chunk = rows.slice(start, start + 20);
    const results = await page.evaluate(async (items: { token: string; index: number }[]) => {
      const all = [...document.querySelectorAll('.behaviors-search-results__row')] as HTMLElement[];
      const out: { token: string; docText: string | null }[] = [];
      for (const { token, index } of items) {
        const before = document.getElementById('behaviors-live-doc-body');
        all[index].click();
        // Settled = the panel was replaced by a new node AND that node has text.
        const docText = await new Promise<string | null>((resolve) => {
          const deadline = performance.now() + 10_000;
          const check = () => {
            const body = document.getElementById('behaviors-live-doc-body');
            const text = (body?.textContent || '').trim();
            if (body && body !== before && text) return resolve(text);
            if (performance.now() > deadline) return resolve(null);
            requestAnimationFrame(check);
          };
          check();
        });
        out.push({ token, docText });
      }
      return out;
    }, chunk);

    for (const r of results) {
      if (r.docText === null) { missing.push(`${r.token} → the doc panel never filled`); continue; }
      const m = NO_DOC.exec(r.docText);
      if (m) missing.push(`${r.token} → docs/behaviors/${m[1]}.md`);
      else documented.push(r.token);
    }
  }
  return { missing, documented };
}

test('every behavior on the showcase has a doc', async ({ page }) => {
  test.setTimeout(300_000);
  const rows = await openShowcase(page);
  expect(rows.length, 'expected the behaviour list to be populated').toBeGreaterThan(50);

  const { missing, documented } = await readDocPanels(page, rows);
  const total = missing.length + documented.length;
  // Progress is the point between batches, so report it either way.
  console.log(`[#713] behavior docs: ${documented.length}/${total} documented, ${missing.length} missing`);

  expect(
    missing,
    `${missing.length} of ${total} behaviors have no doc — the panel says "No doc yet for …":\n  ` +
    missing.join('\n  '),
  ).toEqual([]);
});

test('a missing doc is reported even when its 404 is slow (#1035)', async ({ page }) => {
  // The doc for one row answers 404 after 600ms -- longer than the
  // 220ms the old read waited. It must be reported missing, not documented.
  const rows = await openShowcase(page);
  // Not the first row: the page auto-selects it on load, so its doc is cached.
  const target = rows[Math.floor(rows.length / 2)];
  await page.route('**/docs/behaviors/*.md', async (route) => {
    await new Promise((r) => setTimeout(r, 600));
    await route.fulfill({ status: 404, body: '' });
  });
  const { missing, documented } = await readDocPanels(page, [target]);
  expect(documented, 'a slow 404 counted as documented').toEqual([]);
  expect(missing).toHaveLength(1);
  expect(missing[0]).toContain(target.token);
});
