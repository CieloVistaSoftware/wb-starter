import { test, expect } from '../fixtures/offline';
import { pagePath } from '../helpers/page-path';

/**
 * An async loader must not write to a page that has been replaced (#1118).
 *
 * From John's error log: opening What's New threw
 * "Cannot set properties of null" -- an error attributed to a page that has
 * nothing to do with the code that threw.
 *
 * src/core/site-engine.js navigates with history.pushState plus
 * `main.innerHTML = ...`, so leaving the Issues page does NOT stop work already
 * started there. loadActivity()'s fetch resolved against a DOM that had been
 * replaced, getElementById returned null, and six unguarded writes threw.
 *
 * THE NAVIGATION MUST BE A CLICK, NOT page.goto().
 *
 * My first version of this spec used page.goto() for the second page and it
 * PASSED with the guard removed -- it could never have caught the bug. A goto
 * is a full browser navigation: it tears down the JS context, so the old
 * page's pending fetch dies with it and nothing is left to write. Only the
 * in-page swap keeps the old script alive against a new DOM. Loading the URL
 * is a different test from clicking the link.
 *
 * The race is real but narrow, so it is FORCED rather than waited for: the
 * response is held open until after the swap, which makes the bad ordering
 * certain instead of occasional.
 */

// A PREDICATE, not a glob. The glob form did not match and the mock never
// fired -- the first run of this spec failed on the intercepted poll below
// rather than on the defect, which is the poll doing its job (#863).
//
// #1349, read this before changing the matcher again: the matcher was never the
// problem. The same route was registered four ways at once -- string glob,
// RegExp, a url.pathname predicate and a String(url) predicate -- and NONE of
// them fired, while page.on('request') logged the request going out. The
// predicate below is fine, but what made the mock apply is the blocked worker.
const ACTIVITY = (url: URL) => url.pathname.endsWith('/api/activity');

// THE SERVICE WORKER IS BLOCKED, or the mock is never what the page receives.
// main.js registers sw.js on every origin, localhost included (#1108). A page it
// controls sends /api/activity through the worker, and page.route never sees a
// worker's requests. Traced 2026-10-03: zero route hits, and the panel showed
// either the live server's real activity or the worker's manufactured 503s
// (#891). Both tests failed on every CI run for that reason, not the defect.
test.use({ serviceWorkers: 'block' });

const EMPTY_ACTIVITY = JSON.stringify({
  closed: [], opened: [], commits: [],
  counts: { closed: 0, opened: 0, commits: 0 },
});

/** The nav item John calls "What's New". Asserted to exist, not assumed. */
const NAV_TARGET = 'releases';

/**
 * The page's OTHER network dependency. Blocking the worker makes the activity
 * mock apply; it does not make this one exist.
 *
 * pages/issues.html:620 falls back to api.github.com when the local
 * /api/issues proxy does not answer, and the offline fixture blocks that host.
 * Unmocked, the page can still fail to finish booting -- the same flake one
 * layer down, and invisible because the activity assertions are what fail.
 */
const ISSUE_LIST = (url: URL) =>
  url.hostname === 'api.github.com' || url.pathname.endsWith('/api/issues');

const ISSUE_LIST_BODY = JSON.stringify([
  {
    number: 1, title: 'a sample issue', state: 'open', labels: [],
    created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z',
    html_url: 'https://example.invalid/1', body: '', comments: 0, user: { login: 'nobody' },
  },
]);

/** Answer the issue list, so only the loader under test is unmocked. */
async function mockIssueList(page: import('@playwright/test').Page): Promise<void> {
  await page.route(ISSUE_LIST, (route) => route.fulfill({
    status: 200, contentType: 'application/json', body: ISSUE_LIST_BODY,
  }));
}

test.describe('#1118 the Issues activity loader outlives its own page', () => {
  test('the nav target this spec clicks actually exists', async ({ page, baseURL }) => {
    // This spec spent its whole life red partly because it clicked a link to
    // "whats-new", a page that is not in the nav and has no file. A comment
    // saying so does not stop the next person; reading the real config does.
    const res = await page.request.get(`${baseURL}/config/site.json`);
    expect(res.ok(), 'could not read config/site.json').toBe(true);
    const ids = (await res.json()).navigationMenu.map((m: any) => m.pageToLoad || m.href);
    expect(ids, `the nav has no "${NAV_TARGET}" item; the test below clicks one`).toContain(NAV_TARGET);
  });

  test('leaving Issues mid-fetch writes nothing and throws nothing', async ({ page, baseURL }) => {
    await mockIssueList(page);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });

    // Hold the response open so the swap is guaranteed to land first.
    let release!: () => void;
    const held = new Promise<void>((r) => { release = r; });
    let intercepted = false;

    await page.route(ACTIVITY, async (route) => {
      intercepted = true;
      await held;
      await route.fulfill({ status: 200, contentType: 'application/json', body: EMPTY_ACTIVITY });
    });

    await page.goto(`${baseURL}/?page=issues`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#activity-closed')).toHaveCount(1);

    // A test whose mock never fired proves nothing (#863).
    await expect.poll(() => intercepted, { timeout: 15_000 }).toBe(true);

    // Leave by CLICKING, so the SPA swaps main's innerHTML and the in-flight
    // loadActivity() is left holding references into a DOM that is gone.
    // The site nav's Releases link (config/site.json navigationMenu). There is
    // no "whats-new" entry in the nav any more, which is the second reason this
    // never ran: the link it waited for does not exist.
    const link = page.locator(`.nav__item[href="${pagePath(NAV_TARGET)}"]`).first();
    await expect(link, `no nav link to ${NAV_TARGET}`).toBeVisible({ timeout: 10_000 });
    await link.click();

    await expect(page.locator('#activity-closed')).toHaveCount(0, { timeout: 10_000 });

    const activity = page.waitForResponse((r) => ACTIVITY(new URL(r.url())), { timeout: 10_000 });
    release();
    // The released body has arrived; loadActivity() parses it and writes in
    // the tasks that follow, so two frames later any write has run (#1516).
    await (await activity).finished();
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

    const nullWrites = errors.filter((e) =>
      /Cannot set properties of null|Cannot read properties of null|of null \(setting/i.test(e));
    expect(nullWrites, `an async write reached a replaced DOM:\n${nullWrites.join('\n')}`).toEqual([]);
  });

  test('staying on Issues still fills the panel', async ({ page, baseURL }) => {
    // The guard must not have been bought by making the feature never run.
    await mockIssueList(page);
    await page.route(ACTIVITY, (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        closed: [{ number: 1, title: 'a closed one', url: '#' }],
        opened: [], commits: [],
        counts: { closed: 1, opened: 0, commits: 0 },
      }),
    }));

    await page.goto(`${baseURL}/?page=issues`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#activity-closed')).toContainText('a closed one', { timeout: 15_000 });
  });
});
