// Ensure WB is declared on window for type safety (for TS/IDE, no-op at runtime)
// @ts-ignore
if (typeof window !== 'undefined' && typeof window.WB === 'undefined') {
  /** @type {any} */ (window).WB = undefined;
}

// Debug logging — silent unless localStorage['wb-debug'] names a category
// (or is '1' for everything). Was forced true|| project-wide for a while
// ("turn the tracing on until I tell you to turn it off") but that flooded
// the console with [WB.scan]/[WB.observe] noise unrelated to whatever was
// actually being debugged. Reverted per "filter out all tracing except the
// blank video get and subsequent paint" — traceMediaLoads() below (always-on,
// independent of this flag) was carved out as a one-off fix for that; #338
// generalizes it into the selectable dlog(category, ...) filter below so the
// next category doesn't need its own bespoke carve-out. See debug-trace.js.
const _wbClog = console.log.bind(console);
const dlog = makeDlog(_wbClog);

// Trace lines that only print a tag name (e.g. "wb-card") are useless for
// telling apart multiple instances of the same tag on one page. elLabel()
// always includes an identifier: the element's real id if it has one,
// otherwise a stable auto-assigned trace id (assigned once per element on
// first reference, so repeated log lines about the SAME element show the
// SAME auto-id and can be correlated).
const _traceIds = new WeakMap();
let _traceIdSeq = 0;
function elLabel(el) {
  if (!el || !el.tagName) return String(el);
  const tag = el.tagName.toLowerCase();
  if (el.id) return `<${tag} id="${el.id}">`;
  if (!_traceIds.has(el)) _traceIds.set(el, ++_traceIdSeq);
  return `<${tag} id="(auto-${_traceIds.get(el)})">`;
}

// The tracing-state announcement itself lives in main.js (2nd console line,
// right after the version banner) so it appears in one predictable place
// regardless of which core module a page happens to load.

// Narrow, always-on (independent of WB_DEBUG) trace for exactly one thing:
// "did this <img>/<video> actually GET data, and did a frame actually
// PAINT" -- per "filter out all tracing except the blank video get and
// subsequent paint." Everything else (WB.scan/WB.observe chatter) stays
// behind the normal WB_DEBUG gate above.
//
// <video> does NOT fire a generic 'load' event for its media resource --
// that's an <img>-only event (HTMLMediaElement uses loadstart/loadeddata/
// canplay/etc instead). The previous version of this tracer only listened
// for 'load', so video "loaded ok" never actually logged, silently -- real
// bug in the tracer itself, found while narrowing this down. 'loadeddata'
// is the correct video-equivalent: a decodable frame is available.
//
// A GET resolving is not the same as a frame actually PAINTING to screen
// (readyState can reach HAVE_CURRENT_DATA without a single frame ever
// having been composited, e.g. if the element is display:none or 0-size).
// requestVideoFrameCallback (Chromium/Edge) confirms the real thing: the
// browser about to paint a decoded frame. Falls back to just logging
// 'loadeddata' where that API isn't available (older/other browsers).
function traceMediaLoads() {
  if (typeof document === 'undefined') return;
  const start = new WeakMap();

  function confirmPaint(video, src, getMs) {
    if (typeof video.requestVideoFrameCallback === 'function') {
      video.requestVideoFrameCallback((now, metadata) => {
        _wbClog(`[WB:trace] VIDEO PAINTED first frame src=${src} get=${getMs}ms mediaTime=${metadata.mediaTime.toFixed(2)}s ${metadata.width}x${metadata.height}`);
      });
    } else {
      _wbClog(`[WB:trace] VIDEO has data (no requestVideoFrameCallback support to confirm actual paint) src=${src} get=${getMs}ms ${video.videoWidth}x${video.videoHeight}`);
    }
  }

  document.addEventListener('loadeddata', (ev) => {
    const el = ev.target;
    if (!(el instanceof HTMLVideoElement)) return;
    const t0 = start.get(el);
    const ms = t0 ? Math.round(performance.now() - t0) : null;
    const src = el.currentSrc || el.src;
    if (el.videoWidth === 0 || el.videoHeight === 0) {
      _wbClog(`[WB:trace] VIDEO GET completed but 0x0 -- blank frame, nothing to paint. src=${src} get=${ms}ms`);
      return;
    }
    confirmPaint(el, src, ms);
  }, true);
  document.addEventListener('load', (ev) => {
    const el = ev.target;
    if (!(el instanceof HTMLImageElement)) return;
    const t0 = start.get(el);
    const ms = t0 ? Math.round(performance.now() - t0) : null;
    if (el.naturalWidth === 0) {
      _wbClog(`[WB:trace] IMG GET completed but 0x0 natural size (likely browser intervention, not a real error) src=${el.src} get=${ms != null ? ms + 'ms' : ''}`, el);
    }
  }, true);
  document.addEventListener('error', (ev) => {
    const el = ev.target;
    if (!(el instanceof HTMLImageElement) && !(el instanceof HTMLVideoElement) && !(el instanceof HTMLAudioElement)) return;
    const t0 = start.get(el);
    const ms = t0 ? Math.round(performance.now() - t0) : null;
    _wbClog(`[WB:trace] ${el.tagName} GET FAILED src=${el.src} ${ms != null ? ms + 'ms' : ''}`, el.error || ev);
  }, true);
  // Record start time as soon as each media element gets a src, so the GET/paint logs above can report elapsed time.
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        node.querySelectorAll?.('img[src],video[src],audio[src]').forEach(el => { if (!start.has(el)) start.set(el, performance.now()); });
        if (node.matches?.('img[src],video[src],audio[src]') && !start.has(node)) start.set(node, performance.now());
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
  document.querySelectorAll('img[src],video[src],audio[src]').forEach(el => start.set(el, performance.now()));
  _wbClog('[WB:trace] media load tracing active — every <img>/<video>/<audio> load/error will be logged');
}
/**
 * WB - Web Behavior
 * =================
 * Pure JavaScript behavior injection library.
 * No web components. No classes. Just functions that enhance HTML.
 * 
 * @version 3.0.0
 * @license MIT
 * 
 * v3.0 Changes:
 * - Integrated MVVM Schema Builder
 * - DOM generation from $view schemas
 * - $methods binding support
 * - $cssAPI documentation support
 * 
 * Usage:
 *   <wb-card  data-title="Hello">Content</div>
 *   <wb-card title="Hello">Content</wb-card>
 *   
 *   <script type="module">
 *     import WB from './wb.js';
 *     WB.init();
 *   </script>
 */

import { behaviors } from '../wb-viewmodels/index.js';
import { Events } from './events.js';
import { Theme } from './theme.js';
import { getNativeBehavior, nativeMap, getElementBehavior } from './tag-map.js';
import { semanticPropertyMappings } from './semantic-attributes.js';
import { makeDlog, traceStatusLabel } from './debug-trace.js';

// Register Layout Custom Elements
import '../wb-viewmodels/wb-grid.js';
// wb-column/wb-cluster/wb-stack/wb-row/wb-search/wb-accordion are BEHAVIORS
// (cluster/stack/flex/searchfield/accordion), not classes that
// `extends HTMLElement` (v3) — the extends-HTMLElement wrappers were removed
// (#279). Mapped to their behaviors in tag-map.js / wb-lazy.js.
import '../wb-viewmodels/wb-demo.js';

import { getConfig, setConfig } from './config.js';
import { pubsub } from './pubsub.js';
import SchemaBuilder from './mvvm/schema-builder.js';
import { ensureBehaviorCss } from './style-loader.js';

// Global dev/test diagnostics: surface uncaught errors/rejections to console so Playwright traces capture them.
try {
  if (typeof window !== 'undefined') {
    window.addEventListener('error', ev => {
      try { console.error('[WB:UNCAUGHT]', ev.message || ev && ev.error && ev.error.message, ev.error && ev.error.stack); } catch (e) { /* best-effort */ }
    });
    window.addEventListener('unhandledrejection', ev => {
      try { console.error('[WB:UNHANDLEDREJ]', ev.reason && (ev.reason.stack || ev.reason)); } catch (e) { /* best-effort */ }
    });
  }
} catch (e) { /* best-effort */ }

// Auto-injection mappings (from tag-map.js)
// Convert nativeMap {selector: behavior} to [{selector, behavior}]
const autoInjectMappings = Object.entries(nativeMap).map(([selector, behavior]) => ({
  selector,
  behavior
}));

// Reserved attributes that should never trigger a behavior
const RESERVED_ATTRIBUTES = new Set([
  'id', 'class', 'style', 'title', 'hidden', 'dir', 'lang', 'accesskey',
  'contenteditable', 'contextmenu', 'spellcheck', 'tabindex', 'translate',
  'role', 'slot', 'part', 'is', 'shadowroot', 'xmlns',
  'src', 'href', 'alt', 'type', 'name', 'value', 'placeholder',
  'disabled', 'checked', 'selected', 'readonly', 'required', 'multiple',
  'action', 'method', 'target', 'rel', 'for', 'step', 'min', 'max',
  'rows', 'cols', 'width', 'height', 'loading', 'decoding',
  'poster', 'preload', 'autoplay', 'controls', 'loop', 'muted', 'playsinline',
  'crossorigin', 'integrity', 'referrerpolicy', 'accept', 'autocomplete',
  'autofocus', 'capture', 'download', 'enctype', 'form', 'formaction',
  'formenctype', 'formmethod', 'formnovalidate', 'formtarget', 'list',
  'maxlength', 'minlength', 'pattern', 'size', 'wrap'
]);

/**
 * Get implicit behavior for an element based on its type
 * Uses tag-map.js getNativeBehavior for matching
 * @param {HTMLElement} element 
 * @returns {string|null} Behavior name or null
 */
function getAutoInjectBehavior(element) {
  // Skip if explicitly ignored
  if (element.hasAttribute('x-ignore')) return null;

  // Note: We do NOT skip if other behaviors are present.
  // Auto-injection is additive unless explicitly ignored.
  // The inject() function handles duplicate prevention.

  // Use tag-map.js getNativeBehavior for efficient matching
  const candidate = getNativeBehavior(element);

  if (!candidate) return null;

  // `variant` is a strong, unambiguous signal of intent on its own: a plain
  // <button variant="primary"> is never accidental, so it triggers its
  // mapped native behavior regardless of the global autoInject setting.
  // Without this, a page whose whole point is demonstrating bare
  // variant-styled native elements (pages/behaviors.html) renders every one
  // of them with zero classes/behavior whenever autoInject is off (its
  // documented, correct default per #328) -- confirmed live: every button
  // variant showed the identical unstyled background.
  if (!getConfig('autoInject') && !element.hasAttribute('variant')) return null;

  // Check if candidate is already explicitly applied
  // We don't need to check here because inject() handles duplicates.
  // But we might want to avoid the call if we know it's there.
  const prefix = getConfig('prefix') || 'x';
  if (element.hasAttribute(`${prefix}-${candidate}`)) return null;
  if (element.hasAttribute(candidate) && !RESERVED_ATTRIBUTES.has(candidate)) return null;
  if (element.hasAttribute(`x-${candidate}-init`)) return null;

  // A DIFFERENT explicit x-{behavior} attribute already opts this element
  // into a richer, deliberate behavior -- e.g. <input type="text"
  // x-password"> should only get password()'s show/hide-toggle wrapper,
  // never ALSO the generic native-auto-inject input() wrapper racing to
  // wrap the same element a second time. Generic native auto-inject is
  // additive with genuinely independent modifiers (x-ripple on an
  // <article>, say) but not with another IS-A-ish behavior for the same
  // element.
  const prefixAttr = `${prefix}-`;
  for (const attr of element.attributes) {
    if (!attr.name.startsWith(prefixAttr)) continue;
    const other = attr.name.slice(prefixAttr.length);
    if (other !== candidate && behaviors[other]) return null;
  }

  return candidate;
}

// Track applied behaviors for cleanup
const applied = new WeakMap();
// Track pending injections to prevent re-entry
const pending = new WeakMap();
// Track schema-processed elements
const schemaProcessed = new WeakSet();
// Track elements currently mid-processSchema() (#312 follow-up): scan()'s
// schema loop, observe()'s MutationObserver, and schema-builder's own
// internal WB.inject() call can all independently reach processSchema() for
// the SAME element while its schema's first-ever fetch is still in flight —
// schemaProcessed is only set AFTER that fetch resolves, so none of the
// concurrent callers see it in time. Previously masked by the old bulk
// loadSchemas() call, which pre-warmed every schema into the registry
// before scan() ever ran, so this fetch was never actually in flight during
// scan(). Claiming synchronously (before the first await) closes the race.
const schemaPending = new WeakSet();

/**
 * WB - Web Behavior Core
 */
const WB = {
  version: '3.0.0',
  behaviors,
  pubsub,
  
  // Expose SchemaBuilder for direct access
  schema: SchemaBuilder,

  /**
   * Inject a behavior into an element
   * @param {HTMLElement|string} element - Element or selector
   * @param {string} behaviorName - Name of behavior to inject
   * @param {Object} options - Behavior options (override data attributes)
   * @returns {Promise<Function|null>} Cleanup function or null if failed
   */
  async inject(element, behaviorName, options = {}) {
    // Resolve element if string selector
    if (typeof element === 'string') {
      const found = document.querySelector(element);
      element = (found instanceof HTMLElement) ? found : null;
    }

    if (!element || !(element instanceof HTMLElement)) {
      console.warn(`[WB] Invalid element for behavior: ${behaviorName}`);
      return null;
    }

    // Check if behavior exists
    if (!behaviors[behaviorName]) {
      // Not all schemas have behaviors - that's OK
      if (!options.schemaProcessed) {
        console.warn(`[WB] Unknown behavior: ${behaviorName}`);
      }
      return null;
    }

    // Check if already applied
    const elementBehaviors = applied.get(element) || [];
    if (elementBehaviors.some(b => b.name === behaviorName)) {
      return null; // Already applied
    }

    // Check if pending
    let elementPending = pending.get(element);
    if (!elementPending) {
      elementPending = new Set();
      pending.set(element, elementPending);
    }
    if (elementPending.has(behaviorName)) {
      return null; // Already pending
    }
    elementPending.add(behaviorName);

    try {
      // Just-in-time CSS: load this behavior's stylesheet(s) before it
      // touches the DOM, so there's no flash of unstyled content on a
      // behavior's first use in a session (#342).
      await ensureBehaviorCss(behaviorName);

      // Apply behavior
      // Pass schemaProcessed flag so behavior knows DOM is already built
      const result = behaviors[behaviorName](element, options);
      let cleanup = result;
      
      if (result instanceof Promise) {
        cleanup = await result;
      }

      // Track for cleanup
      elementBehaviors.push({ name: behaviorName, cleanup });
      applied.set(element, elementBehaviors);

      pubsub.publish('wb:inject', { element, behavior: behaviorName });

      return cleanup;
    } catch (error) {
      // Pass the full Error object for stack trace extraction
      Events.error(`WB:${behaviorName}`, error, {
        element: element.tagName,
        id: element.id,
        behavior: behaviorName
      });
      
      // Mark element as having an error
      element.setAttribute('x-error', 'true');
      
      return null;
    } finally {
      // Remove from pending
      elementPending.delete(behaviorName);
      if (elementPending.size === 0) {
        pending.delete(element);
      }
    }
  },

  /**
   * Remove a specific behavior from an element
   * @param {HTMLElement} element - Target element
   * @param {string} behaviorName - Behavior to remove (or all if not specified)
   */
  remove(element, behaviorName = null) {
    const elementBehaviors = applied.get(element);
    if (!elementBehaviors) return;

    if (behaviorName) {
      // Remove specific behavior
      const index = elementBehaviors.findIndex(b => b.name === behaviorName);
      if (index !== -1) {
        const { cleanup } = elementBehaviors[index];
        if (typeof cleanup === 'function') cleanup();
        elementBehaviors.splice(index, 1);
        pubsub.publish('wb:remove', { element, behavior: behaviorName });
      }
    } else {
      // Remove all behaviors
      elementBehaviors.forEach(({ name, cleanup }) => {
        if (typeof cleanup === 'function') cleanup();
        pubsub.publish('wb:remove', { element, behavior: name });
      });
      applied.delete(element);
    }
  },

  /**
   * Process element through schema builder (v3.0)
   * Builds DOM structure from schema $view before applying behaviors
   * @param {HTMLElement} element - Element to process
   * @param {string} schemaName - Schema name (optional, auto-detected)
   */
  async processSchema(element, schemaName = null, blocking = false) {
    if (schemaProcessed.has(element)) return;

    // A tag either HAS a def or it doesn't -- schema and behavior must never
    // both try to own the same element's DOM (#279). BUT: not every
    // behavior is self-sufficient -- some (card.js's whole family, demo.js,
    // details.js, stack/searchfield/cluster/flex/accordion) build their
    // ENTIRE DOM unconditionally and never need schema's pre-built $view;
    // others (header.js confirmed live, likely many more of the 74 tags
    // with both a behavior AND a schema.json) are the OPPOSITE -- they
    // never build their own structure at all and EXPECT schema to have
    // already built it. A blanket "exclude every tag with a behavior" rule
    // was tried and reverted: it broke header.spec.ts (and presumably many
    // others) site-wide, ~170 test failures in one run, because it deletes
    // schema-dependent tags' DOM outright instead of fixing a race. So this
    // stays a per-tag list of tags CONFIRMED (by reading the actual
    // behavior source) to build their own complete DOM unconditionally --
    // matching schema-builder.js's own SCHEMA_EXCLUDED_TAGS exactly. Do not
    // widen this to "every tag with a behavior" again without reading each
    // new tag's behavior source first.
    //
    // wb-modal's "Open Modal" trigger (#305 -- the dialog schema's $view
    // unconditionally rebuilt the trigger's children before dialog.js's
    // TRIGGER mode ever got a chance to attach its click handler; gated on
    // the modal-title/modal-content attributes, not just the tag, since
    // #279 widened dialog.js's own trigger-mode detection the same way so
    // x-modal on any element still works).
    if (element.tagName === 'WB-MODAL' && (element.hasAttribute('modal-title') || element.hasAttribute('modal-content'))) {
      return;
    }

    // wb-demo (#312 -- pre.js's "view source" toggle silently stopped
    // responding whenever WB.scan()'s schema loop raced WBDemo.
    // connectedCallback(), because buildStructure()'s empty-$view fallback
    // re-parses element.innerHTML as a string, producing a listener-less
    // look-alike).
    if (element.tagName === 'WB-DEMO') {
      return;
    }

    // wb-details (#305/#336 -- schema's "content" node type discarded the
    // element's real children into an empty div, which details() then
    // wrapped as if it were the real content -- summary duplicated, real
    // answer text gone).
    if (element.tagName === 'WB-DETAILS') {
      return;
    }

    // wb-cluster/wb-stack/wb-row/wb-search/wb-accordion are owned entirely
    // by their behaviors (cluster/stack/flex/searchfield/accordion --
    // tag-map.js) since their `extends HTMLElement` wrapper classes were
    // removed (#279). _detectSchemaName() below derives a schema name from
    // tag-map.js's BEHAVIOR name regardless of whether a schema.json
    // actually exists for it -- for these 5 tags that's either a dead fetch
    // that just 404s (confirmed live: "flex.schema.json 404" from <wb-row>)
    // or a REAL schema.json that silently double-processes the element
    // (stack.schema.json).
    if (element.tagName === 'WB-CLUSTER' || element.tagName === 'WB-STACK' ||
        element.tagName === 'WB-ROW' || element.tagName === 'WB-SEARCH' ||
        element.tagName === 'WB-ACCORDION') {
      return;
    }

    // wb-article/wb-articles: article.js now builds their entire structure
    // itself, unconditionally (same self-sufficient pattern as the card
    // family below) -- matches schema-builder.js's own SCHEMA_EXCLUDED_TAGS.
    if (element.tagName === 'WB-ARTICLE' || element.tagName === 'WB-ARTICLES') {
      return;
    }

    // wb-select: semantics/select.js now builds a REAL <select>/<option>
    // tree for this tag itself (self-sufficient) -- matches
    // schema-builder.js's own SCHEMA_EXCLUDED_TAGS. Schema's old $view
    // built a fake <button>/<div>/<ul> widget with no real <select>
    // anywhere in it; must never race with or override the real one.
    if (element.tagName === 'WB-SELECT') {
      return;
    }

    // wb-card*: every card-family function (card.js) owns its DOM
    // completely (unconditional element.innerHTML='' + full rebuild, none
    // schema-dependent -- confirmed by reading every one of the 19 card
    // functions). loadSchemaFile()'s async fetch resolving AFTER the real
    // behavior already built (and, for cardimage/cardvideo, already
    // LOADED) the real content wipes it via that same innerHTML=''. This
    // was the "cardimage/cardvideo not showing, esp. first nav to
    // Components from Home/Behaviors" bug -- confirmed live via
    // [WB:card-media] tracing (card.js): PAINTED succeeds, then a stale
    // check ~2s later shows the element removed from the DOM entirely.
    if (element.tagName.startsWith('WB-CARD')) {
      return;
    }

    // wb-skeleton: skeleton.schema.json has a real, non-empty $view; skeleton()
    // (feedback.js) unconditionally rebuilds via element.innerHTML='' with no
    // schemaProcessed-aware cooperation — same latent race as the card family,
    // found auditing schemas during this same investigation (not a live
    // complaint). Matches schema-builder.js's own SCHEMA_EXCLUDED_TAGS.
    if (element.tagName === 'WB-SKELETON') {
      return;
    }

    // Get schema name from tag or x-* attributes
    const name = schemaName || WB._detectSchemaName(element);
    dlog('processSchema', `[WB.processSchema] Processing element ${elLabel(element)}, detected schema: ${name}`);
    if (!name) return;

    // Claim this element before the first await — a concurrent caller
    // (scan()'s loop, observe()'s MutationObserver, schema-builder's own
    // WB.inject() call) racing in during the schema fetch below must bail
    // here instead of independently fetching/processing the same element.
    if (schemaPending.has(element)) return;
    schemaPending.add(element);

    try {
      // Check if schema exists
      let schema = SchemaBuilder.getSchema(name);
      if (!schema) {
        dlog('processSchema', `[WB] Schema for "${name}" not registered yet — fetching on demand`);
        try {
          // If caller requested blocking behavior (initial scan), await the fetch so processing is deterministic
          const loaded = await SchemaBuilder.loadSchemaFile(`${name}.schema.json`);
          if (!loaded) return;
          schema = SchemaBuilder.getSchema(name);
          if (!schema) return;
        } catch (err) {
          console.warn('[WB] on-demand schema fetch failed:', err && err.message);
          return;
        }
      }

      // Process through schema builder (builds DOM from $view)
      try {
        dlog('processSchema', `[WB.processSchema] Calling SchemaBuilder.processElement for ${elLabel(element)}`);
        SchemaBuilder.processElement(element, name);
        schemaProcessed.add(element);
        element.setAttribute('x-schema', name);
        dlog('processSchema', `[WB.processSchema] Schema processing complete for ${elLabel(element)}`);
      } catch (err) {
        console.error('[WB] processSchema failed for', name, err && err.message);
      }
    } finally {
      schemaPending.delete(element);
    }
  },
  
  /**
   * Detect schema name from element
   * Uses tag-map.js to resolve wb-* tags to behavior names
   * @private
   */
  _detectSchemaName(element) {
    const tagName = element.tagName.toLowerCase();
    
    // <wb-card> → card (using tag-map.js)
    if (tagName.startsWith('wb-')) {
      const behavior = getElementBehavior(tagName);
      return behavior || null;
    }
    
    // → ERROR (Strict Mode)
    if (element.hasAttribute('x-behavior')) {
      // Schema detection handled by scanner/observer error logging
      return null;
    }
    
    return null;
  },

  /**
   * Scan DOM for x-* behaviors, wb-* custom elements, and detect legacy data-wb usage
   * @param {HTMLElement} root - Root element to scan (default: document.body)
   * @returns {Promise<void>}
   */
  async scan(root = document.body) {
    dlog('scan', `[WB.scan] Starting scan on root:`, root.tagName || 'document.body');
    const promises = [];
    const behaviorNames = Object.keys(behaviors);
    const knownBehaviors = new Set(behaviorNames);
    const prefix = getConfig('prefix') || 'x'; // Default to x-
    const useSchemas = getConfig('useSchemas');
    dlog('scan', `[WB.scan] useSchemas =`, useSchemas);

    // v3.0: Process wb-* custom element tags through schema builder first
    if (useSchemas) {
      dlog('scan', `[WB.scan] useSchemas is true, scanning for wb-* elements in root:`, root.tagName || 'document.body');
      // Collect promises so we can await schema-built elements before continuing
      const schemaPromises = [];
      root.querySelectorAll('*').forEach(el => {
        const htmlEl = /** @type {HTMLElement} */ (el);
        const tag = htmlEl.tagName.toLowerCase();
        if (tag.startsWith('wb-') && tag !== 'wb-view') {
          dlog('scan', `[WB.scan] Found wb-* element: ${elLabel(htmlEl)}`);
          // WB.processSchema is async-capable; collect the promise and allow it to load schemas on-demand
          try {
            const p = WB.processSchema(htmlEl, null, /*blocking*/ true);
            if (p && typeof p.then === 'function') schemaPromises.push(p);
          } catch (err) {
            console.warn('[WB.scan] processSchema threw:', err && err.message);
          }
        }
      });

      // Await processing of schema-built elements to make injection deterministic
      if (schemaPromises.length) {
        dlog('scan', `[WB.scan] Awaiting ${schemaPromises.length} schema processing promises`);
        await Promise.all(schemaPromises);
        dlog('scan', `[WB.scan] Schema processing complete`);
      } else {
        dlog('scan', `[WB.scan] No wb-* elements found to process`);
      }
    } else {
      dlog('scan', `[WB.scan] useSchemas is false, skipping schema processing`);
    }

    // #305: wb-* custom tags that have a REAL behavior but deliberately NO
    // schema (schema-builder.js's own detectSchema() explicitly excludes
    // wb-modal/wb-stack/wb-grid/wb-accordion/etc — "owned by custom elements
    // / behaviors / CSS", #174) never got their behavior invoked at all: the
    // schema-processing loop above is the ONLY wb-* handling scan() has, and
    // it silently no-ops for these tags (correctly skipping the schema
    // rebuild, but with nothing to invoke the real behavior in its place).
    // tag-map.js's getElementBehavior() is the source of truth for "does
    // this wb-* tag have a real behavior" — use it directly. Safe to run
    // unconditionally for every wb-* tag: WB.inject()'s own idempotency
    // guards (applied/pending sets) make this a no-op for tags a schema
    // already enhanced via schema.behavior.
    root.querySelectorAll('*').forEach(el => {
      const htmlEl = /** @type {HTMLElement} */ (el);
      const tag = htmlEl.tagName.toLowerCase();
      // wb-demo is excluded here too: WBDemo's own connectedCallback (#312)
      // lazily defers the 'demo' behavior via IntersectionObserver so
      // off-screen demo blocks don't all build eagerly on page load. This
      // unconditional injection loop would otherwise call WB.inject(el,
      // 'demo') for every wb-demo the instant scan() runs — WB.inject()'s
      // own "already applied" guard only fires for calls that went THROUGH
      // WB.inject() (this path bypasses that, since connectedCallback calls
      // demo() directly), so this loop would win the race against the lazy
      // observer for literally every block, defeating the deferral entirely.
      if (tag.startsWith('wb-') && tag !== 'wb-view' && tag !== 'wb-demo') {
        const behaviorName = getElementBehavior(tag);
        if (behaviorName && behaviors[behaviorName]) {
          promises.push(WB.inject(htmlEl, behaviorName));
        }
      }
    });

    // Semantic property attributes (tooltip=, badge=, ripple, toast-message=)
    // -- a real, intentional feature for attaching a behavior directly to a
    // semantic element by plain property name, no x- prefix required. Shared
    // with wb-lazy.js via semantic-attributes.js so both engines support the
    // same vocabulary; this loop was entirely missing here before (#354) --
    // wb-lazy.js's runtime supported these, this one silently didn't, with
    // no error. Unconditional (like the wb-* tag loop above), independent of
    // the autoInject setting: these are explicit per-element opt-ins, not a
    // native-tag guess.
    semanticPropertyMappings.forEach(({ selector, behavior }) => {
      root.querySelectorAll(selector).forEach(el => {
        const htmlEl = /** @type {HTMLElement} */ (el);
        if (behaviors[behavior]) {
          promises.push(WB.inject(htmlEl, behavior));
        }
      });
    });

      // Generic [x-behavior="name1 name2"] dispatch — the convention demo.js
      // uses for its dynamically-created <pre x-behavior="pre">/<code
      // x-behavior="code">, and the one wb-lazy.js has always understood.
      // scan() itself never handled it (only observe()'s MutationObserver
      // did, and only for attribute VALUE CHANGES on already-tracked nodes,
      // never for a brand-new node arriving with the attribute already set —
      // exactly demo.js's pattern). This was invisible for a long time
      // because `pre`/`code` are ALSO in nativeMap, and autoInject used to
      // leak `true` everywhere (#328) regardless of a page's real config —
      // so the auto-inject path independently caught every <pre>/<code> tag
      // and papered over this gap. Fixing #328 exposed it: every wb-demo
      // code panel on the main SPA (autoInject correctly off there) lost its
      // syntax highlighting entirely, since nothing else was left to invoke
      // pre()/code() for elements tagged only via x-behavior.
      root.querySelectorAll('[x-behavior]').forEach(element => {
        const htmlEl = /** @type {HTMLElement} */ (element);
        const behaviorList = (htmlEl.getAttribute('x-behavior') || '').split(/\s+/).filter(Boolean);
        behaviorList.forEach(name => {
          if (knownBehaviors.has(name)) {
            promises.push(WB.inject(htmlEl, name));
          }
        });
      });

      // 1. Detect Legacy Usage (Strict Mode: Error)
      root.querySelectorAll('[data-wb]').forEach(element => {
        if (!(element instanceof HTMLElement)) return; // Ensure element is an HTMLElement
        const val = element.dataset.wb || '';
        const name = val.split(/\s+/)[0] || 'unknown';
      
        const errorMsg = `Legacy syntax data-wb="${val}" detected on <${element.tagName.toLowerCase()}>. Please use <wb-${name}> instead.`;
        console.error(`[WB] ${errorMsg}`);
      
        Events.error('WB:LegacySyntax', new Error(errorMsg), {
          element: element.tagName,
          fix: `<wb-${name}>`
        });
      
        // Mark element but do not process
        element.setAttribute('x-error', 'legacy');
      });

    // 2. Semantic Shorthand: {prefix}-{name} (Decoration) and {prefix}-as-{name} (Morph/Layout)
    if (behaviorNames.length > 0) {
      // Construct efficient selector for all behaviors
      const selectors = [];
      behaviorNames.forEach(name => {
        selectors.push(`[${prefix}-${name}]`);     // Decoration: x-ripple
        selectors.push(`[${prefix}-as-${name}]`);  // Morph: x-as-card
      });
      
      // Query all potential matches once
      const shorthandElements = root.querySelectorAll(selectors.join(','));
      
      shorthandElements.forEach(element => {
        const htmlEl = /** @type {HTMLElement} */ (element);
        Array.from(htmlEl.attributes).forEach(attr => {
          let behaviorName = null;
          
          // Check {prefix}-{name}
          if (attr.name.startsWith(`${prefix}-`)) {
            const rawName = attr.name.substring(prefix.length + 1); // remove prefix + '-'
            
            if (rawName.startsWith('as-')) {
              // Handle {prefix}-as-{name}
              const morphName = rawName.substring(3);
              if (knownBehaviors.has(morphName)) {
                behaviorName = morphName;
              }
            } else {
              // Handle {prefix}-{name}
              if (knownBehaviors.has(rawName)) {
                behaviorName = rawName;
              }
            }
          }

          if (behaviorName) {
            // Debug log for behavior injection
            dlog('scan', '[WB.scan] Injecting behavior:', behaviorName, 'on', elLabel(htmlEl), htmlEl, 'with options:', attr.value ? { config: attr.value } : {});
            // Pass the attribute value as config if present
            const options = attr.value ? { config: attr.value } : {};
            promises.push(WB.inject(htmlEl, behaviorName, options));
          }
        });
      });
    }

    // Auto-inject scan. Runs unconditionally now, not just when autoInject
    // is on: `variant` is a strong, unambiguous signal of intent on its own
    // (a plain <button variant="primary"> is never accidental), so it
    // triggers the mapped native behavior per-element regardless of the
    // global autoInject setting -- see getAutoInjectBehavior() above for
    // the full rationale/incident.
    {
      autoInjectMappings.forEach(({ selector, behavior }) => {
        const autoElements = root.querySelectorAll(selector);
        autoElements.forEach(element => {
          const htmlEl = /** @type {HTMLElement} */ (element);
          if (!getConfig('autoInject') && !htmlEl.hasAttribute('variant')) return;
          // Only skip if explicitly ignored
          if (!htmlEl.hasAttribute('x-ignore')) {
            // A semantic <article> auto-injects as a card and claims its own
            // <header>/<footer> (rendered as wb-card__header / wb-card__footer).
            // Don't let the generic header/footer behaviors hijack a header or
            // footer that lives inside an <article>/.wb-card — that produced a
            // racing wb-header instead of wb-card__header. (#159)
            if ((behavior === 'header' || behavior === 'footer') &&
                htmlEl.parentElement && htmlEl.parentElement.closest('article, .wb-card')) {
              return;
            }
            // We don't check for other attributes here anymore.
            // Auto-inject is additive.
            WB.inject(htmlEl, behavior);
          }
        });
      });
    }

    await Promise.all(promises);

    pubsub.publish('wb:scan', { count: promises.length });

    // Log only in debug mode
    if (getConfig('debug')) {
      Events.log('info', 'WB', `Scanned and injected behaviors`);
    }
  },

  /**
   * Watch for new elements with x-* behaviors (MutationObserver)
   * @param {HTMLElement} root - Root element to observe (default: document.body)
   * @returns {MutationObserver} The observer instance
   */
  observe(root = document.body) {
    dlog('observe', `[WB.observe] Starting observer on root:`, root.tagName || 'document.body');
    // Disconnect existing observer if present to prevent duplicates
    if (WB._observer) {
      WB._observer.disconnect();
    }

    const behaviorNames = Object.keys(behaviors);
    const knownBehaviors = new Set(behaviorNames);
    const prefix = getConfig('prefix') || 'x'; // Default to x-
    const useSchemas = getConfig('useSchemas');
    dlog('observe', `[WB.observe] useSchemas =`, useSchemas);
    
    // Build attribute filter list
    const attributeFilter = ['x-behavior'];
    behaviorNames.forEach(name => {
      attributeFilter.push(`${prefix}-${name}`);
      attributeFilter.push(`${prefix}-as-${name}`);
    });

    const observer = new MutationObserver(mutations => {
      dlog('observe', `[WB.observe] MutationObserver triggered with ${mutations.length} mutations`);
      for (const mutation of mutations) {
        // Handle added nodes
        for (const node of mutation.addedNodes) {
          // Skip non-element nodes
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          
          // Cast to HTMLElement after type check
          const el = /** @type {HTMLElement} */ (node);
          const tag = el.tagName.toLowerCase();
          dlog('observe', `[WB.observe] Processing added node: ${elLabel(el)}`);

          // v3.0: Process wb-* tags through schema builder
          if (useSchemas && tag.startsWith('wb-') && tag !== 'wb-view') {
            dlog('observe', `[WB.observe] Found wb-* element in mutation: ${elLabel(el)}`);
            WB.processSchema(el);
          }

          // Semantic property attributes (tooltip=, badge=, ripple,
          // toast-message=) on the node itself and any descendant — see
          // scan()'s matching block for the full rationale (#354).
          semanticPropertyMappings.forEach(({ selector, behavior }) => {
            if (behaviors[behavior]) {
              if (el.matches?.(selector)) WB.inject(el, behavior);
              el.querySelectorAll?.(selector).forEach(descendant => {
                WB.inject(/** @type {HTMLElement} */ (descendant), behavior);
              });
            }
          });

          // 1. Check node itself
          // Legacy data-wb detection (reject and log)
          if (el.hasAttribute('data-wb')) {
            const val = el.getAttribute('data-wb') || '';
            const name = val.split(/\s+/)[0] || 'unknown';
            console.error(`[WB] Legacy syntax data-wb="${val}" detected. Use <wb-${name}> or x-${name}.`);
            el.setAttribute('x-error', 'legacy');
          }

          // Generic [x-behavior] dispatch (see scan()'s own handling for
          // why this exists) — covers a node that arrives with the
          // attribute already set, on itself and on any descendant, since
          // the "attributes"-mutation branch below only fires for VALUE
          // CHANGES on nodes already in the tree.
          if (el.hasAttribute('x-behavior')) {
            (el.getAttribute('x-behavior') || '').split(/\s+/).filter(Boolean).forEach(name => {
              if (knownBehaviors.has(name)) WB.inject(el, name);
            });
          }
          el.querySelectorAll?.('[x-behavior]').forEach(descendant => {
            const descEl = /** @type {HTMLElement} */ (descendant);
            (descEl.getAttribute('x-behavior') || '').split(/\s+/).filter(Boolean).forEach(name => {
              if (knownBehaviors.has(name)) WB.inject(descEl, name);
            });
          });

          // Shorthand ({prefix}-* and {prefix}-as-*)
          Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith(`${prefix}-`)) {
              const rawName = attr.name.substring(prefix.length + 1);
              let behaviorName = null;
                
              if (rawName.startsWith('as-')) {
                const morphName = rawName.substring(3);
                if (knownBehaviors.has(morphName)) behaviorName = morphName;
              } else if (knownBehaviors.has(rawName)) {
                behaviorName = rawName;
              }

              if (behaviorName) {
                const options = attr.value ? { config: attr.value } : {};
                WB.inject(el, behaviorName, options);
              }
            }
          });

          // Auto-inject (only if no explicit behaviors)
          const autoBehavior = getAutoInjectBehavior(el);
          if (autoBehavior) {
            WB.inject(el, autoBehavior);
          }

          // 2. Check descendants
          // v3.0: Process wb-* descendants through schema builder
          if (useSchemas) {
            el.querySelectorAll('*').forEach(descendant => {
              const descEl = /** @type {HTMLElement} */ (descendant);
              const elTag = descEl.tagName.toLowerCase();
              if (elTag.startsWith('wb-') && elTag !== 'wb-view') {
                WB.processSchema(descEl);
              }
            });
          }
            
          // Legacy data-wb detection (descendants — reject and log)
          el.querySelectorAll('[data-wb]').forEach(descendant => {
            const descEl = /** @type {HTMLElement} */ (descendant);
            const val = descEl.getAttribute('data-wb') || '';
            const name = val.split(/\s+/)[0] || 'unknown';
            console.error(`[WB] Legacy syntax data-wb="${val}" detected. Use <wb-${name}> or x-${name}.`);
            descEl.setAttribute('x-error', 'legacy');
          });
            
          // Shorthand - we need to query for all known shorthand attributes
          const selectors = [];
          behaviorNames.forEach(name => {
            selectors.push(`[${prefix}-${name}]`);
            selectors.push(`[${prefix}-as-${name}]`);
          });
            
          if (selectors.length > 0) {
            el.querySelectorAll(selectors.join(',')).forEach(descendant => {
              const descEl = /** @type {HTMLElement} */ (descendant);
              Array.from(descEl.attributes).forEach(attr => {
                if (attr.name.startsWith(`${prefix}-`)) {
                  const rawName = attr.name.substring(prefix.length + 1);
                  let behaviorName = null;
                  if (rawName.startsWith('as-')) {
                    const morphName = rawName.substring(3);
                    if (knownBehaviors.has(morphName)) behaviorName = morphName;
                  } else if (knownBehaviors.has(rawName)) {
                    behaviorName = rawName;
                  }
                  if (behaviorName) {
                    const options = attr.value ? { config: attr.value } : {};
                    WB.inject(descEl, behaviorName, options);
                  }
                }
              });
            });
          }

          // Auto-inject descendants. Unconditional per-element check (see
          // scan()'s matching comment above) -- `variant` triggers the
          // mapped behavior regardless of the global autoInject setting.
          {
            autoInjectMappings.forEach(({ selector, behavior }) => {
              el.querySelectorAll(selector).forEach(descendant => {
                const descEl = /** @type {HTMLElement} */ (descendant);
                if (!getConfig('autoInject') && !descEl.hasAttribute('variant')) return;
                // Only skip if explicitly ignored
                if (!descEl.hasAttribute('x-ignore')) {
                  // We don't check for other attributes here anymore.
                  // Auto-inject is additive.
                  WB.inject(descEl, behavior);
                }
              });
            });
          }
        }

        // Handle attribute changes
        if (mutation.type === 'attributes') {
          const element = /** @type {HTMLElement} */ (mutation.target);
          
          if (mutation.attributeName === 'x-behavior') {
            const behaviorList = (element.getAttribute('x-behavior') || '').split(/\s+/).filter(Boolean);
            const current = applied.get(element) || [];
            current.forEach(({ name, cleanup }) => {
              if (!behaviorList.includes(name)) {
                const hasShorthand = element.hasAttribute(`${prefix}-${name}`) || element.hasAttribute(`${prefix}-as-${name}`);
                if (!hasShorthand) {
                  if (typeof cleanup === 'function') cleanup();
                }
              }
            });
            behaviorList.forEach(name => WB.inject(element, name));
          } else if (mutation.attributeName?.startsWith(`${prefix}-`)) {
            // Handle shorthand add/remove
            const rawName = mutation.attributeName.substring(prefix.length + 1);
            let behaviorName = null;
            if (rawName.startsWith('as-')) {
              const morphName = rawName.substring(3);
              if (knownBehaviors.has(morphName)) behaviorName = morphName;
            } else if (knownBehaviors.has(rawName)) {
              behaviorName = rawName;
            }

            if (behaviorName) {
              if (element.hasAttribute(mutation.attributeName)) {
                const options = element.getAttribute(mutation.attributeName) ? { config: element.getAttribute(mutation.attributeName) } : {};
                WB.inject(element, behaviorName, options);
              } else {
                // Attribute removed — check if still declared via x-behavior
                const list = (element.getAttribute('x-behavior') || '').split(/\s+/).filter(Boolean);
                if (!list.includes(behaviorName)) {
                  WB.remove(element, behaviorName);
                }
              }
            }
          }
        }
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: attributeFilter
    });

    WB._observer = observer;
    return observer;
  },

  /**
   * Stop observing DOM changes
   */
  disconnect() {
    if (WB._observer) {
      WB._observer.disconnect();
      WB._observer = null;
    }
  },

  /**
   * Get list of available behaviors
   * @returns {string[]} Array of behavior names
   */
  list() {
    return Object.keys(behaviors);
  },

  /**
   * Check if a behavior exists
   * @param {string} name - Behavior name
   * @returns {boolean}
   */
  has(name) {
    return name in behaviors;
  },

  /**
   * Register a custom behavior
   * @param {string} name - Behavior name
   * @param {Function} fn - Behavior function
   */
  register(name, fn) {
    if (typeof fn !== 'function') {
      throw new Error(`[WB] Behavior must be a function: ${name}`);
    }
    behaviors[name] = fn;
  },

  /**
   * Initialize WB
   * @param {Object} options - Configuration options
   */
  async init(options = {}) {
    const {
      scan: shouldScan = true,
      observe: shouldObserve = true,
      theme = null,
      debug = false,
      autoInject = false, // Default to false unless specified
      prefix = 'x', // Default prefix
      useSchemas = true, // v3.0: Enable schema-based DOM building
      // Base-path aware (relative to this module) so schemas load under any base —
      // domain root locally or /wb-starter/ on GitHub Pages. Absolute 404s there. (#225)
      schemaPath = new URL('../wb-models', import.meta.url).href // Path to schema files
    } = options;

    // Set debug mode
    if (debug) {
      setConfig('debug', true);
      setConfig('logLevel', 'debug');
    }

    // Media GET/paint tracing — always on, independent of WB_DEBUG. Per
    // "filter out all tracing except the blank video get and subsequent
    // paint": this is the one class of event worth surfacing unconditionally
    // in every environment, not just when someone has already turned on the
    // full (much noisier) [WB.scan]/[WB.observe] trace.
    traceMediaLoads();

    // Set autoInject — unconditional: config.js's module-level default was
    // `true`, and this previously only ever set it to `true` (never `false`),
    // so any caller passing `autoInject: false` (or omitting it, relying on
    // the documented "false by default") silently stayed enhanced. Confirmed
    // live: the main SPA's own config/site.json sets autoInjectComponents to
    // false, and site-engine.js passes it straight through, yet every page
    // had native elements auto-enhanced regardless.
    setConfig('autoInject', autoInject);

    // Set prefix
    setConfig('prefix', prefix);
    
    // v3.0: Set schema options
    setConfig('useSchemas', useSchemas);
    setConfig('schemaPath', schemaPath);

    // Set theme
    if (theme) {
      Theme.set(theme);
    }

    // v3.0: Schema Builder is on-demand only (#312) — WB.scan(), just below,
    // walks the DOM for actual wb-* tags and fetches each one's schema via
    // processSchema() -> loadSchemaFile() as it's encountered. Bulk-fetching
    // every schema in index.json here (as this used to do) duplicated that
    // work and cost 81 network requests on a page that uses ~9 tags.
    if (useSchemas) {
      dlog('init', '═══════════════════════════════════════════════════════');
      dlog('init', '  WB Behaviors v3.0 - MVVM Architecture');
      dlog('init', '═══════════════════════════════════════════════════════');
      dlog('init', '[WB.init] useSchemas is true — schemas load on-demand via WB.scan()');
    } else {
      dlog('init', '[WB.init] useSchemas is false, skipping schema initialization');
    }

    // Scan existing elements
    if (shouldScan && typeof document !== 'undefined') {
      // Wait for DOM ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => WB.scan());
      } else {
        await WB.scan();
      }
    }

    // Start observing
    if (shouldObserve && typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => WB.observe());
      } else {
        WB.observe();
      }
    }
    
    // #334: SchemaBuilder.startObserver() used to run here unconditionally
    // alongside WB.observe() -- a second, independent MutationObserver
    // watching the same document.body/documentElement subtree. Its callback
    // did nothing WB.observe()'s own callback doesn't already do more
    // completely (wb-* schema processing, both for the added node itself
    // AND recursively for every descendant -- see WB.observe()'s "Check
    // descendants" section). Confirmed no other call site anywhere in the
    // codebase depends on SchemaBuilder.startObserver() running
    // independently. Removed: every DOM mutation site-wide was being
    // processed by 2-3 full-subtree observers instead of 1.

    dlog('init', `✅ WB (Web Behavior) v${WB.version} initialized`);
    
    pubsub.publish('wb:init', options);

    if (debug) {
      Events.log('info', 'WB', 'Initialized', options);
    }

    return WB;
  },

  // Expose core modules
  Events,
  Theme,
  config: { get: getConfig, set: setConfig }
};

// Global export
if (typeof window !== 'undefined') {
  /** @type {any} */ (window).WB = WB;
}

export { WB };
export default WB;
