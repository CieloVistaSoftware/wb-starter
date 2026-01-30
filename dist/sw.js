"use strict";
/**
 * WB Starter Service Worker
 */
const STATIC_CACHE = 'wb-static-v1';
const DYNAMIC_CACHE = 'wb-dynamic-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/src/wb.js',
    '/src/core/site-engine.js',
    '/src/styles/themes.css',
    '/styles/site.css',
    '/config/site.json'
];
self.addEventListener('install', event => {
    event.waitUntil(caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_ASSETS).catch(() => { });
    }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => {
        return Promise.all(keys.filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map(key => caches.delete(key)));
    }).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET')
        return;
    event.respondWith(caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
            if (response.ok) {
                const clone = response.clone();
                caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, clone));
            }
            return response;
        }).catch(() => caches.match('/index.html'));
    }));
});
//# sourceMappingURL=sw.js.map