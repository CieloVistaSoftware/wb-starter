import { test, expect, type Page } from '../fixtures/offline';
import { serveAsGitHubPages, PAGES_ROOT } from '../helpers/github-pages';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

/**
 * #1732 -- the error logger must not POST to a server that is not there.
 *
 * On https://cielovistasoftware.github.io/wb-starter/ every logged error also
 * POSTed to api/error-log/append. GitHub Pages has no API and answers 405, so
 * each page that logged an error gained a failed request and a browser console
 * error ("Failed to load resource") beside the error it was trying to record.
 * The logger switched server logging off only AFTER that refusal.
 *
 * Now the logger decides up front with isDevelopmentOrigin()
 * (src/core/service-worker.js): off the development origin the log lives in
 * localStorage only (#1000) and nothing is sent. On the dev server it still
 * POSTs.
 *
 * The static host is the real live origin, answered from this checkout's files
 * the way Pages serves them (tests/helpers/github-pages.ts): no API, POST -> 405.
 *
 * See it by hand: open the live site with devtools' Network tab, then run
 * `throw new Error('probe')` in the console. Before: a POST to
 * api/error-log/append answered 405. Now: no request; the entry is in
 * localStorage['wb:error-log'].
 */

// The live origin is answered by page.route; sw.js would answer it itself (#1349).
test.use({ serviceWorkers: 'block' });

const BOOT_TIMEOUT = 60000;

async function boot(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: BOOT_TIMEOUT });
  await page.waitForFunction(() => !!(window as any).WBSite, null, { timeout: BOOT_TIMEOUT });
}

/** logError() awaits its POST when one is due, so when this resolves any request has been answered. */
async function logProbe(page: Page, message: string): Promise<{ stored: boolean }> {
  return page.evaluate(async (msg) => {
    const m = await import(new URL('src/core/error-logger.js', document.baseURI).href);
    await m.logError(msg, { source: 'regression-1732' });
    return { stored: (localStorage.getItem('wb:error-log') || '').includes(msg) };
  }, message);
}

test.describe('error logger on a host with no server API (#1732)', () => {
  test.describe.configure({ timeout: 2 * BOOT_TIMEOUT });

  test('on GitHub Pages an error is kept in localStorage and nothing is POSTed', async ({ page }) => {
    const pages = await serveAsGitHubPages(page);
    // From the first request: a page that logs an error while it boots must not
    // POST either, and on main that boot-time POST was the one that happened.
    const apiRequests: string[] = [];
    const failed: string[] = [];
    const consoleErrors: string[] = [];
    page.on('request', (r) => { if (/\/api\//.test(new URL(r.url()).pathname)) apiRequests.push(`${r.method()} ${r.url()}`); });
    page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
    page.on('console', (m) => { if (m.type() === 'error' && /Failed to load resource/.test(m.text())) consoleErrors.push(m.text()); });

    await boot(page, PAGES_ROOT);
    expect(await page.evaluate(() => location.hostname)).toBe('cielovistasoftware.github.io');

    const result = await logProbe(page, 'probe-1732 logged on a static host');

    expect(result.stored, 'the entry must be in the browser log (#1000)').toBe(true);
    expect(apiRequests, 'a static host has no API: nothing may be sent to api/*').toEqual([]);
    expect(pages.requests.filter((r) => r.method !== 'GET' && r.method !== 'HEAD')).toEqual([]);
    expect(failed, 'logging an error made a failing request').toEqual([]);
    expect(consoleErrors, 'logging an error put a failed request on the console').toEqual([]);
  });

  test('on the development origin the error is still POSTed to the server log', async ({ page }) => {
    const posts: string[] = [];
    await page.route('**/api/error-log/append', async (route) => {
      posts.push(route.request().postData() || '');
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    });
    await boot(page, '/');
    expect(await page.evaluate(() => location.hostname)).toMatch(/^(localhost|127\.0\.0\.1)$/);

    await logProbe(page, 'probe-1732 logged on the dev server');

    expect(posts.filter((b) => b.includes('probe-1732 logged on the dev server'))).toHaveLength(1);
  });

  // The logger now asks isDevelopmentOrigin() when it loads, and Node specs
  // import modules that import it (docs-illustrations-never-render-live imports
  // behavior-markup.js). With no `location` in Node that threw a ReferenceError
  // at import time and broke them.
  test('the logger still loads outside a browser, where there is no location', async () => {
    const sw = await import(pathToFileURL(path.resolve('src/core/service-worker.js')).href);
    expect(sw.isDevelopmentOrigin()).toBe(false);
    const logger = await import(pathToFileURL(path.resolve('src/core/error-logger.js')).href);
    expect(logger.isLocalOnly()).toBe(true);
  });
});
