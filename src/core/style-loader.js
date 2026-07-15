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
