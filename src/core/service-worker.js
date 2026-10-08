/**
 * Service worker lifecycle — the ONE place that decides whether sw.js may run
 * on this origin, and the ONE implementation of "take it away again".
 *
 * #1108: a worker registered on the dev origin served a four-day-old
 * src/core/version.js and a 22-byte copy of a 153 KB page while the dev server
 * was serving the right files. `fetch(url, {cache:'no-store'})` does not bypass
 * a service worker, so even the usual staleness check reported the stale answer.
 * On a development origin what the browser shows must be what is on disk, so
 * the worker never registers there, and a registration an older build left
 * behind is removed together with its caches.
 */

const DEVELOPMENT_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * True when the page is served from this machine — the origin development
 * happens on, where a caching layer can only hide what is on disk.
 *
 * Safe outside a browser (#1732): error-logger.js asks this at module load,
 * and Node specs import modules that import the logger. There is no
 * `location` there, and no origin, so the answer is false.
 * @param {string} [hostname=location.hostname]
 * @returns {boolean}
 */
export function isDevelopmentOrigin(hostname = typeof location === 'undefined' ? '' : location.hostname) {
  return DEVELOPMENT_HOSTNAMES.has(hostname);
}

/**
 * Unregisters every service worker registration for this origin and deletes
 * every Cache Storage entry. Never throws: a partial failure is reported and
 * whatever could be removed stays removed.
 * @param {string} [label='[sw]'] prefix for the warning, naming the caller
 * @returns {Promise<boolean>} true when everything was removed
 */
export async function removeServiceWorkers(label = '[sw]') {
  let complete = true;
  // Each step is attempted whatever happened to the other: a registration that
  // will not go is no reason to keep its stale caches, nor the reverse.
  try {
    if (navigator.serviceWorker) {
      const regs = await navigator.serviceWorker.getRegistrations();
      const results = await Promise.all(regs.map((r) => r.unregister()));
      if (results.includes(false)) throw new Error('a registration refused to unregister');
    }
  } catch (err) {
    complete = false;
    console.warn(`${label} unregister partial failure:`, err && err.message);
  }
  try {
    if (window.caches) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((k) => window.caches.delete(k)));
    }
  } catch (err) {
    complete = false;
    console.warn(`${label} clear-cache partial failure:`, err && err.message);
  }
  return complete;
}

const RELEASED_FLAG = 'wb-sw-released';

/**
 * Development-origin side of #1108. Removes any registration and its caches.
 * If a worker was CONTROLLING this page, unregistering does not release it —
 * control ends only when the page unloads, and until then the worker's fetch
 * handler keeps answering requests and re-filling the cache just deleted. So
 * the page reloads once, out of its control. The session flag bounds that to
 * one reload per tab even if a browser were to keep the page controlled.
 * @returns {Promise<void>}
 */
export async function releaseDevelopmentOrigin() {
  const controlled = !!navigator.serviceWorker.controller;
  const removed = await removeServiceWorkers('[sw]');
  if (!controlled || !removed) return;
  try {
    if (sessionStorage.getItem(RELEASED_FLAG)) return;
    sessionStorage.setItem(RELEASED_FLAG, '1');
  } catch {
    return; // no session storage, no way to bound the reload: do not reload
  }
  console.info('[sw] #1108: removed a service worker from this development origin; reloading once so it no longer serves this page');
  location.reload();
}
