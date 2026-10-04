/**
 * A FAILED NETWORK FETCH IS NOT A SERVER STATUS (#891)
 * ====================================================
 * When the worker's own fetch() rejected and nothing was cached, sw.js answered
 * with a manufactured `503 Service Unavailable — Offline and not cached`. 503 is
 * a status only a server can send, so a dead dev server, or a request the browser
 * itself refused, read as a live, unhealthy server — and sent everyone to
 * server.js. On 2026-09-14 the server was up and answering curl with 200 while
 * the Network panel showed a column of 503s "Fulfilled by (ServiceWorker)".
 *
 * What actually happened is a network error, so that is what the page must get:
 * Response.error(), which makes the page's fetch() reject exactly as it would
 * with no worker at all.
 *
 * The request goes to a local TCP listener that resets every connection, so the
 * worker's fetch() genuinely fails. A cached entry on the same dead origin proves
 * the worker really is answering those requests — without it, a rejection could
 * simply mean the worker was never consulted.
 *
 * main.js does not register sw.js on localhost (#1108), so this spec registers
 * the real worker itself.
 */
import { test, expect } from '@playwright/test';
import { createServer, type Server, type AddressInfo } from 'node:net';

let deadServer: Server;
let deadOrigin: string;

test.beforeAll(async () => {
  deadServer = createServer((socket) => socket.destroy());
  await new Promise<void>((resolve) => deadServer.listen(0, '127.0.0.1', resolve));
  deadOrigin = `http://127.0.0.1:${(deadServer.address() as AddressInfo).port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => deadServer.close(() => resolve()));
});

test.describe('#891: sw.js reports a failed network fetch as a network error', () => {
  test('an uncached GET whose network fetch fails rejects in the page, never a 503', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#mainPage-home', { timeout: 20000 });

    await page.evaluate(async (origin) => {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      // sw.js's activate calls clients.claim(), so this page becomes controlled.
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
      }
      const cache = await caches.open('x-probe-891');
      await cache.put(`${origin}/cached.js`, new Response('cached', { headers: { 'Content-Type': 'text/plain' } }));
    }, deadOrigin);
    expect(await page.evaluate(() => navigator.serviceWorker.controller !== null), 'setup: sw.js controls the page').toBe(true);

    const probe = (url: string) => page.evaluate(async (target) => {
      try {
        const res = await fetch(target);
        return { outcome: 'response', status: res.status, body: await res.text() };
      } catch (err) {
        return { outcome: 'rejected', name: (err as Error).name };
      }
    }, url);

    // Control: the worker answers requests to the dead origin from its cache.
    expect(await probe(`${deadOrigin}/cached.js`), 'setup: the worker is consulted for the dead origin').toEqual({
      outcome: 'response', status: 200, body: 'cached',
    });

    // The defect: nothing cached, network failed — was a fabricated 503.
    expect(await probe(`${deadOrigin}/uncached.js?x-retry=1`)).toEqual({ outcome: 'rejected', name: 'TypeError' });
  });
});
