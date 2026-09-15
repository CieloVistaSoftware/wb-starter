import { test, expect } from '../fixtures/offline';
import { gotoSettled } from '../base';

/**
 * The home page's tests wait on the page, not on archive.org (#1087).
 *
 * pages/home.html plays an MP3 from archive.org. home-page-permutation.spec.ts
 * loaded it with waitUntil:'networkidle', which waits for 500ms with no requests,
 * so the "page is ready" moment included three archive.org requests. Measured at
 * one worker: built at 0.7-0.95s, networkidle at 2.5-2.9s. On 2026-09-15, under
 * gate load, seven tests timed out in beforeEach and aborted the 4.0.6 release.
 *
 * The fixture holds every archive.org request open forever: a third party at its
 * slowest. Under that fixture:
 *   1. networkidle never arrives. This proves the fixture reproduces the
 *      dependency, so the next test cannot pass vacuously.
 *   2. gotoSettled() returns, and the home page is actually built: hero, four
 *      stats cards and the audio transport. Those are the things the permutation
 *      spec asserts on after its beforeEach.
 */

const HOME_URL = '/pages/home.html';

test.describe('#1087: home page readiness does not wait on third-party media', () => {
  test.beforeEach(async ({ page }) => {
    // Never fulfilled: the request stays in flight, as a stalled server's would.
    await page.route((url) => url.hostname === 'archive.org' || url.hostname.endsWith('.archive.org'), () => new Promise<void>(() => {}));
  });

  test('with archive.org stalled, networkidle never arrives (the fixture is real)', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
    const outcome = await page
      .waitForLoadState('networkidle', { timeout: 8000 })
      .then(() => 'idle', () => 'timed out');
    expect(outcome, 'a stalled archive.org request must keep networkidle from arriving').toBe('timed out');
  });

  test('with archive.org stalled, gotoSettled returns on a built page', async ({ page }) => {
    const started = Date.now();
    await gotoSettled(page, HOME_URL);
    const elapsed = Date.now() - started;

    await expect(page.locator('.x-hero')).toHaveCount(1);
    await expect(page.locator('.x-stats')).toHaveCount(4);
    await expect(page.locator('.x-audio-host > audio')).toHaveCount(1);
    expect(elapsed, 'settling must not wait out the stalled media').toBeLessThan(15000);
  });
});
