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
  BASE + 'src/wb.js',
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

  // Network-first: always try the network so a refresh gets current code.
  // Only fall back to the cached copy when the network fetch itself fails
  // (offline) — the cache is never allowed to shadow a live response.
  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request).then(cached => cached || caches.match(BASE + 'index.html')))
  );
});
