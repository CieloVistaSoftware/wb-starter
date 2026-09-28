import { test, expect } from '../fixtures/offline';

test.describe('Issues page', () => {
  test('shows the current active count from status:in-progress labels', async ({ page, context }) => {
    // CONTEXT routes, not page routes: sw.js (registered by src/main.js)
    // proxies every GET, and a service worker's own fetch is only seen by
    // context.route(). With page.route() the fixture never answered -- the
    // worker's request fell through to the offline fixture, was blocked, and
    // sw.js answered 503 "Offline and not cached".
    //
    // And the page asks the dev server FIRST (#1045: /api/issues proxies an
    // authenticated `gh`). Where `gh` works that serves the live list and the
    // fixture below is never requested (#978's "Current Active: 4"); where it
    // does not, it is a 503. Answer it the way the static deployed site does
    // -- 404, no proxy -- so the page takes its GitHub API path, which is what
    // this test is about.
    await context.route(/\/api\/issues(?:\?|$)/, (route) => route.fulfill({ status: 404, body: '' }));
    await context.route(/https:\/\/api\.github\.com\/repos\/CieloVistaSoftware\/wb-starter\/issues(?:\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            number: 517,
            title: 'Running job',
            state: 'open',
            created_at: '2026-08-01T00:00:00Z',
            labels: [{ name: 'status:in-progress', color: '2da44e' }],
            body: '',
          },
          {
            number: 516,
            title: 'Completed job',
            state: 'closed',
            created_at: '2026-07-01T00:00:00Z',
            closed_at: '2026-08-02T00:00:00Z',
            labels: [{ name: 'enhancement', color: 'a2eeef' }],
            body: '',
          },
        ]),
      });
    });

    const issuesResponse = page.waitForResponse((response) =>
      response.url().startsWith('https://api.github.com/repos/CieloVistaSoftware/wb-starter/issues')
    );
    await page.goto('/?page=issues');
    expect((await issuesResponse).status()).toBe(200);

    // #978: assert the FIXTURE was actually served before asserting anything
    // derived from it. This test passed alone and failed in the full suite with
    // "Current Active: 4" — the live count of open priority:1 issues — because
    // the interception did not take effect and real API data rendered instead.
    // Checking a canned issue first turns that into a failure that names its own
    // cause, rather than a number mismatch that looks like a broken page.
    await expect(
      // .issues-row -- the class pages/issues.html renders (was .issue-row).
      page.locator('.issues-row[number="517"]'),
      'the route fixture was not served — the page rendered live GitHub data'
    ).toBeAttached({ timeout: 10000 });

    // Derived from the fixture (one open issue labelled status:in-progress),
    // not remembered. The page counts status:in-progress OR priority:1.
    await expect(page.locator('#issues-active')).toHaveText('Current Active: 1');
  });
});