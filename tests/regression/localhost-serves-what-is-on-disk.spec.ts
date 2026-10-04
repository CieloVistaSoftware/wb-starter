/**
 * LOCALHOST SHOWS WHAT IS ON DISK (#1108)
 * =======================================
 * A service worker registered on the dev origin served a four-day-old
 * `src/core/version.js` and a 22-byte copy of a 153 KB page while the dev
 * server was serving the right files the whole time. `cache: 'no-store'` did
 * not help, because it does not bypass a service worker. Every "verified in
 * the browser" claim on that machine could have been describing stale bytes.
 *
 * The fix: src/main.js never registers sw.js on a development origin
 * (localhost, 127.0.0.1, [::1]), and removes any registration an older build
 * left behind, together with its Cache Storage.
 *
 * This guard states the general condition, not just the service-worker
 * instance of it: the commit the PAGE imports equals the commit in the FILE.
 * Anything standing between the two fails it.
 */
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

function commitOnDisk(): string {
  const source = readFileSync(join(ROOT, 'src/core/version.js'), 'utf8');
  const match = source.match(/"commit":\s*"([^"]+)"/);
  if (!match) throw new Error('src/core/version.js has no "commit" field');
  return match[1];
}

async function commitInPage(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const mod = await import('/src/core/version.js');
    return mod.VERSION.commit;
  });
}

/**
 * Resolves 'registered' if a worker becomes ready for this page within the
 * bound, else 'none'. A bound is unavoidable when proving an absence: main.js
 * registers on `load`, and `ready` settles once install/activate finish.
 */
async function workerReadyWithin(page: Page, ms: number): Promise<'registered' | 'none'> {
  return page.evaluate((bound) => Promise.race([
    navigator.serviceWorker.ready.then(() => 'registered' as const),
    new Promise<'none'>((resolve) => setTimeout(() => resolve('none'), bound)),
  ]), ms);
}

async function loadHome(page: Page) {
  await page.goto('/');
  await page.waitForSelector('#mainPage-home', { timeout: 20000 });
  await page.waitForLoadState('load');
}

test.describe('#1108: on a development origin the browser and the disk agree', () => {
  test('a localhost load registers no service worker, and the page imports the commit on disk', async ({ page }) => {
    await loadHome(page);

    expect(await workerReadyWithin(page, 5000), 'a service worker became ready on the localhost origin').toBe('none');
    expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(0);
    expect(await page.evaluate(() => navigator.serviceWorker.controller === null)).toBe(true);

    expect(await commitInPage(page)).toBe(commitOnDisk());
  });

  test('a registration left by an older build is removed on the next localhost load, with its caches', async ({ page }) => {
    await loadHome(page);

    // Reproduce what every browser that opened the site since 2026-09-06 carries:
    // the real sw.js registered on this origin, controlling, with a cache.
    await page.evaluate(async () => {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      // sw.js's activate calls clients.claim(), so this page becomes controlled.
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
      }
      const cache = await caches.open('x-cache-v1');
      await cache.put('/src/core/version.js', new Response('export const VERSION = { "commit": "stale000" };', {
        headers: { 'Content-Type': 'text/javascript' },
      }));
    });
    expect(await page.evaluate(() => navigator.serviceWorker.controller !== null), 'setup: the planted worker controls the page').toBe(true);

    // The next load unregisters it. Unregistering does not release a page the
    // worker already controls, so main.js reloads once, out of its control.
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller === null, undefined, { timeout: 20000 });
    await page.waitForSelector('#mainPage-home', { timeout: 20000 });

    await expect.poll(
      () => page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length),
      { message: 'the stale registration survived a localhost load', timeout: 10000 },
    ).toBe(0);
    await expect.poll(
      () => page.evaluate(async () => (await caches.keys()).filter((k) => k.startsWith('x-cache-'))),
      { message: "the stale worker's caches survived a localhost load", timeout: 10000 },
    ).toEqual([]);

    // And a plain load afterwards stays uncontrolled, seeing the disk.
    await loadHome(page);
    expect(await page.evaluate(() => navigator.serviceWorker.controller === null)).toBe(true);
    expect(await commitInPage(page)).toBe(commitOnDisk());
  });
});
