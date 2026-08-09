/**
 * Selectable debug-trace category filter (#338).
 *
 * localStorage['wb-debug'] used to be strictly binary -- '1' turned on every
 * dlog() call in wb.js/wb-lazy.js at once (all [WB.scan]/[WB.observe]/
 * [WB.processSchema] chatter together), anything else meant silence. That
 * all-or-nothing model is why traceMediaLoads() (wb.js) had to be carved out
 * as its own bespoke always-on tracer -- isolating "just media loads" from
 * the rest of the noise had no other way to happen. This module generalizes
 * that escape hatch: 'wb-debug' now holds a comma-separated list of category
 * names (e.g. 'media,scan') and only dlog() calls tagged with a listed
 * category fire. '1' keeps meaning "everything on" and unset/'0' keeps
 * meaning "everything off", so existing muscle memory
 * (localStorage.setItem('wb-debug','1')) still works unchanged.
 *
 * traceMediaLoads() (wb.js) and traceCardMedia() (card.js) are deliberately
 * NOT gated through this filter -- both are always-on by design (per their
 * own header comments) and must keep firing no matter what's set here.
 *
 * Categories are read fresh on every check (not cached at module load), so
 * flipping localStorage.setItem('wb-debug', ...) takes effect on the very
 * next dlog() call -- no reload needed for anything that logs more than
 * once per page (e.g. observe()'s MutationObserver callback). A reload is
 * only needed to change the one-time "debug tracing: ON/OFF" banner each
 * module prints on boot.
 */

const STORAGE_KEY = 'wb-debug';

function readRaw() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return null;
  }
}

function parse(raw) {
  if (!raw || raw === '0') return { all: false, categories: new Set() };
  if (raw === '1') return { all: true, categories: new Set() };
  const categories = new Set(
    raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  );
  return { all: false, categories };
}

/**
 * @param {string} category
 * @returns {boolean}
 */
export function isTraceCategoryEnabled(category) {
  const { all, categories } = parse(readRaw());
  if (all) return true;
  if (!category) return false;
  return categories.has(String(category).toLowerCase());
}

/**
 * Human-readable summary of the current filter, for the boot-time
 * "debug tracing: ..." announce line.
 * @returns {string}
 */
export function traceStatusLabel() {
  const { all, categories } = parse(readRaw());
  if (all) return 'ON (all categories)';
  if (categories.size) return `ON (categories: ${[...categories].sort().join(', ')})`;
  return 'OFF';
}

/**
 * Builds a category-aware dlog(category, ...args) function.
 * @param {(...args: any[]) => void} [logFn]
 */
export function makeDlog(logFn = console.log.bind(console)) {
  return (category, ...args) => {
    if (isTraceCategoryEnabled(category)) logFn(...args);
  };
}

/**
 * Console-friendly setter — lets a category filter be changed live, mid
 * session, without hand-editing localStorage. Takes effect on the next
 * dlog() call (see module comment); reload only to change the boot banner.
 *   wbDebugTrace.set('scan,observe')  // just those categories
 *   wbDebugTrace.set(true)            // everything (same as '1')
 *   wbDebugTrace.set(false)           // silence (same as unset)
 *   wbDebugTrace.status()             // current filter, human-readable
 * @param {string|boolean|null|undefined} value
 */
export function setDebugTrace(value) {
  try {
    if (value === null || value === undefined || value === false) {
      localStorage.removeItem(STORAGE_KEY);
    } else if (value === true) {
      localStorage.setItem(STORAGE_KEY, '1');
    } else {
      localStorage.setItem(STORAGE_KEY, String(value));
    }
  } catch (e) {
    // localStorage unavailable (private mode, SSR, etc.) — best-effort only.
  }
}

if (typeof window !== 'undefined') {
  /** @type {any} */ (window).wbDebugTrace = {
    set: setDebugTrace,
    status: traceStatusLabel,
  };
}
