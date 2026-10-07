import { test, expect } from '../fixtures/offline';
import { networkBarrier } from '../base';

/**
 * pages/issues.html renders GitHub issue bodies through mdhtml() and never
 * explicitly calls await WB.scan()/WB.inject() on its freshly-built issue-row
 * list -- it relied entirely on the { autoLiveRender: false } option passed
 * inside its own click-to-expand handler. That option never had a chance to
 * matter: tag-map.js registers `[x-mdhtml]` for WB's own generic auto-scan,
 * which called mdhtml() with DEFAULT options (autoLiveRender left at its
 * true default) the moment `listEl.innerHTML = ...` inserted the
 * `<div x-mdhtml>` tags -- racing ahead of any click, and ahead of the
 * page-level scan even completing. Confirmed live: issue #527's own body
 * (which illustrates this exact class of bug with a fenced
 * `<div x-mdhtml src="/docs/guide.md">` example) got auto-promoted and 404'd
 * on a completely fresh, un-interacted page load of pages/issues.html --
 * before any row was ever expanded.
 *
 * Fix: pages/issues.html now uses a plain <div class="issue-row__mdhtml">,
 * not a real <div x-mdhtml> tag -- mdhtml() supports this directly (same
 * pattern public/doc-viewer.html's own plain <div id="content"> already
 * relies on), so the element is invisible to WB's generic tag-based
 * auto-scan and is ONLY ever processed by the page's own explicit,
 * correctly-configured WB.inject(el, 'mdhtml', { autoLiveRender: false })
 * call, triggered on expand.
 */
/*
 * Updated: the test used to read issue #527 from the LIVE list -- the server's
 * /api/issues (an authenticated `gh`) or api.github.com -- so it could only
 * pass on a machine with gh installed and the network up; offline (every test
 * run, tests/fixtures/offline.ts) no row ever appeared and it timed out before
 * asserting anything. #527's body is now served from the test itself, the
 * shape /api/issues returns. The page also moved to a table since: rows are
 * `tr.issues-row[number]`, and clicking the row opens its expander.
 */
// #1349: sw.js answers the page's GETs itself and Playwright cannot route a
// service worker's requests — with the worker live, /api/issues reached the
// real, gh-backed server and the canned #527 row below never appeared, so the
// row wait could only time out or measure somebody else's issue list.
test.use({ serviceWorkers: 'block' });

const ISSUE_527 = {
  number: 527,
  title: 'mdhtml auto-scan promotes illustrative examples in issue bodies',
  state: 'open',
  labels: [],
  created_at: '2026-08-10T12:00:00Z',
  updated_at: '2026-08-10T12:00:00Z',
  body: [
    'An issue body that ILLUSTRATES the bug with a fenced example:',
    '',
    '```html',
    '<div x-mdhtml src="/docs/guide.md"></div>',
    '```',
    '',
    'Rendering it must never fetch that path.',
  ].join('\n'),
};

test('pages/issues.html never fetches the fake illustrative path embedded in issue #527\'s own body', async ({ page }) => {
  const fetched: string[] = [];
  // On the context, so a fetch from any page in it is counted.
  page.context().on('request', (req) => {
    if (req.url().includes('/docs/guide.md')) fetched.push(req.url());
  });
  // #1349: the route is on the context, which does NOT make a service worker's
  // requests visible — that was the misreading. Playwright cannot route a
  // worker's requests at all, by either method; the worker is blocked at the
  // top of this file instead, and only then does this fixture answer.
  await page.context().route('**/api/issues', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ issues: [ISSUE_527], source: 'live' }) })
  );

  await page.goto('/?page=issues');
  const row = page.locator('.issues-row[number="527"]');
  await row.waitFor({ timeout: 15000 });

  // The original bug fired on a fresh, un-interacted load -- but also verify
  // expanding the row (which renders the body, embedded example included)
  // stays inert too.
  await row.click();
  const expander = page.locator('.issues-expander__body');
  // Proof the body really rendered through mdhtml: the example is shown as
  // code, not promoted into a live element.
  await expect(expander).toContainText('x-mdhtml', { timeout: 10000 });
  await expect(expander.locator('[x-mdhtml]')).toHaveCount(0);
  // The page's own scan of the rendered body has run once WB settles, and any
  // request it made has reached the listener once the barrier has (#1516).
  await page.evaluate(() => (window as any).WB?.settled?.({ timeout: 15000 })).catch(() => {});
  await networkBarrier(page);

  expect(fetched, 'the fake illustrative /docs/guide.md path embedded in #527\'s own body must never actually be fetched').toEqual([]);
});
