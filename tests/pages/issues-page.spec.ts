import { test, expect } from '../fixtures/offline';

// #1349: the service worker is BLOCKED, which is the actual fix for what the
// comment below was reaching for. sw.js proxies every GET the page makes, and
// Playwright cannot route a service worker's requests — not with page.route and
// not with context.route either. Moving these to context.route did not make the
// fixture answer; it only moved where it failed to. The 503 "Offline and not
// cached" described below is the worker's own cache-miss response, and with the
// worker out of the picture it cannot happen. (The context routes are left as
// they are: they work equally well once nothing answers ahead of them.)
test.use({ serviceWorkers: 'block' });

test.describe('Issues page', () => {
  test('shows the current active count from status:in-progress labels', async ({ page, context }) => {
    //
    // And the page asks the dev server FIRST (#1045: /api/issues proxies an
    // authenticated `gh`). Where `gh` works that serves the live list and the
    // fixture below is never requested (#978's "Current Active: 4"); where it
    // does not, it is a 503. Answer it the way the static deployed site does
    // -- 404, no proxy -- so the page takes its GitHub API path, which is what
    // this test is about.
    await context.route(/\/api\/issues(?:\?|$)/, (route) => route.fulfill({ status: 404, body: '' }));
    // The in-progress issue's status comments (John: "what is next, when and why?").
    const postedAt = new Date(Date.now() - 5 * 60000).toISOString();
    await context.route(/\/issues\/517\/comments/, (route) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify([
        { body: 'unrelated chatter', created_at: postedAt },
        { body: '**Now:** step 2 of 3 — reviewing test lines\n**Next:** the standards docs\n**Why:** guard is in', created_at: postedAt },
      ]),
    }));
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
            // priority:1 alone is NOT active work (John, 2026-10-02): only
            // status:in-progress marks what is being worked on right now.
            number: 515,
            title: 'Important but untouched',
            state: 'open',
            created_at: '2026-07-15T00:00:00Z',
            labels: [{ name: 'priority:1', color: 'b60205' }],
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
    // not remembered. Only status:in-progress counts; the open priority:1
    // issue (#515) must not.
    await expect(page.locator('#issues-active')).toHaveText('Current Active: 1');

    // John, 2026-10-02: "how do i know you are working on it now" -- "In
    // progress work is indicated in Green?" The in-progress issue is green,
    // says so in words, and is the first row; the priority:1 one is not.
    await page.locator('.issues-tab', { hasText: 'Open' }).first().click();
    const now = page.locator('.issues-row[number="517"]');
    await expect(now).toHaveClass(/issues-row--now/);
    await expect(now.locator('.issue-now')).toHaveText('● Working on it now');
    await expect(page.locator('.issues-row').first()).toHaveAttribute('number', '517');
    await expect(page.locator('.issues-row[number="515"]')).not.toHaveClass(/issues-row--now/);
    // #1485: polled, not read once -- the row gets its class before the page's
    // stylesheet has necessarily applied, and a single read on a slow runner
    // saw no bar yet.
    await expect.poll(() => now.evaluate((el) => getComputedStyle(el).boxShadow),
      { message: 'a green bar marks the row' }).toMatch(/inset/);

    // ...and says what is happening now, what is next, and when it was said.
    const note = now.locator('.issue-now-note');
    await expect(note).toContainText('Now: step 2 of 3 — reviewing test lines');
    await expect(note).toContainText('Next: the standards docs');
    await expect(note).toContainText('5 min ago');
  });
});