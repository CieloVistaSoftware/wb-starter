import { test, expect, type Page } from '../fixtures/offline';

/**
 * #1291 -- a stopped server is one error, not one per file.
 *
 * A Playwright browser left open on a page whose test server had already
 * stopped showed nine rows: eight stylesheets and the logo, each "failed to
 * load", each naming a file that exists. The element's `error` event carries
 * no status, so error-logger.js could not tell "the file is missing" from
 * "nothing is listening", and blamed the files.
 *
 * Both halves are asserted, because each is the other's regression:
 *   - unreachable server -> ONE "Server unreachable" entry, repeats counted;
 *   - a genuinely missing file -> still named, now with its status.
 */

const FIXTURE = '/tests/fixtures/blank.html';

// #1349: the whole first test is "no response at all, including the logger's
// own probe". sw.js answers the page's GETs itself and Playwright cannot route
// a service worker's requests, so a claimed page got the real server's 404 for
// /gone/* instead of a refused connection — a DIFFERENT error class from the
// one under test, and the reason this spec's verdict moved with timing.
test.use({ serviceWorkers: 'block' });

type Logged = { message: string; count: number; status?: number };

/** Boot the logger on a blank page, add `markup`, return what it logged once it settles. */
async function logAfterLoading(page: Page, markup: string, expectedRows: number): Promise<Logged[]> {
  await page.goto(FIXTURE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async (html) => {
    // Deliberate failures: keep them out of data/errors.json.
    document.documentElement.setAttribute('data-x-expected-errors', '');
    const mod: any = await import('/src/core/error-logger.js');
    mod.setupGlobalErrorHandler();
    (window as any).__logger = mod;
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.appendChild(host);
  }, markup);

  const read = () => page.evaluate(() => (window as any).__logger.getErrors().map((e: any) => ({
    // logError() keeps the caller's options as `details`, and the caller's own
    // details object inside that -- the shape every resource-load row has.
    message: e.message, count: e.count, status: e.details?.details?.status,
  })));
  // Settled = the expected number of rows AND every failure accounted for.
  await expect.poll(async () => (await read()).length, { timeout: 10_000 }).toBe(expectedRows);
  return read();
}

test.describe('#1291 a stopped server is reported once', () => {
  test('four assets from a server that refuses connections -> one "server unreachable" entry, counted 4x', async ({ page }) => {
    // Every request under /gone/ fails the way a stopped server fails: no
    // response at all. That includes the logger's own probe.
    await page.route('**/gone/**', (route) => route.abort('connectionrefused'));

    const logged = await logAfterLoading(page, `
      <link rel="stylesheet" href="/gone/effects.css">
      <link rel="stylesheet" href="/gone/notes.css">
      <link rel="stylesheet" href="/gone/header.css">
      <img src="/gone/wb.png" alt="logo">
    `, 1);

    expect(logged, 'one entry for one dead server').toHaveLength(1);
    expect(logged[0].message).toMatch(/server unreachable/i);
    expect(logged[0].message, 'it must not blame a file').not.toMatch(/failed to load/i);
    await expect.poll(async () => (await page.evaluate(() => (window as any).__logger.getErrors()[0].count)),
      { message: 'every failure is counted on the one entry' }).toBe(4);
  });

  test('two genuinely missing files -> two named entries, each with its 404', async ({ page }) => {
    const logged = await logAfterLoading(page, `
      <link rel="stylesheet" href="/src/styles/behaviors/not-a-file-1291-a.css">
      <link rel="stylesheet" href="/src/styles/behaviors/not-a-file-1291-b.css">
    `, 2);

    const messages = logged.map((e) => e.message).sort();
    expect(messages[0]).toContain('not-a-file-1291-a.css');
    expect(messages[1]).toContain('not-a-file-1291-b.css');
    expect(logged.every((e) => /failed to load/i.test(e.message)), 'a missing file is still named as such').toBe(true);
    expect(logged.map((e) => e.status), 'and says what the server answered').toEqual([404, 404]);
  });
});
