import { test, expect } from '../fixtures/offline';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

/**
 * #989: a deploy stayed invisible for up to 10 minutes. GitHub Pages serves
 * every file with Cache-Control: max-age=600, and a module imported by another
 * module has no ?v= key, so the browser answered from its HTTP cache. sw.js is
 * network-first -- but fetch(event.request) uses the default cache mode, which
 * consults that same HTTP cache, so "network-first" returned the stale copy.
 *
 * The worker must revalidate same-origin GETs (cache: 'no-cache': an unchanged
 * file costs a 304, a deployed one arrives at once) and leave cross-origin
 * requests (CDNs) alone. Run against the real sw.js in a stubbed worker scope.
 */
const SRC = fs.readFileSync(path.join(process.cwd(), 'sw.js'), 'utf8');
const ORIGIN = 'https://cielovistasoftware.github.io';

function loadWorker() {
  const listeners: Record<string, (e: any) => void> = {};
  const calls: Array<{ url: string; init: any }> = [];
  const scope: any = {
    location: new URL(ORIGIN + '/wb-starter/sw.js'),
    addEventListener: (type: string, fn: (e: any) => void) => { listeners[type] = fn; },
    skipWaiting: () => Promise.resolve(),
    clients: { claim: () => Promise.resolve() },
    caches: { open: async () => ({ addAll: async () => {}, put: async () => {} }), keys: async () => [], match: async () => undefined, delete: async () => true },
    fetch: (req: any, init?: any) => { calls.push({ url: typeof req === 'string' ? req : req.url, init }); return Promise.resolve(new Response('ok', { status: 200 })); },
    Response, Request, URL, Headers, Promise, console,
  };
  scope.self = scope;
  vm.runInNewContext(SRC, scope, { filename: 'sw.js' });
  const fire = async (url: string, opts: { mode?: string; range?: boolean } = {}) => {
    const headers = new Headers(opts.range ? { range: 'bytes=0-1' } : {});
    const request = { url, method: 'GET', mode: opts.mode || 'cors', headers };
    let responded: Promise<unknown> | null = null;
    listeners.fetch({ request, respondWith: (p: Promise<unknown>) => { responded = p; } });
    if (responded) await responded;
  };
  return { fire, calls };
}

test('same-origin GETs revalidate; cross-origin ones keep the default (#989)', async () => {
  const w = loadWorker();
  await w.fire(ORIGIN + '/wb-starter/src/core/wb.js');
  await w.fire(ORIGIN + '/wb-starter/', { mode: 'navigate' });
  await w.fire('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js');

  const byUrl = (u: string) => w.calls.find((c) => c.url === u);
  expect(byUrl(ORIGIN + '/wb-starter/src/core/wb.js')?.init?.cache,
    'a same-origin module must be revalidated, not served from the HTTP cache for 600s').toBe('no-cache');
  expect(byUrl(ORIGIN + '/wb-starter/')?.init?.cache,
    'a navigation must be revalidated too: stale HTML carries stale ?v= keys').toBe('no-cache');
  expect(byUrl('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js')?.init?.cache,
    'cross-origin requests keep the browser default').toBeUndefined();
});
