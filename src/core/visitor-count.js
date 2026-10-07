/**
 * Visitor count for the live site (#1245).
 *
 * John: "we need a visitor count of all hits on the index.html." The live site
 * is GitHub Pages, which runs none of our code on a request, so the count comes
 * from a hosted counter the page calls itself. John chose (2026-10-07): a hosted
 * counter, on the live site only, with the total shown in the footer.
 *
 * The counter is Abacus (abacus.jasoncameron.dev): no account and no key, CORS
 * open to any origin, and one GET both counts the hit and returns the new total
 * as `{"value": N}`. Its public read is the same key under /get/ (VISITOR_COUNT_READ_URL),
 * which is how anyone can read the total without adding to it.
 *
 * WHAT COUNTS: every boot of the site shell, i.e. every time index.html (or one
 * of its path copies, #1001) is loaded by the browser -- a first visit, a reload,
 * a bookmark, a deep link. Navigating between pages inside the loaded site does
 * NOT count again: no new request for index.html is made, so it is not a hit on
 * it, and counting it would let one visitor clicking around inflate the number.
 *
 * WHERE IT RUNS: only on the live host. Never on localhost, 127.0.0.1, a test
 * server or a fork's own github.io site (their visits are not ours to count).
 *
 * NEVER BREAKS THE PAGE: a counter that is down, slow, blocked by an ad blocker
 * or answering garbage leaves the footer as it was and writes nothing to the
 * console. Every failure is swallowed here; startVisitorCount() never throws and
 * its promise never rejects.
 */

/** The only host whose loads are counted: the live GitHub Pages site. */
export const LIVE_HOST = 'cielovistasoftware.github.io';

const COUNTER_ORIGIN = 'https://abacus.jasoncameron.dev';
const COUNTER_KEY = 'cielovistasoftware-wb-starter/index';

/** Counts one hit and answers the new total. */
export const VISITOR_COUNT_HIT_URL = `${COUNTER_ORIGIN}/hit/${COUNTER_KEY}`;
/** Reads the total without counting (public; for anyone checking the number). */
export const VISITOR_COUNT_READ_URL = `${COUNTER_ORIGIN}/get/${COUNTER_KEY}`;

/** A counter slower than this is abandoned; the page never waits on it. */
const TIMEOUT_MS = 8000;

/**
 * Whether loads on this host are counted.
 * @param {string} [hostname=location.hostname]
 * @returns {boolean}
 */
export function isLiveHost(hostname = location.hostname) {
  return hostname === LIVE_HOST;
}

/** Thousands separators for the total; a number, not a date or time. */
const COUNT_FORMAT = new Intl.NumberFormat('en-US');

/**
 * "12,345 visits" -- the footer's wording.
 * @param {number} total
 * @returns {string}
 */
export function visitsLabel(total) {
  return `${COUNT_FORMAT.format(total)} ${total === 1 ? 'visit' : 'visits'}`;
}

/**
 * Show the total in the footer, after the copyright line. Replaces an earlier
 * total rather than adding a second one.
 * @param {number} total
 * @param {Document} [doc=document]
 * @returns {HTMLElement|null} the element showing it, or null when there is no footer
 */
export function showVisitorCount(total, doc = document) {
  const host = doc.getElementById('footerLeft');
  if (!host) return null;
  let el = doc.getElementById('footerVisits');
  if (!el) {
    el = doc.createElement('span');
    el.id = 'footerVisits';
    el.className = 'footer__visits';
    el.title = 'Loads of this site counted since the counter started (#1245)';
    host.appendChild(el);
  }
  el.textContent = visitsLabel(total);
  return el;
}

/**
 * Count this load of the site and show the total. Call once per boot.
 * @param {{ hostname?: string, fetchImpl?: typeof fetch }} [options]
 * @returns {Promise<number|null>} the total, or null when not counted or anything failed
 */
export async function startVisitorCount({ hostname = location.hostname, fetchImpl = globalThis.fetch } = {}) {
  try {
    if (!isLiveHost(hostname) || typeof fetchImpl !== 'function') return null;
    const response = await fetchImpl(VISITOR_COUNT_HIT_URL, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      signal: globalThis.AbortSignal?.timeout?.(TIMEOUT_MS),
    });
    if (!response || !response.ok) return null;
    const body = await response.json();
    const total = Number(body && body.value);
    if (!Number.isFinite(total) || total < 1) return null;
    showVisitorCount(Math.floor(total));
    return Math.floor(total);
  } catch {
    // Down, slow, blocked or malformed: the page carries on without a number.
    return null;
  }
}
