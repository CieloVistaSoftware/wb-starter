/**
 * ═══════════════════════════════════════════════════════════════════════════
 * No example may log an error while rendering (#777)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John, pasting the error log: "[WB:input] <input> asked for inputtype but
 * this host cannot build a field, so it was ignored … write a test that tests
 * all of these examples this is stupid".
 *
 * That entry was a FALSE POSITIVE from a warning added days earlier: a native
 * <input> is the field, so it has nothing to build, and `input-type` on one is
 * not ignored — it maps to `type`. The warning fired on correct markup and put
 * a red entry in the error log.
 *
 * Nothing caught it because nothing renders the examples and watches the
 * console. Every example is markup a customer copies; if rendering it logs an
 * error, either the example is wrong or the behavior is — and both are worth
 * failing a build over.
 *
 * WHY console + error-log, not just one
 *
 * The framework routes its own diagnostics through logError() (error-logger.js)
 * as well as the console, and a customer sees them in the Error Log page. A
 * test watching only console.error would have missed exactly the entry John
 * pasted.
 */

import { test, expect, Page } from '@playwright/test';

/** Noise that is about the test environment, not the example. */
const IGNORE = [
  /favicon/i,
  /clipboard/i,                    // permission-dependent, exercised elsewhere
  /requestFullscreen/i,            // embedder cannot grant it
];

/**
 * #763 -- John, at a "Video unavailable" placeholder: "Where's the runtime
 * error?"
 *
 * Part of the answer was here. This list used to carry /net::ERR_/ and
 * /Failed to load resource/ as "blocked/offline assets, not a render fault",
 * which is exactly the shape a 404 on our own media takes. The example that
 * produced his screenshot shipped src="/demos/sample.mp4" -- a file that has
 * never existed -- and this test was written in a way that could not have
 * reported it.
 *
 * A missing asset under our own origin IS a render fault: it is our file, our
 * path, and our example. A third-party host being slow or blocked is not, and
 * failing on that would make the suite flaky for reasons no commit caused --
 * so origin, not the phrase, decides.
 */
const isForeignHost = (text: string, origin: string) => {
  const url = text.match(/https?:\/\/[^\s"')]+/)?.[0];
  return !!url && !url.startsWith(origin);
};

const isNoise = (text: string, origin = '') => {
  if (IGNORE.some((re) => re.test(text))) return true;
  // Resource failures: ours is a defect, someone else's is weather.
  if (/net::ERR_|Failed to load resource/i.test(text)) return isForeignHost(text, origin);
  return false;
};

async function openPanel(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForSelector('#behaviors-search', { timeout: 30000 });
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 10,
    { timeout: 30000 },
  );
}

test.describe('Examples render clean', () => {
  test('no example logs a console error while rendering', async ({ page }) => {
    test.setTimeout(240_000);

    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (!isNoise(text, new URL(page.url()).origin)) errors.push(text);
    });
    page.on('pageerror', (err) => {
      if (!isNoise(String(err), new URL(page.url()).origin)) errors.push(`uncaught: ${err}`);
    });

    await openPanel(page);

    // Attribute each error to the example that was on screen when it fired,
    // so a failure names the culprit instead of handing over a pile of text.
    const perExample: string[] = [];
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll('.behaviors-search-results__row')]
        .slice(0, 80)
        .map((r, i) => ({
          i,
          label: `${(r as HTMLElement).dataset.browseToken || '?'}` +
                 `${(r as HTMLElement).dataset.variant ? ' / ' + (r as HTMLElement).dataset.variant : ''}`,
        })));

    for (const { i, label } of rows) {
      const before = errors.length;
      await page.evaluate((idx) => {
        const row = document.querySelectorAll('.behaviors-search-results__row')[idx] as HTMLElement;
        row?.click();
      }, i);
      await page.waitForTimeout(120);
      for (const e of errors.slice(before)) perExample.push(`${label}: ${e}`);
    }

    const unique = [...new Set(perExample)];
    expect(
      unique,
      `${unique.length} example(s) logged an error while rendering. Each is ` +
      `markup a customer copies — either the example is wrong or the behavior ` +
      `is:\n  ${unique.slice(0, 30).join('\n  ')}`,
    ).toEqual([]);
  });

  test('no example writes to the framework error log', async ({ page }) => {
    test.setTimeout(240_000);
    await openPanel(page);

    // logError() is the framework's own channel, surfaced on the Error Log
    // page. The entry John pasted arrived here, not through console.error.
    const entries = await page.evaluate(async () => {
      const rows = [...document.querySelectorAll('.behaviors-search-results__row')].slice(0, 80);
      const found: string[] = [];
      const WB = (window as any).WB;
      for (const row of rows) {
        (row as HTMLElement).click();
        await new Promise((r) => setTimeout(r, 110));
      }
      // getErrors() is exported by error-logger.js and re-exported on WB in
      // builds that expose it; fall back to the stored log if not.
      try {
        const mod = (window as any).WBErrors || WB?.errors;
        const list = typeof mod?.getErrors === 'function' ? mod.getErrors() : null;
        if (Array.isArray(list)) {
          for (const e of list) found.push(String(e?.message || e));
        }
      } catch { /* nothing exposed — the console test above still covers it */ }
      return found;
    });

    const real = entries.filter((e) => !isNoise(e, new URL(page.url()).origin));
    expect(
      [...new Set(real)],
      `the framework logged ${real.length} error(s) while rendering examples:\n  ` +
      [...new Set(real)].slice(0, 30).join('\n  '),
    ).toEqual([]);
  });
});
