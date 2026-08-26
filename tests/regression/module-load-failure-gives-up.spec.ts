import { test, expect } from '@playwright/test';

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

test('a permanently failing module is not retried forever', async ({ page }) => {
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
      try { await wb.inject(document.body, 'does-not-exist-module'); } catch { /* expected */ }
      await new Promise((r) => setTimeout(r, 100));
    }
  });

  const early = attempts.length;

  // Wait past several cooldown windows (5s each) and keep asking.
  await page.evaluate(async () => {
    const wb = (window as any).WB;
    for (let i = 0; i < 4; i++) {
      await new Promise((r) => setTimeout(r, 5200));
      try { await wb.inject(document.body, 'does-not-exist-module'); } catch { /* expected */ }
    }
  });

  expect(
    attempts.length,
    `The module was re-fetched ${attempts.length} times (${early} in the first second, `
    + `then ${attempts.length - early} more across ~21s of cooldown windows). A module that `
    + `has failed repeatedly should be given up on, not retried on every cooldown expiry — `
    + `that is what fills the error log with one entry every ~9 seconds indefinitely.`,
  ).toBeLessThanOrEqual(early);
});
