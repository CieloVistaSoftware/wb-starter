// Ensure WB is declared on window for type safety (for TS/IDE, no-op at runtime)
// @ts-ignore
if (typeof window !== 'undefined' && typeof window.WB === 'undefined') {
  /** @type {any} */ (window).WB = undefined;
}

// Debug logging — TEMPORARILY forced ON project-wide per explicit request
// ("turn the tracing on until I tell you to turn it off") while diagnosing
// several live rendering issues. Normally gated behind
// localStorage['wb-debug'] === '1' (still respects an explicit '0' to opt
// out); revert the `true ||` once tracing is no longer needed.
const WB_DEBUG = true || (() => { try { return localStorage.getItem('wb-debug') === '1'; } catch (e) { return false; } })();
const _wbClog = console.log.bind(console);
const dlog = (...args) => { if (WB_DEBUG) _wbClog(...args); };

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

// Fetch/load tracing for <img>/<video>/<audio> — to find WHY a specific
// image or video never rendered rather than guessing. 'load'/'error' don't
// bubble, so a single capture-phase listener on document is the only way to
// catch every media element's outcome without instrumenting each one
// individually. Also directly surfaces the browser's own silent
// interventions (e.g. "Images loaded lazily and replaced with
// placeholders" — a real Chrome/Edge behavior, not a WB bug) by logging
// naturalWidth/naturalHeight at load time: 0x0 on a 'load' event (not an
// 'error' event) means the browser itself served a placeholder.
function traceMediaLoads() {
  if (typeof document === 'undefined') return;
  const start = new WeakMap();
  document.addEventListener('load', (ev) => {
    const el = ev.target;
    if (!(el instanceof HTMLImageElement) && !(el instanceof HTMLVideoElement) && !(el instanceof HTMLAudioElement)) return;
    const t0 = start.get(el);
    const ms = t0 ? Math.round(performance.now() - t0) : null;
    if (el instanceof HTMLImageElement && el.naturalWidth === 0) {
      _wbClog(`[WB:trace] IMG loaded with 0x0 natural size (likely browser intervention, not a real error) src=${el.src} ${ms != null ? ms + 'ms' : ''}`, el);
    } else {
      dlog(`[WB:trace] ${el.tagName} loaded ok src=${el.currentSrc || el.src} ${ms != null ? ms + 'ms' : ''}`);
    }
  }, true);
  document.addEventListener('error', (ev) => {
    const el = ev.target;
    if (!(el instanceof HTMLImageElement) && !(el instanceof HTMLVideoElement) && !(el instanceof HTMLAudioElement)) return;
    const t0 = start.get(el);
    const ms = t0 ? Math.round(performance.now() - t0) : null;
    _wbClog(`[WB:trace] ${el.tagName} FAILED to load src=${el.src} ${ms != null ? ms + 'ms' : ''}`, el);
  }, true);
  // Record start time as soon as each media element gets a src, so load/error above can report elapsed time.
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

// Register Layout Custom Elements
import '../wb-viewmodels/wb-grid.js';
import '../wb-viewmodels/wb-cluster.js';
import '../wb-viewmodels/wb-stack.js';
import '../wb-viewmodels/wb-row.js';
// wb-column is a BEHAVIOR (stack), not a class that `extends HTMLElement` (v3).
// Mapped wb-column → stack in tag-map.js / wb-lazy.js.
import '../wb-viewmodels/wb-search.js';
import '../wb-viewmodels/wb-accordion.js';
import '../wb-viewmodels/wb-demo.js';

import { getConfig, setConfig } from './config.js';
import { pubsub } from './pubsub.js';
import SchemaBuilder from './mvvm/schema-builder.js';

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

    // <wb-modal modal-title="…" modal-content="…">Open Modal</wb-modal> is
    // TRIGGER mode (dialog.js) — a plain clickable element whose own text IS
    // the label; dialog.js deliberately leaves it untouched (just adds a
    // class + click listener). The dialog schema's $view unconditionally
    // rebuilds children into backdrop/container/header — meant for the
    // actual dialog box, not this trigger — which silently wiped the
    // trigger's own label text before dialog.js ever got a chance to run.
    // Confirmed live: exactly this pattern on pages/behaviors.html's
    // "Open Modal" trigger (#305 investigation).
    if (element.tagName === 'WB-MODAL' && (element.hasAttribute('modal-title') || element.hasAttribute('modal-content'))) {
      return;
    }

    // <wb-demo> owns its content via WBDemo.connectedCallback() (demo.js),
    // which builds behavior-enhanced DOM directly (pre.js wraps its "view
    // source" panel with a real click listener). demo.schema.json exists
    // (for the doc catalog / test fixtures) but its empty $view makes
    // buildStructure() fall back to capturing element.innerHTML as a string
    // and re-parsing it back in — that reparse produces a listener-less
    // look-alike, and pre.js's own idempotency guard (classList-based) then
    // skips ever wrapping the real, visible node. Whichever of
    // connectedCallback() / this schema pass ran second silently won,
    // orphaning the other's work. Confirmed live: the code-block collapse
    // toggle silently stopped responding to clicks (#312 investigation).
    if (element.tagName === 'WB-DEMO') {
      return;
    }

    // Get schema name from tag or x-* attributes
    const name = schemaName || WB._detectSchemaName(element);
    dlog(`[WB.processSchema] Processing element ${elLabel(element)}, detected schema: ${name}`);
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
        dlog(`[WB] Schema for "${name}" not registered yet — fetching on demand`);
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
        dlog(`[WB.processSchema] Calling SchemaBuilder.processElement for ${elLabel(element)}`);
        SchemaBuilder.processElement(element, name);
        schemaProcessed.add(element);
        element.setAttribute('x-schema', name);
        dlog(`[WB.processSchema] Schema processing complete for ${elLabel(element)}`);
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
    dlog(`[WB.scan] Starting scan on root:`, root.tagName || 'document.body');
    const promises = [];
    const behaviorNames = Object.keys(behaviors);
    const knownBehaviors = new Set(behaviorNames);
    const prefix = getConfig('prefix') || 'x'; // Default to x-
    const useSchemas = getConfig('useSchemas');
    dlog(`[WB.scan] useSchemas =`, useSchemas);

    // v3.0: Process wb-* custom element tags through schema builder first
    if (useSchemas) {
      dlog(`[WB.scan] useSchemas is true, scanning for wb-* elements in root:`, root.tagName || 'document.body');
      // Collect promises so we can await schema-built elements before continuing
      const schemaPromises = [];
      root.querySelectorAll('*').forEach(el => {
        const htmlEl = /** @type {HTMLElement} */ (el);
        const tag = htmlEl.tagName.toLowerCase();
        if (tag.startsWith('wb-') && tag !== 'wb-view') {
          dlog(`[WB.scan] Found wb-* element: ${elLabel(htmlEl)}`);
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
        dlog(`[WB.scan] Awaiting ${schemaPromises.length} schema processing promises`);
        await Promise.all(schemaPromises);
        dlog(`[WB.scan] Schema processing complete`);
      } else {
        dlog(`[WB.scan] No wb-* elements found to process`);
      }
    } else {
      dlog(`[WB.scan] useSchemas is false, skipping schema processing`);
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
            dlog('[WB.scan] Injecting behavior:', behaviorName, 'on', elLabel(htmlEl), htmlEl, 'with options:', attr.value ? { config: attr.value } : {});
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
    dlog(`[WB.observe] Starting observer on root:`, root.tagName || 'document.body');
    // Disconnect existing observer if present to prevent duplicates
    if (WB._observer) {
      WB._observer.disconnect();
    }

    const behaviorNames = Object.keys(behaviors);
    const knownBehaviors = new Set(behaviorNames);
    const prefix = getConfig('prefix') || 'x'; // Default to x-
    const useSchemas = getConfig('useSchemas');
    dlog(`[WB.observe] useSchemas =`, useSchemas);
    
    // Build attribute filter list
    const attributeFilter = ['x-behavior'];
    behaviorNames.forEach(name => {
      attributeFilter.push(`${prefix}-${name}`);
      attributeFilter.push(`${prefix}-as-${name}`);
    });

    const observer = new MutationObserver(mutations => {
      dlog(`[WB.observe] MutationObserver triggered with ${mutations.length} mutations`);
      for (const mutation of mutations) {
        // Handle added nodes
        for (const node of mutation.addedNodes) {
          // Skip non-element nodes
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          
          // Cast to HTMLElement after type check
          const el = /** @type {HTMLElement} */ (node);
          const tag = el.tagName.toLowerCase();
          dlog(`[WB.observe] Processing added node: ${elLabel(el)}`);

          // v3.0: Process wb-* tags through schema builder
          if (useSchemas && tag.startsWith('wb-') && tag !== 'wb-view') {
            dlog(`[WB.observe] Found wb-* element in mutation: ${elLabel(el)}`);
            WB.processSchema(el);
          }
            
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

    // Media load/error tracing — gated on the same localStorage['wb-debug']
    // flag as dlog(), not the `debug` init option, so it's on whenever
    // someone has already turned on tracing to investigate something.
    if (WB_DEBUG) traceMediaLoads();

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
      dlog('═══════════════════════════════════════════════════════');
      dlog('  WB Behaviors v3.0 - MVVM Architecture');
      dlog('═══════════════════════════════════════════════════════');
      dlog('[WB.init] useSchemas is true — schemas load on-demand via WB.scan()');
    } else {
      dlog('[WB.init] useSchemas is false, skipping schema initialization');
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

    dlog(`✅ WB (Web Behavior) v${WB.version} initialized`);
    
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
