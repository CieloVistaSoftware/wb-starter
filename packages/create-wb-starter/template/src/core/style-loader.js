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
 * <wb-grid> and <wb-demo> are real custom elements (never migrated to the
 * WB.inject() behavior-dispatch path — see wb.js's own comment on why) so
 * they never pass through the hook this feeds. wb-demo.js calls
 * ensureBehaviorCss('demo') directly from its own connectedCallback for
 * that reason. wb-grid's own CSS (layout.css) stays an unconditional
 * import in site.css instead — it's under 1.5KB, cheaper than special-
 * casing a hook for one file.
 */
import { BEHAVIOR_CSS_MAP } from '../styles/behavior-css-manifest.js';
import { elementMap, nativeMap, extensionMap } from './tag-map.js';
import { behaviors } from '../wb-viewmodels/index.js';

const BEHAVIORS_BASE = new URL('../styles/behaviors', import.meta.url).href;

/** @type {Map<string, Promise<void>>} fileName -> in-flight/settled load promise */
const loaded = new Map();

function loadCssFile(fileName) {
  let promise = loaded.get(fileName);
  if (promise) return promise;

  promise = new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve();
      return;
    }
    const existing = document.querySelector(`link[data-wb-behavior-css="${fileName}"]`);
    if (existing) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${BEHAVIORS_BASE}/${fileName}`;
    link.dataset.wbBehaviorCss = fileName;
    // A CSS load failure shouldn't block the behavior itself from running —
    // an unstyled element is recoverable, a behavior that silently never
    // applies is a worse regression (this is exactly the schema-race bug's
    // failure mode, just for CSS instead of DOM).
    link.addEventListener('load', () => resolve(), { once: true });
    link.addEventListener('error', () => resolve(), { once: true });

    // Cascade order matters: these files used to load via @import at the
    // very top of site.css, which resolves before ANY of site.css's own
    // rules — including the ones that deliberately override a behavior
    // file's legacy/duplicate selectors (e.g. site.css's own .wb-spinner
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
  });

  loaded.set(fileName, promise);
  return promise;
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
