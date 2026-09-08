/**
 * Just-in-time behavior CSS loading.
 *
 * site.css used to `@import` all 50 files in src/styles/behaviors/*.css
 * unconditionally on every page — a typical page uses a handful of
 * behaviors, not fifty (confirmed: home.html uses 9 wb-* tags + 6 x-*
 * behaviors out of ~75 available). ensureBehaviorCss() is called from
 * WB.inject()'s single choke point (both wb.js and wb-lazy.js), right
 * before a behavior function actually runs for the first time on a page —
 * so a file loads exactly when, and only when, something on the page
 * needs it, no matter whether that behavior was declared in static markup
 * or invoked programmatically later (toast/popover/notes all build their
 * content into document.body at runtime, so their CSS can only be found
 * this way — a static-markup scan would miss them entirely).
 *
 * <div x-grid> and <div x-demo> were once described here as real custom
 * elements that bypassed this hook, with x-demo.js calling
 * ensureBehaviorCss('demo') itself to compensate. Neither class was ever
 * registered (#1063): both are ordinary behaviors — tag-map.js maps
 * 'x-demo' -> 'demo' and index.js maps 'grid'/'demo' to their modules — so
 * both pass through WB.inject() and get their CSS here like everything else.
 * The compensating call and the classes are gone.
 */
import { BEHAVIOR_CSS_MAP } from '../styles/behavior-css-manifest.js';
import { elementMap, nativeMap, extensionMap } from './tag-map.js';
import { behaviors } from '../wb-viewmodels/index.js';

const BEHAVIORS_BASE = new URL('../styles/behaviors', import.meta.url).href;

/**
 * fileName -> the load, plus enough state to tell a FINISHED load from one
 * whose <link> was destroyed before it could finish (#961/#1075).
 *
 * Caching the bare promise was not safe. A <link> removed from the document
 * while still loading never fires `load` OR `error` — the browser simply
 * cancels it — so the cached promise stayed pending forever, and because it was
 * cached, every later injection of that behavior awaited the same dead promise
 * and hung with it. WB.inject() awaits ensureBehaviorCss() before running the
 * behavior, so those elements were never built and never stamped x-ready.
 *
 * Measured 2026-09-08, 1 run in 6 at 6 workers: after a page.setContent() (which
 * wipes <head> mid-load, and 29 spec files do it right after a goto), 23
 * injections were stuck permanently — `ripple x14, release, themecontrol, notes,
 * button x4, header, footer` — with NO behavior <link> left in the document,
 * proving the pending promises were cached ones rather than live loads.
 *
 * @type {Map<string, {promise: Promise<void>, settled: boolean, link: HTMLLinkElement|null}>}
 */
const loaded = new Map();

function loadCssFile(fileName) {
  const cached = loaded.get(fileName);
  // Reuse a load that FINISHED, or one whose <link> is still in the document
  // and can therefore still fire. Anything else is a corpse — start over.
  if (cached && (cached.settled || (cached.link && cached.link.isConnected))) {
    return cached.promise;
  }

  /** @type {{promise: Promise<void>, settled: boolean, link: HTMLLinkElement|null, settle: () => void}} */
  const entry = { promise: Promise.resolve(), settled: false, link: null, settle: () => {} };

  entry.promise = new Promise((resolve) => {
    const done = () => { entry.settled = true; resolve(); };
    entry.settle = done;
    if (typeof document === 'undefined') {
      done();
      return;
    }
    // The dataset wrote `data-wb-behavior-css` while this query looked for
    // `data-x-behavior-css` — a half-applied 4.0.0 rename, so the de-dupe
    // never once matched and only the Map above was preventing duplicate
    // <link>s. With the Map now able to discard a dead entry, this check is
    // what stops a re-load from stacking a second <link>, so it has to work.
    const existing = document.querySelector(`link[data-x-behavior-css="${fileName}"]`);
    if (existing) {
      done();
      return;
    }
    const link = document.createElement('link');
    entry.link = link;
    link.rel = 'stylesheet';
    link.href = `${BEHAVIORS_BASE}/${fileName}`;
    link.dataset.xBehaviorCss = fileName;
    // A CSS load failure shouldn't block the behavior itself from running —
    // an unstyled element is recoverable, a behavior that silently never
    // applies is a worse regression (this is exactly the schema-race bug's
    // failure mode, just for CSS instead of DOM).
    link.addEventListener('load', done, { once: true });
    link.addEventListener('error', done, { once: true });

    // Third terminal state: the <link> is REMOVED before it loads. The browser
    // cancels the request and fires neither event, so without this the promise
    // is simply abandoned — and every injection awaiting it is abandoned too
    // (#961/#1075). Nothing dies silently: removal settles the load exactly
    // like a failure does, since an unstyled element is recoverable and a
    // behavior that never runs is not.
    //
    // Notification, not a poll (Law 18), and scoped to the one parent rather
    // than the document subtree so it costs nothing on a large page.
    let removalObserver = null;
    const watchForRemoval = () => {
      if (typeof MutationObserver === 'undefined' || !link.parentNode) return;
      removalObserver = new MutationObserver(() => {
        if (!link.isConnected) { removalObserver.disconnect(); done(); }
      });
      removalObserver.observe(link.parentNode, { childList: true });
    };
    const stopWatching = () => { if (removalObserver) removalObserver.disconnect(); };
    link.addEventListener('load', stopWatching, { once: true });
    link.addEventListener('error', stopWatching, { once: true });

    // Cascade order matters: these files used to load via @import at the
    // very top of site.css, which resolves before ANY of site.css's own
    // rules — including the ones that deliberately override a behavior
    // file's legacy/duplicate selectors (e.g. site.css's own .x-spinner
    // rule exists specifically to neutralize a duplicate ring effects.css
    // also defines, #182). A plain appendChild() lands after site.css's
    // <link> in document order, flipping same-specificity cascade fights
    // like that one (confirmed live: JIT-loading effects.css this way
    // un-neutralized the duplicate spinner ring, #343). Insert
    // right before site.css's <link> instead, so behavior CSS still loses
    // any fight with site.css's own body, exactly as before.
    const siteCssLink = document.querySelector('link[rel="stylesheet"][href*="site.css"]');
    if (siteCssLink && siteCssLink.parentNode) {
      siteCssLink.parentNode.insertBefore(link, siteCssLink);
    } else {
      document.head.appendChild(link);
    }
    watchForRemoval();
  });

  loaded.set(fileName, entry);
  return entry.promise;
}

// A document REOPEN (document.open/write/close — which is what
// page.setContent() does, and 29 spec files call it right after a goto)
// removes every <link> in one shot. It fires neither `load` nor `error`, and
// measured on Chromium it delivers NO MutationObserver records for those
// removals either, so the per-link watch above cannot see it: 22 injections
// stayed in flight permanently after one such wipe (#1078).
//
// The document does announce it, though — readyState drops back to 'loading'
// when it is reopened, then climbs again, firing readystatechange. That is the
// event to sweep on: settle every load whose <link> is no longer in the
// document, because a detached <link> can never fire anything.
//
// Deliberately NOT time-based, and safe on a normal first load: this fires
// there too, but a link still loading is CONNECTED and is skipped. Only a
// genuine corpse is settled.
if (typeof document !== 'undefined') {
  document.addEventListener('readystatechange', () => {
    for (const entry of loaded.values()) {
      if (entry.settled) continue;
      if (entry.link && entry.link.isConnected) continue;
      entry.settle();
    }
  });
}

/**
 * Ensure every CSS file a behavior needs is loaded (or loading) before that
 * behavior runs. No-op for behaviors with no CSS mapping (many x-* behaviors
 * are pure JS with nothing to style, e.g. validator/draggable/copy).
 * @param {string} behaviorName
 * @returns {Promise<void>}
 */
export function ensureBehaviorCss(behaviorName) {
  const files = BEHAVIOR_CSS_MAP[behaviorName];
  if (!files || !files.length) return Promise.resolve();
  return Promise.all(files.map(loadCssFile)).then(() => undefined);
}

/**
 * Find every behaviorName a chunk of HTML would trigger, without inserting
 * it into the visible document (a detached <template> — parsing it doesn't
 * paint anything, so scanning is free).
 * @param {string} html
 * @returns {Set<string>}
 */
function behaviorsUsedIn(html) {
  const names = new Set();
  if (typeof document === 'undefined' || !html) return names;
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelectorAll('*').forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const elBehavior = elementMap[tag];
    if (elBehavior) names.add(elBehavior);

    for (const [selector, behaviorName] of Object.entries(nativeMap)) {
      try {
        if (el.matches(selector)) names.add(behaviorName);
      } catch (e) {
        // Detached-tree edge case on an exotic selector — skip it rather
        // than let one bad selector abort the whole scan.
      }
    }

    for (const attr of el.attributes) {
      if (!attr.name.startsWith('x-')) continue;
      if (extensionMap[attr.name]) {
        names.add(extensionMap[attr.name]);
        continue;
      }
      const candidate = attr.name.slice(2);
      if (behaviors[candidate]) names.add(candidate);
    }
  });
  return names;
}

/**
 * Preload every behavior CSS file a chunk of page HTML will need, BEFORE
 * that HTML is inserted into the live DOM.
 *
 * ensureBehaviorCss() alone (called from WB.inject()) is just-in-time per
 * ELEMENT — correct for content that only exists once a behavior decides to
 * build it (toast/popover/notes append to document.body at runtime, so
 * there's no earlier point to hook). But for a whole page's worth of markup
 * inserted in one shot (site-engine.js's page-navigation flow), waiting
 * until each element's own WB.inject() call happens is too late: the
 * innerHTML assignment already made everything visible, unstyled, one
 * frame earlier — then each behavior's CSS resolves at a slightly
 * different time as WB.scan() works through the page, and the browser
 * reflows every time one lands. That's a real, measurable Cumulative
 * Layout Shift regression (confirmed live via Chrome DevTools Performance:
 * CLS 0.14, "needs improvement", 3-shift cluster) — the exact guarantee
 * the old `@import` chain gave for free by being render-blocking (nothing
 * painted until ALL 46 files were ready) is gone once behavior CSS loads
 * async instead.
 *
 * Call this on the raw HTML string first and await it, THEN do the
 * innerHTML assignment — content only becomes visible once its own CSS is
 * already in place, matching the old zero-shift behavior, but scoped to
 * just what this page needs (not all 50 files).
 *
 * Capped at 2s so one slow/stalled CSS request can't hang page navigation
 * indefinitely — matches loadCssFile()'s own "never reject, worst case
 * resolve on error" philosophy, just with an upper bound on the wait
 * itself rather than the underlying request.
 * @param {string} html
 * @returns {Promise<void>}
 */
export function preloadCssForHtml(html) {
  const names = behaviorsUsedIn(html);
  if (!names.size) return Promise.resolve();
  const ready = Promise.all([...names].map(ensureBehaviorCss));
  const timeout = new Promise((resolve) => setTimeout(resolve, 2000));
  return Promise.race([ready, timeout]).then(() => undefined);
}
