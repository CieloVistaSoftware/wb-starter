import { test, expect, type Page } from '../fixtures/offline';
import { serveAsGitHubPages, PAGES_ROOT } from '../helpers/github-pages';

/**
 * #1733 -- the Issues page must not call a server API the static site does not have.
 *
 * On https://cielovistasoftware.github.io/wb-starter/?page=issues the page
 * fetched ROOT-absolute /api/issues and /api/activity?hours=672. Both addressed
 * the organisation root, 404ed, and put two "Failed to load resource" errors on
 * the console of every visit; the Work completed button then opened nothing.
 *
 * Now both routes are site-relative and asked only on the dev server
 * (isDevelopmentOrigin(), src/core/service-worker.js). On a static host the list
 * comes straight from the public GitHub API, and the Work completed panel says
 * the account is not available on the static site.
 *
 * The static host is the live origin answered from this checkout's files the way
 * Pages serves them (tests/helpers/github-pages.ts). The GitHub API is stubbed.
 *
 * See it by hand: open ?page=issues on the live site with devtools' Network tab
 * open and press Work completed. Before: /api/issues and /api/activity 404 and
 * the panel stays shut. Now: no api/ request, and the panel explains it is not
 * available on the static site.
 */

// Every route here is a page.route mock; sw.js would answer it itself (#1349).
test.use({ serviceWorkers: 'block' });

const BOOT_TIMEOUT = 60000;
const PROBE_TITLE = 'probe issue for 1733';

const ISSUE = {
  number: 1733,
  title: PROBE_TITLE,
  state: 'open',
  labels: [{ name: 'bug' }, { name: 'priority:2' }],
  html_url: 'https://github.com/CieloVistaSoftware/wb-starter/issues/1733',
  created_at: '2026-10-08T00:00:00Z',
  updated_at: '2026-10-08T00:00:00Z',
  body: 'probe',
};

async function stubGitHubApi(page: Page): Promise<void> {
  await page.route('https://api.github.com/**', (route) => route.fulfill({
    status: 200,
    headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
    body: JSON.stringify([ISSUE]),
  }));
}

async function openIssues(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: BOOT_TIMEOUT });
  await expect(page.locator('#issues-tbody')).toContainText(PROBE_TITLE, { timeout: BOOT_TIMEOUT });
}

test.describe('Issues page server routes (#1733)', () => {
  test.describe.configure({ timeout: 2 * BOOT_TIMEOUT });

  test('on GitHub Pages it makes no api/ request and says Work completed is not available', async ({ page }) => {
    await serveAsGitHubPages(page);
    await stubGitHubApi(page);
    const apiRequests: string[] = [];
    const failed: string[] = [];
    const consoleErrors: string[] = [];
    page.on('request', (r) => {
      const u = new URL(r.url());
      if (u.hostname !== 'api.github.com' && /\/api\//.test(u.pathname)) apiRequests.push(r.url());
    });
    page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

    await openIssues(page, `${PAGES_ROOT}?page=issues`);
    expect(await page.evaluate(() => location.hostname)).toBe('cielovistasoftware.github.io');

    // The list is on screen, so the page has already decided whether to ask
    // the server for it (the proxy is tried before the GitHub API).
    expect(apiRequests, 'the static site has no API: nothing may be asked of api/*').toEqual([]);

    await page.locator('#activity-toggle').click();
    const notice = page.locator('#activity-static');
    await expect(notice).toBeVisible({ timeout: 15000 });
    await expect(notice).toContainText('not available on the static site');
    await expect(page.locator('#activity-counts')).toBeHidden();

    expect(apiRequests, 'the static site has no API: nothing may be asked of api/*').toEqual([]);
    expect(failed.filter((f) => /\/api\//.test(f))).toEqual([]);
    expect(consoleErrors.filter((t) => /Failed to load resource/.test(t)), 'a failed request on the console').toEqual([]);
  });

  test('on the dev server it still uses its site-relative api/ routes', async ({ page, baseURL }) => {
    const asked: string[] = [];
    await page.route('**/api/issues', (route) => {
      asked.push(route.request().url());
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ issues: [ISSUE] }) });
    });
    await page.route('**/api/activity?*', (route) => {
      asked.push(route.request().url());
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ hours: 672, counts: { closed: 3, opened: 2, commits: 5 }, closed: [], opened: [], commits: [] }),
      });
    });

    await openIssues(page, '/?page=issues');
    await expect(page.locator('#activity-counts')).toContainText('3 closed', { timeout: 15000 });
    await expect(page.locator('#activity-static')).toBeHidden();
    expect(asked.sort()).toEqual([new URL('api/activity?hours=672', baseURL).href, new URL('api/issues', baseURL).href]);
  });
});
