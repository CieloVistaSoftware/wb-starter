/**
 * A TRANSIENT 5xx FROM THE HOST MUST NOT BREAK THE PAGE (#1713)
 * =============================================================
 * 2026-10-07, on the live site (GitHub Pages), right after a deploy:
 *
 *   tag-map.js:1  Failed to load resource: the server responded with a status of 503 ()
 *
 * src/core/tag-map.js is imported by the core runtime, so one failed module
 * response breaks the page's whole module graph. sw.js is network-first and
 * its fallback to the cache ran only when fetch() REJECTED; a 503 is a resolved
 * response, so it went straight to the page even when the worker held a good
 * copy of that exact file, and nothing retried.
 *
 * Now: a same-origin GET answered 502/503/504 is retried once; still 5xx, the
 * cached copy is served when there is one, and otherwise the server's own 5xx
 * is returned unchanged (a real outage stays visible). A non-ok response is
 * never cached.
 *
 * Two halves, because no single harness can do both:
 *
 *  1. The real sw.js in a stubbed worker scope whose location is the github.io
 *     origin (the pattern of sw-revalidates-same-origin.spec.ts, #989). That
 *     is the NON-development path: DEVELOPMENT_ORIGIN is false there, so the
 *     worker writes its cache exactly as on the live site, and this half
 *     proves the cache is filled by a 200, used for a 503, and never written
 *     with a 5xx.
 *  2. The real sw.js in a real browser, controlling a page served by a tiny
 *     local server whose module answers 503 on demand. page.route cannot see
 *     a worker's requests (#1349), so the 503 comes from a real server. The
 *     origin is 127.0.0.1, a development origin where the worker writes no
 *     cache (#1108), so the spec seeds the cache itself (as #891's spec does);
 *     the worker's read path, caches.match(), is the same on both origins.
 *     This half proves the page's import() survives the 503 when a copy is
 *     cached, and still fails when none is.
 */
import { test, expect } from '../fixtures/offline';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';
import type { AddressInfo } from 'node:net';

const SW_SOURCE = fs.readFileSync(path.join(process.cwd(), 'sw.js'), 'utf8');

// ---------------------------------------------------------------------------
// 1. Stubbed worker scope on the deployed origin
// ---------------------------------------------------------------------------
const PAGES = 'https://cielovistasoftware.github.io';
const TAG_MAP = PAGES + '/wb-starter/src/core/tag-map.js';

function loadWorker(answers: Record<string, number[]>) {
  const listeners: Record<string, (e: any) => void> = {};
  const fetched: string[] = [];
  const store = new Map<string, Response>();
  const writes: Array<{ url: string; status: number }> = [];
  const cache = {
    addAll: async () => {},
    put: async (req: any, res: Response) => { const url = typeof req === 'string' ? req : req.url; writes.push({ url, status: res.status }); store.set(url, res); },
  };
  const scope: any = {
    location: new URL(PAGES + '/wb-starter/sw.js'),
    addEventListener: (type: string, fn: (e: any) => void) => { listeners[type] = fn; },
    skipWaiting: () => Promise.resolve(),
    clients: { claim: () => Promise.resolve() },
    caches: {
      open: async () => cache,
      keys: async () => [],
      delete: async () => true,
      match: async (req: any) => { const hit = store.get(typeof req === 'string' ? req : req.url); return hit ? hit.clone() : undefined; },
    },
    // Each URL answers the next status in its script; the last one repeats.
    fetch: (req: any) => {
      const url = typeof req === 'string' ? req : req.url;
      fetched.push(url);
      const script = answers[url] || [200];
      const status = script.length > 1 ? script.shift()! : script[0];
      const n = fetched.filter((u) => u === url).length;
      return Promise.resolve(new Response(status === 200 ? `fresh ${n}` : `server said ${status}`, { status }));
    },
    setTimeout, clearTimeout,
    Response, Request, URL, Headers, Promise, Set, Map, console,
  };
  scope.self = scope;
  vm.runInNewContext(SW_SOURCE, scope, { filename: 'sw.js' });
  const fire = async (url: string) => {
    const request = { url, method: 'GET', mode: 'cors', headers: new Headers() };
    let responded: Promise<Response> | null = null;
    listeners.fetch({ request, respondWith: (p: Promise<Response>) => { responded = p; } });
    const res = await responded!;
    return { status: res.status, body: await res.text() };
  };
  // Cache writes are fire-and-forget in the worker; let them land.
  const settle = () => new Promise((resolve) => setImmediate(resolve));
  return { fire, fetched, writes, settle };
}

test.describe('#1713: sw.js on the deployed origin', () => {
  test('a module answered 503 twice is served from the cached copy, never cached as a 503', async () => {
    const w = loadWorker({ [TAG_MAP]: [200, 503, 503] });

    // First load: a good 200, which the worker caches (DEVELOPMENT_ORIGIN is false here).
    expect(await w.fire(TAG_MAP)).toEqual({ status: 200, body: 'fresh 1' });
    await w.settle();
    expect(w.writes, 'setup: the 200 is cached on the deployed origin').toEqual([{ url: TAG_MAP, status: 200 }]);

    // Deploy in progress: Pages answers 503 to the request and to its retry.
    expect(await w.fire(TAG_MAP), 'the page gets the cached module, not the 503').toEqual({ status: 200, body: 'fresh 1' });
    await w.settle();
    expect(w.fetched.filter((u) => u === TAG_MAP).length, 'the 503 is retried exactly once').toBe(3);
    expect(w.writes.filter((x) => x.status !== 200), 'a non-ok response is never cached').toEqual([]);
  });

  test('a 503 that clears on the retry returns the fresh copy and caches it', async () => {
    const w = loadWorker({ [TAG_MAP]: [503, 200] });
    expect(await w.fire(TAG_MAP)).toEqual({ status: 200, body: 'fresh 2' });
    await w.settle();
    expect(w.writes).toEqual([{ url: TAG_MAP, status: 200 }]);
  });

  test('a persistent 5xx with nothing cached reaches the page unchanged', async () => {
    for (const status of [502, 503, 504]) {
      const url = `${PAGES}/wb-starter/src/core/never-cached-${status}.js`;
      const w = loadWorker({ [url]: [status] });
      expect(await w.fire(url), `a real ${status} outage stays visible`).toEqual({ status, body: `server said ${status}` });
      await w.settle();
      expect(w.fetched.filter((u) => u === url).length, `${status} is retried once`).toBe(2);
      expect(w.writes, `${status} is never cached`).toEqual([]);
    }
  });

  test('a 404 is not retried and not replaced by a cached copy', async () => {
    const w = loadWorker({ [TAG_MAP]: [200, 404] });
    await w.fire(TAG_MAP);
    await w.settle();
    expect(await w.fire(TAG_MAP)).toEqual({ status: 404, body: 'server said 404' });
    expect(w.fetched.filter((u) => u === TAG_MAP).length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// 2. Real worker, real browser, a real server that answers 503
// ---------------------------------------------------------------------------
// wb-service-worker-required: this spec measures sw.js 5xx retry and cache fallback
test.use({ serviceWorkers: 'allow' });

let server: http.Server;
let origin: string;
let moduleStatus = 200;
const hits: Record<string, number> = {};

test.beforeAll(async () => {
  server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://x');
    hits[url.pathname] = (hits[url.pathname] || 0) + 1;
    if (url.pathname === '/sw.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
      res.end(SW_SOURCE);
    } else if (url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<!doctype html><title>sw 5xx</title><p>probe</p>');
    } else if (url.pathname.endsWith('.js')) {
      if (moduleStatus !== 200) { res.writeHead(moduleStatus, { 'Content-Type': 'text/plain' }); res.end('deploying'); return; }
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      res.end('export const from = "network";');
    } else {
      res.writeHead(404); res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test('#1713: in a real browser, a 503 on a cached module no longer breaks the import; an uncached one still fails', async ({ page }) => {
  moduleStatus = 200;
  await page.goto(origin + '/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    }
    // 127.0.0.1 is a development origin, where sw.js writes no cache (#1108);
    // seed the copy a production worker would have cached from an earlier load.
    const cache = await caches.open('x-probe-1713');
    await cache.put(location.origin + '/src/core/tag-map.js', new Response('export const from = "cache";', { headers: { 'Content-Type': 'text/javascript' } }));
  });
  expect(await page.evaluate(() => navigator.serviceWorker.controller !== null), 'setup: sw.js controls the page').toBe(true);

  // Control: with the server healthy, the worker returns the network copy.
  expect(await page.evaluate(async () => (await import('/src/core/tag-map.js?control')).from)).toBe('network');

  // The host now answers every module with 503, as Pages did during the deploy.
  moduleStatus = 503;
  const before = hits['/src/core/tag-map.js'] || 0;
  const importOf = (spec: string) => page.evaluate(async (s) => {
    try { return { loaded: (await import(s)).from }; } catch (err) { return { failed: (err as Error).name }; }
  }, spec);

  expect(await importOf('/src/core/tag-map.js'), 'the cached module loads despite the 503').toEqual({ loaded: 'cache' });
  expect((hits['/src/core/tag-map.js'] || 0) - before, 'the worker asked the server twice (one retry) before using the cache').toBe(2);

  // Nothing cached: the real outage still surfaces, as a failed import and a 503.
  expect(await importOf('/src/core/not-cached.js')).toEqual({ failed: 'TypeError' });
  expect(await page.evaluate(async () => (await fetch('/src/core/not-cached.js')).status)).toBe(503);
  moduleStatus = 200;
});
