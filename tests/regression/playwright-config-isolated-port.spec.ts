import { test, expect } from '@playwright/test';

/**
 * #518: playwright.config.ts used to hardcode `baseURL: ''`
 * and `webServer: { port: 3000, reuseExistingServer: true }` unconditionally.
 * Any Playwright run started from a git worktree (every background agent)
 * silently reused whatever server already held port 3000 -- normally the
 * owner's own dev server running the MAIN checkout -- so an agent verified
 * its fix against code that didn't contain its fix. Confirmed live this
 * session: a stale, locally-uncommitted demos/site/feedback.html in the
 * main checkout made an already-fixed test (#510) look freshly broken the
 * moment a second server got started on port 3000 for unrelated
 * verification -- exactly the failure mode this issue describes.
 *
 * Fix: WB_TEST_PORT env var threads through baseURL, webServer.port, and
 * the spawned server's own PORT env identically -- a run that opts into an
 * isolated port always gets its own fresh server (reuseExistingServer only
 * stays true on the untouched default, port 3000, matching the existing
 * CI contract where ci-tests.yml starts that specific server itself).
 *
 * This test can't fully simulate "two different checkouts on two ports"
 * within one process, but it proves the mechanism that made the bug
 * possible is gone: a non-default WB_TEST_PORT actually reaches the
 * browser as the real navigated origin, not silently falling back to
 * whatever already happened to be on 3000.
 */
test('WB_TEST_PORT actually isolates the run to its own server, not port 3000', async ({ page }) => {
  const isolatedPort = process.env.WB_TEST_PORT;
  test.skip(!isolatedPort, 'run with WB_TEST_PORT set to exercise the isolation path (see package.json / CI for the default-port path, which this test intentionally does not cover)');

  await page.goto('/');
  expect(
    page.url(),
    `expected navigation to land on the isolated port ${isolatedPort}, not a stray port-3000 server`
  ).toContain(`:${isolatedPort}`);
});
