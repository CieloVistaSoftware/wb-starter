/**
 * #715 — no showcase example may be a placeholder.
 *
 * 83 of 143 behaviors rendered `<article variant="flat">Example article
 * content</article>` — the generated fallback that fires when a token has no
 * entry in data/behavior-examples.json. The schema supplies the tag and the
 * attribute; the BODY is filler, and for a container-shaped behavior filler is
 * exactly why there is nothing to look at (the x-dropdown empty menu, #701).
 *
 * Reads the code panel the reader reads, so it cannot pass on a catalogue entry
 * that fails to render.
 */
import { test, expect } from '@playwright/test';

const PLACEHOLDER = /Example [\w-]+ content/;

test('no behavior example is a placeholder', async ({ page }) => {
  test.setTimeout(300_000);

  await page.goto('/?page=behaviors');
  await page.waitForSelector('#behaviors-search', { timeout: 30000 });
  await page.fill('#behaviors-search', 'x-');
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 50,
    { timeout: 30000 },
  );

  const targets = await page.evaluate(() => {
    const seen = new Map();
    [...document.querySelectorAll('.behaviors-search-results__row')].forEach((r, i) => {
      const t = r.getAttribute('data-browse-token') || '';
      if (!seen.has(t)) seen.set(t, i);
    });
    return [...seen.entries()].map(([token, index]) => ({ token, index }));
  });

  const stubs = [];
  for (let start = 0; start < targets.length; start += 20) {
    const results = await page.evaluate(async (items) => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const rows = [...document.querySelectorAll('.behaviors-search-results__row')];
      const out = [];
      for (const { token, index } of items) {
        rows[index].click();
        await sleep(160);
        const code = document.getElementById('behaviors-live-code');
        out.push({ token, code: (code?.textContent || '').replace(/^Copy[\d]*/, '').trim() });
      }
      return out;
    }, targets.slice(start, start + 20));
    for (const r of results) if (PLACEHOLDER.test(r.code)) stubs.push(r.token);
  }

  console.log(`[#715] examples: ${targets.length - stubs.length}/${targets.length} real, ${stubs.length} placeholder`);

  expect(
    stubs,
    `${stubs.length} of ${targets.length} behaviors render a placeholder example — give each one an entry in data/behavior-examples.json:\n  ` +
    stubs.join('\n'),
  ).toEqual([]);
});
