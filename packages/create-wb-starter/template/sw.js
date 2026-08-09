/**
 * WB Starter Service Worker
 *
 * NETWORK-FIRST. A refresh (or opening the installed/standalone PWA) must
 * always see the latest deployed code — the cache only exists as an offline
 * fallback, never as the primary source. Bump CACHE_VERSION on release so any
 * previously-installed worker (including old cache-first versions of this
 * file from before this rewrite) evicts its stale cache on activate.
 *
 * Lives at the SITE ROOT (not /src/) — a service worker's default max scope
 * is the directory it's served from, and GitHub Pages can't send a custom
 * Service-Worker-Allowed header to widen it. Root placement is the only way
 * to control the whole site without relying on server config we don't have.
 */

const CACHE_VERSION = 'wb-cache-v2';

// App root derived from THIS worker's location, so precache URLs resolve
// under any base — domain root locally or /wb-starter/ on GitHub Pages.
const BASE = new URL('./', self.location).href;
const STATIC_ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'src/core/wb.js',
  BASE + 'src/core/site-engine.js',
  BASE + 'src/styles/themes.css',
  BASE + 'src/styles/site.css',
  BASE + 'config/site.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // Range requests (audio/video seeking, e.g. sample.wav) get a 206 Partial
  // Content response, which the Cache API explicitly refuses to store —
  // cache.put() rejects with "Partial response (status code 206) is
  // unsupported". Never attempt to cache these; just pass them straight
  // through to the network.
  if (event.request.headers.has('range')) {
    // <audio>/<video> elements commonly issue a small probe range request
    // (e.g. bytes=0-1) that gets superseded and aborted the instant a real
    // range request follows — that abort rejects this fetch. Uncaught, it
    // surfaced as "Uncaught (in promise) TypeError: Failed to fetch" on
    // every playback, even though the actual (non-aborted) range request
    // the player cares about succeeds fine. Swallow it same as the other
    // network-first paths below: never let a rejected fetch escape
    // respondWith() as an unhandled rejection.
    event.respondWith(
      fetch(event.request).catch(() => new Response(null, { status: 499, statusText: 'Client Closed Request' }))
    );
    return;
  }

  // Network-first: always try the network so a refresh gets current code.
  // Only fall back to the cached copy when the network fetch itself fails
  // (offline) — the cache is never allowed to shadow a live response.
  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok && response.status !== 206) {
        const clone = response.clone();
        caches.open(CACHE_VERSION)
          .then(cache => cache.put(event.request, clone))
          // A failed cache write must never break the response the page
          // actually gets — swallow it, the network response below still
          // returns fine either way.
          .catch(() => {});
      }
      return response;
    }).catch(() =>
      caches.match(event.request)
        .then(cached => cached || caches.match(BASE + 'index.html'))
        // Both the exact URL and the index.html fallback can miss (e.g. a
        // fresh install with nothing precached yet, or a base-path
        // mismatch) — respondWith() throws "Failed to convert value to
        // 'Response'" on undefined and takes the whole fetch down with it.
        // Always resolve to a real Response, even offline with no cache.
        .then(cached => cached || new Response('Offline and not cached', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        }))
    )
  );
});
