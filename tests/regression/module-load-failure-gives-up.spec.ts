import { test, expect } from '../fixtures/offline';

/**
 * A module that cannot load must stop being re-requested.
 *
 * John's error log, one browser tab, three page views:
 *
 *   error.js  01:20:20, 01:20:29, 01:20:39, 01:20:49, 01:20:58, 01:21:08, …
 *
 * Every ~9 seconds, forever. `MODULE_FAILURE_COOLDOWN_MS` (5s) memoizes a
 * failure only for its window; once that expires the next caller starts a
 * fresh attempt, fails, logs, and re-arms the cooldown. Nothing ever decides
 * the module is simply not coming.
 *
 * It is worst for `error.js` specifically, because failing to load the error
 * behavior logs an error, which is what drives the next attempt — the handler
 * amplifies the condition it exists to report.
 *
 * A dead server is only the trigger. A typo'd module name, a bad deploy, or a
 * file removed from a release does the same thing on a perfectly healthy site.
 */

// #1349: this test COUNTS attempts inside its route handler, so a request the
// route never sees is an attempt that never happened. sw.js answers the page's
// GETs itself and Playwright cannot route a service worker's requests, so on a
// claimed page `attempts` stayed near empty and
// "toBeLessThanOrEqual(early)" compared nothing to nothing — the shape of a
// test that passes hardest when it is working least (#863).
test.use({ serviceWorkers: 'block' });

test('a permanently failing module is not retried forever', async ({ page }) => {
  // The cooldown reads Date.now(); a fake clock lets the test step past each
  // 5s window instantly instead of sleeping ~21s in real time (#1516).
  await page.clock.install();
  await page.goto('/?page=demos');
  await page.waitForFunction(() => (window as any).WB, null, { timeout: 20000 });

  // Count every attempt at a module that cannot exist.
  const attempts: string[] = [];
  await page.route('**/does-not-exist-module*.js*', (route) => {
    attempts.push(route.request().url());
    void route.abort('failed');
  });

  await page.evaluate(async () => {
    const wb = (window as any).WB;
    // Ask for it repeatedly, the way a page does as elements scan in.
    for (let i = 0; i < 3; i++) {
      // Back to back, all inside one cooldown window: each awaits the shared failure.
      try { await wb.inject(document.body, 'does-not-exist-module'); } catch { /* expected */ }
    }
  });

  const early = attempts.length;

  // Step past several cooldown windows (5s each) on the fake clock and keep asking.
  for (let i = 0; i < 4; i++) {
    await page.clock.fastForward(5200);
    await page.evaluate(async () => {
      try { await (window as any).WB.inject(document.body, 'does-not-exist-module'); } catch { /* expected */ }
    });
  }

  expect(
    attempts.length,
    `The module was re-fetched ${attempts.length} times (${early} in the first second, `
    + `then ${attempts.length - early} more across ~21s of cooldown windows). A module that `
    + `has failed repeatedly should be given up on, not retried on every cooldown expiry — `
    + `that is what fills the error log with one entry every ~9 seconds indefinitely.`,
  ).toBeLessThanOrEqual(early);
});
