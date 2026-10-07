import { test, expect, type Page, type Route } from '../fixtures/offline';

/**
 * #1245 -- "we need a visitor count of all hits on the index.html."
 *
 * src/core/visitor-count.js counts each boot of the site shell with a hosted
 * counter (Abacus) and shows the total in the footer. Three promises, each
 * asserted here:
 *
 *   1. Only the live host counts. On the test server (localhost) the counter is
 *      never called -- a test run, or John's local copy, adds nothing.
 *   2. On the live host, one load of index.html is one hit, and the total shows
 *      in the footer. Moving between pages inside the loaded site is not a new
 *      load of index.html and does not count again; a reload does.
 *   3. A counter that is blocked, down or answering garbage leaves the page
 *      error-free and the footer without a number.
 *
 * The live host is faked without touching the page code: the browser is sent to
 * https://cielovistasoftware.github.io/wb-starter/ and page.route answers that
 * origin from the test server, so location.hostname really is the live host.
 * The counter itself is always stubbed; no test reaches the internet.
 */

const LIVE_ROOT = 'https://cielovistasoftware.github.io/wb-starter/';
const COUNTER_HOST = 'abacus.jasoncameron.dev';
const HIT_URL = `https://${COUNTER_HOST}/hit/cielovistasoftware-wb-starter/index`;

// #1349: sw.js would answer the page's requests itself, out of page.route's reach.
test.use({ serviceWorkers: 'block' });

// Every file of a live-host boot is relayed through page.route to the test
// server, and the live-host test boots twice; on a busy machine that outruns
// the default 30s.
const BOOT_TIMEOUT = 60000;

/** Every request this page makes to the counter host. */
function counterRequests(page: Page): string[] {
  const seen: string[] = [];
  page.on('request', (r) => {
    try { if (new URL(r.url()).hostname === COUNTER_HOST) seen.push(r.url()); } catch { /* not a URL */ }
  });
  return seen;
}

/** Page errors and console errors, for the "never breaks the page" checks. */
function problems(page: Page): { pageErrors: string[]; consoleErrors: string[] } {
  const out = { pageErrors: [] as string[], consoleErrors: [] as string[] };
  page.on('pageerror', (e) => out.pageErrors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') out.consoleErrors.push(m.text()); });
  return out;
}

/** Serve the live origin's /wb-starter/ tree from the test server. */
async function serveLiveSiteLocally(page: Page, baseURL: string): Promise<void> {
  await page.route(`${LIVE_ROOT}**`, async (route: Route) => {
    const u = new URL(route.request().url());
    const local = new URL(u.pathname.replace(/^\/wb-starter\/?/, '/') + u.search, baseURL).href;
    try {
      await route.fulfill({ response: await route.fetch({ url: local }) });
    } catch {
      // A request still in flight when the page reloads or the test ends has
      // nobody left to answer; that is not this spec's subject.
      await route.abort().catch(() => {});
    }
  });
}

/** Boot the site shell and wait until it says it is ready. */
async function boot(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: BOOT_TIMEOUT });
  await page.waitForFunction(() => !!(window as any).WBSite, null, { timeout: BOOT_TIMEOUT });
  await expect(page.locator('#footerLeft')).toBeVisible({ timeout: BOOT_TIMEOUT });
}

test.describe('visitor count (#1245)', () => {
  test.describe.configure({ timeout: 2 * BOOT_TIMEOUT });

  test('on localhost the counter is never called and the footer shows no count', async ({ page }) => {
    const calls = counterRequests(page);
    await boot(page, '/');
    // The count is started right after the shell renders; give a real call
    // time to have been made before saying none was.
    await page.waitForTimeout(1000);
    expect(calls, 'a counter request from localhost').toEqual([]);
    await expect(page.locator('#footerVisits')).toHaveCount(0);
  });

  test('on the live host one load is one hit, the total shows in the footer, and in-site navigation does not count again', async ({ page, baseURL }) => {
    const calls = counterRequests(page);
    const issues = problems(page);
    let total = 4241;
    await page.route(`https://${COUNTER_HOST}/**`, (route) => {
      total += 1;
      return route.fulfill({
        status: 200,
        headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
        body: JSON.stringify({ value: total }),
      });
    });
    await serveLiveSiteLocally(page, baseURL!);

    await boot(page, LIVE_ROOT);
    expect(await page.evaluate(() => location.hostname)).toBe('cielovistasoftware.github.io');
    await expect(page.locator('#footerLeft #footerVisits.footer__visits')).toHaveText('4,242 visits', { timeout: 15000 });
    expect(calls).toEqual([HIT_URL]);

    // A page change inside the loaded site is not a new load of index.html.
    await page.evaluate(() => (window as any).WBSite.navigateTo('about'));
    await page.waitForTimeout(1000);
    expect(calls, 'in-site navigation counted as a hit').toHaveLength(1);

    // A reload is.
    await page.reload({ waitUntil: 'domcontentloaded', timeout: BOOT_TIMEOUT });
    await page.waitForFunction(() => !!(window as any).WBSite, null, { timeout: BOOT_TIMEOUT });
    await expect(page.locator('#footerVisits')).toHaveText('4,243 visits', { timeout: 15000 });
    expect(calls).toHaveLength(2);
    expect(issues.pageErrors).toEqual([]);
  });

  for (const [name, answer] of [
    ['blocked', (route: Route) => route.abort('blockedbyclient')],
    ['down (503)', (route: Route) => route.fulfill({ status: 503, headers: { 'access-control-allow-origin': '*' }, body: 'Service Unavailable' })],
    ['answering garbage', (route: Route) => route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' }, body: '<html>not json</html>' })],
  ] as const) {
    test(`a counter that is ${name} leaves the page error-free and the footer without a count`, async ({ page, baseURL }) => {
      const calls = counterRequests(page);
      const issues = problems(page);
      await page.route(`https://${COUNTER_HOST}/**`, answer);
      await serveLiveSiteLocally(page, baseURL!);

      await boot(page, LIVE_ROOT);
      await expect.poll(() => calls.length, { timeout: 15000 }).toBe(1);
      await page.waitForTimeout(500);

      await expect(page.locator('#footerVisits')).toHaveCount(0);
      await expect(page.locator('#footerCopyright')).toBeVisible();
      expect(issues.pageErrors).toEqual([]);
      // The browser itself reports a failed or refused request on the console
      // ("Failed to load resource ..."); no script may add an error of its own.
      expect(issues.consoleErrors.filter((t) => !/^Failed to load resource/.test(t))).toEqual([]);
    });
  }
});
