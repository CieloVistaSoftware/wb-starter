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
import { readFileSync, readdirSync } from 'node:fs';

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

/**
 * SECOND LAYER, added after the browser test above (#1309).
 *
 * The tests above visit three pages and assert the hint never fires. That is
 * the right primary check: it reproduces exactly what John saw in the console.
 *
 * It cannot see a bare spinner on a page the suite does not visit, and there
 * are more pages than three. This scan reads the sources instead, so a fourth
 * bare spinner added to any file under src/core or pages fails here even if no
 * test ever opens that page.
 *
 * Both layers, deliberately: the browser test proves the symptom is gone, the
 * scan proves the cause cannot come back somewhere unwatched.
 */

/** A spinner with no attribute other than x-spinner / class / style / id -- */
/** exactly the attributes teach-by-example ignores when deciding "empty".   */
const BARE_SPINNER = /<span\s+x-spinner(?:\s+(?:class|style|id)="[^"]*")*\s*>/;

function spinnerSources(): string[] {
  const out: string[] = [];
  for (const dir of ['src/core', 'pages']) {
    let entries: string[] = [];
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }
    for (const f of entries) {
      if (/\.(js|mjs|html)$/.test(f)) out.push(`${dir}/${f}`);
    }
  }
  return out;
}

test('no bare x-spinner in any src/core or pages source', () => {
  const files = spinnerSources();
  // A scan that matched no files proves nothing (#863).
  expect(files.length, 'found no sources to scan').toBeGreaterThan(5);

  const offenders: string[] = [];
  for (const rel of files) {
    let text = '';
    try {
      text = readFileSync(rel, 'utf8');
    } catch {
      continue;
    }
    text.split('\n').forEach((line, i) => {
      if (BARE_SPINNER.test(line)) offenders.push(`${rel}:${i + 1}  ${line.trim().slice(0, 90)}`);
    });
  }

  expect(
    offenders,
    'a spinner with no label is an empty element to teach-by-example, and has no '
      + `accessible name:\n${offenders.join('\n')}`,
  ).toEqual([]);
});
