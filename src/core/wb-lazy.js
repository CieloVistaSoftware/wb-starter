/**
 * WB - Web Behavior (Lazy Loading Version)
 * =========================================
 * Pure JavaScript behavior injection library.
 * Behaviors are loaded on-demand when first used.
 * 
 * @version 2.1.0
 * @license MIT
 */

import { getBehavior, hasBehavior, listBehaviors, preloadBehaviors, getCacheStats, behaviorModules } from '../wb-viewmodels/index.js';
import { Events } from './events.js';
import './click-confirm.js';
import { Theme } from './theme.js';
import { getConfig, setConfig } from './config.js';
import { matchingElements } from './dom-query.js';
import { setupGlobalErrorHandler } from './error-logger.js';
import { elementMap, nativeMap, extensionMap } from './tag-map.js';
import { isReplacedByExplicitBehavior } from './replacement-guard.js';
import { semanticPropertyMappings } from './semantic-attributes.js';
import { ensureBehaviorCss } from './style-loader.js';
import { makeDlog, traceStatusLabel } from './debug-trace.js';
import SchemaBuilder from './mvvm/schema-builder.js';

// Debug logging — silent unless localStorage['x-debug'] names a category
// (or is '1' for everything). Was forced true|| for a while; reverted per
// "filter out all tracing except the blank video get and subsequent paint"
// (see wb.js's matching comment). #338 generalized the flag into a
// selectable category filter (see debug-trace.js) — this runtime has no
// dlog(category, ...) call sites of its own today, but shares the same
// mechanism so one added here later doesn't need its own bespoke parsing.
const dlog = makeDlog();

// ── Workflow tracing (#970) ─────────────────────────────────────────────────
//
// John: "put in trace points on entry to functions, print the entry point to
// console along with parameter values ... save the trace of each run, and when
// there is a subsequent failure compare a good run's workflow with the failure."
//
// This runtime had ZERO dlog() call sites while wb.js had 22 — and wb-lazy is
// the one driving the demo pages and the behaviors page, where every unstable
// test lives. The runtime we most needed to see inside was the only one with no
// tracing, which is why the instability stayed opaque through an entire day of
// investigation.
//
// Every line is prefixed `[flow]` and carries the entry point plus the values
// that decide what happens next, so two runs can be diffed line by line. Enable
// with localStorage.setItem('x-debug', 'flow') — or 'flow,processSchema' etc.
//
// A stable element label matters more than it looks: without one, two runs of
// the same page produce different text for the same element and every line
// reads as a difference. Ids are used when present; otherwise a per-run
// sequence number, assigned in first-seen order, which is itself informative —
// if the order changes between runs, that IS the divergence.
const _traceIds = new WeakMap();
let _traceIdSeq = 0;
function elLabel(el) {
  if (!el || !el.tagName) return String(el);
  const tag = el.tagName.toLowerCase();
  if (el.id) {
    // Generated ids carry a random suffix (Law 14: behaviors must generate
    // unique ids rather than hardcode them), so they differ on every load.
    // Left raw, two traces of the SAME workflow diff as different at the first
    // generated id — `expandable-content-osrnspdwh` vs
    // `expandable-content-r0c285wud` — and the instrument reports a divergence
    // that is only randomness. Normalise the suffix so a diff shows real
    // differences in what ran, not in what things were named.
    return `<${tag} id="${el.id.replace(/-[a-z0-9]{6,}$/i, '-*')}">`;
  }
  if (!_traceIds.has(el)) _traceIds.set(el, ++_traceIdSeq);
  return `<${tag} #${_traceIds.get(el)}>`;
}
/**
 * Entry trace: the function name and the parameters that steer it.
 *
 * Recorded into an in-page buffer as well as logged. The buffer is the point:
 * "save the trace of each run and compare" needs the workflow RETRIEVABLE, and
 * scraping console output is the wrong mechanism — it is lossy (the console
 * keeps a bounded history, and this page alone floods it with card-media
 * warnings), level-filtered by whatever is reading it, and unordered across
 * frames. `WB.flowTrace()` hands back the exact sequence instead.
 *
 * Always recorded, even when the `flow` category is off: the cost is one
 * string per injection, and a trace you have to reproduce a failure to enable
 * is useless for the failure that already happened. Logging still respects the
 * category, so consoles stay quiet by default.
 */
const FLOW_LIMIT = 20000;
const flowBuffer = [];

/**
 * The frame that called us — the entry point alone says WHAT ran, the caller
 * says WHY. `scan()` firing 295 times on one page load is meaningless until
 * you can see who is calling it; with the caller attached it is either one
 * re-entrant path or 295 unrelated ones, and those are different bugs.
 *
 * Frames inside this module are skipped so the answer is the outside caller,
 * not `flow` itself. Cheap enough at this volume: constructing an Error and
 * slicing its stack costs microseconds, and it is only done for traced entry
 * points, not per element.
 */
function callerFrame(tracedFn) {
  const raw = new Error().stack;
  if (!raw) return '?';
  // Skip our own plumbing AND the traced function itself — the first version
  // reported `Object.scan@wb-lazy.js:706`, which is scan's own frame, so all
  // 295 calls looked like they came from one place. The frame that matters is
  // the one OUTSIDE the function being traced.
  const skip = new Set(['callerFrame', 'flow', tracedFn, `Object.${tracedFn}`]);
  for (const l of raw.split('\n').slice(1)) {
    const m = l.match(/at\s+(?:async\s+)?([^\s(]+)\s*\(?([^)]*)\)?/);
    if (!m) continue;
    const fn = m[1];
    if (skip.has(fn) || skip.has(fn.replace(/^Object\./, ''))) continue;
    const loc = (m[2] || '').split('/').pop().replace(/\?.*$/, '');
    return `${fn}@${loc}`;
  }
  return '(top-level)';
}

function flow(fn, ...parts) {
  const line = `${fn}(${parts.filter((p) => p !== undefined).join(', ')}) <- ${callerFrame(fn)}`;
  if (flowBuffer.length < FLOW_LIMIT) flowBuffer.push(line);
  dlog('flow', `[flow] ${line}`);
}
// Always announce the tracing state — first thing in the console, every
// load, regardless of whether it's on or off.
console.log(`[WB-lazy] debug tracing: ${traceStatusLabel()} (localStorage.setItem('x-debug', '1') for everything, or a comma-separated category list, then reload)`);

// #333: this table used to hand-duplicate tag-map.js's elementMap/nativeMap/
// extensionMap (wb.js's own single source of truth) and had drifted --
// e.g. this file was missing header/footer (present in nativeMap) while
// tag-map.js was missing every legacy card-*/noun-first alias this file
// still needs to serve older standalone demo pages. Now built by spreading
// the shared tag-map.js tables first, with only the genuinely
// runtime-specific entries layered on top explicitly -- so anything added to
// tag-map.js going forward is picked up here automatically instead of
// silently working on only one runtime.

// x-modal: tag-map.js's elementMap says 'dialog', this runtime's own table
// (below) says 'modal' -- both names resolve to the exact same function
// (dialog.js does `export { dialog as modal }`), so this is a benign naming
// difference, not a behavior difference. Kept as an explicit override so
// it's not silently swept up if tag-map.js's mapping ever changes.
//
// x-drawer used to be a SECOND, genuinely broken override here (mapped to
// 'drawerLayout' -- an unrelated collapsible-sidebar behavior -- instead of
// 'drawer', the actual trigger+overlay behavior every <div x-drawer> demo
// markup expects). Confirmed live: every <div x-drawer> on a wb-lazy.js-only
// page (e.g. demos/site/overlays.html) rendered as an inert, wrongly-styled
// sidebar fragment with its own attribute text as visible content, never as
// a working "click to open a drawer" trigger. #333 already unified the rest
// of this table against tag-map.js's elementMap; this specific entry was
// carved out "pending investigation" and never revisited. Now that
// overlay.js's drawer() is schema-aware (this session), removed the
// override so x-drawer agrees with tag-map.js's 'drawer' on both runtimes.
const ELEMENT_MAP_OVERRIDES = new Set(['[x-modal]']);

// x-grid is still a REAL custom element (x-grid.js, eagerly imported by
// wb.js) whose own connectedCallback calls the layout function directly.
// wb-lazy.js has no such registration (only x-card.js, separately, for
// <article>), so it needs dispatching as an ordinary injected behavior here.
// x-cluster/x-stack/x-row/x-accordion USED to be real custom elements
// too, but those `extends HTMLElement` wrappers were removed (#279) in favor
// of tag-map.js's elementMap (cluster/stack/flex/accordion) -- now picked up
// automatically via the elementMap spread above, no longer needed here.
// The rest of this table covers the legacy card-*/noun-first tag aliases and
// a few tags tag-map.js genuinely doesn't know about at all (x-inputgroup,
// x-formrow, x-stat, x-code-card) -- none of these are duplicated anywhere
// else.
const WB_LAZY_ONLY_ELEMENTS = {
  // EMPTY ON PURPOSE -- see elementMap in tag-map.js.
  //
  // These 18 are why the first migration pass left <div x-container>, <div x-grid>
  // and <div> behind: the script read tag-map.js and nothing else, so a
  // second element registry living here was invisible to it. That is #831 in
  // miniature -- it broke the very tool written to find that class of bug.
};

// Extension attributes tag-map.js's extensionMap doesn't cover. wb.js doesn't
// need an equivalent list at all for these -- it resolves x-{name} shorthand
// attributes dynamically from the behaviors registry itself
// (Object.keys(behaviors) in scan()/observe()), not from a hardcoded
// selector table. This runtime's dispatch (getAutoInjectBehaviors(), below)
// is selector-table-driven, so it still needs these listed explicitly.
// Porting wb.js's dynamic approach here would remove the need for this list
// entirely -- a larger follow-up, not done as part of this consolidation.
// Exported (#666) so tooling can enumerate the FULL x-* surface. This table is
// a second registry alongside tag-map.js's extensionMap, and the two diverge:
// 34 x-* attributes used by real demos on pages/behaviors.html live only here,
// so anything reading tag-map alone reports an incomplete behavior list.
// Consolidating the two is tracked separately; exporting is the read-only step
// that stops consumers silently under-reporting in the meantime.
export const WB_LAZY_ONLY_ATTRIBUTES = {
  // mdhtml.js marks rendered code blocks with bare `x-pre`/`x-code` presence
  // attributes (src/wb-viewmodels/mdhtml.js) and relies on WB.scan() to pick
  // them up -- on wb.js that "just works" via its dynamic x-{name} shorthand
  // resolution (see the file comment above), but wb-lazy.js has no such
  // dynamic path and neither name was ever added to this static table, so
  // every rendered <pre>/<code> block on a wb-lazy.js-driven page (any
  // standalone demo, doc-viewer.html reached via one) silently never got the
  // pre()/code() enhancement (#322) -- confirmed live: WB.inject() was never
  // even called for these elements, since no selector in customElementMappings
  // matched `[x-pre]`/`[x-code]` at all.
  'x-pre': 'pre',
  'x-code': 'code',
  'x-breadcrumb': 'breadcrumb',
  'x-notify': 'notify',
  'x-typewriter': 'typewriter',
  'x-bounce': 'bounce',
  'x-pulse': 'pulse',
  'x-rainbow': 'rainbow',
  // x-copy (#645): moved to tag-map.js's extensionMap (shared with wb.js) --
  // see the comment there for the x-copybutton distinction.
  // x-copybutton (#291) — overlays a separate positioned copy button on ANY
  // element (distinct from x-copy, which makes the element itself the
  // trigger). See src/wb-viewmodels/copy.js's copyButton().
  'x-copybutton': 'copybutton',
  'x-fadein': 'fadein',
  'x-shake': 'shake',
  // Entrance / attention-seeker animations + relative time — behaviors exist in
  // effects.js/helpers and are registered in index.js, but were unmapped (issue #138)
  'x-slidein': 'slidein',
  'x-zoomin': 'zoomin',
  'x-wobble': 'wobble',
  'x-tada': 'tada',
  'x-jello': 'jello',
  'x-heartbeat': 'heartbeat',
  'x-glow': 'glow',
  'x-sparkle': 'sparkle',
  'x-flip': 'flip',
  'x-flash': 'flash',
  'x-relativetime': 'relativetime',
  'x-password': 'password',
  'x-stepper': 'stepper',
  'x-otp': 'otp',
  'x-search': 'search',
  'x-clock': 'clock',
  'x-countdown': 'countdown',
  'x-pagination': 'pagination',
  'x-steps': 'steps',
  'x-kbd': 'kbd',
  // #834 -- the element is <img>. docs/behaviors/img.md already teaches
  // x-img in four places; it was never registered, so following the docs
  // produced no behavior and no error.
  'x-img': 'img',
  'x-popover': 'popover',
  'x-confirm': 'confirm',
  'x-prompt': 'prompt',
  'x-lightbox': 'lightbox',
  'x-share': 'share',
  'x-print': 'print',
  'x-fullscreen': 'fullscreen',
  'x-truncate': 'truncate',
  'x-masonry': 'masonry',
  'x-autosize': 'autosize',
  // #645: x-form, x-tags, x-file, x-masked, x-counter, x-autocomplete,
  // x-colorpicker, x-floatinglabel, x-label, x-youtube, x-timeline,
  // x-gallery, x-drawer, x-dropdown, x-toggle, x-drawer-layout, x-copy,
  // x-toast, x-collapse, and x-article (new) all moved to/added in
  // tag-map.js's extensionMap (shared with wb.js) -- see the comment block
  // there for the drawer/drawer-layout and article/articles/as-article
  // disambiguation notes.
};

// Auto-injection mappings
const customElementMappings = [
  ...Object.entries(elementMap)
    .filter(([selector]) => !ELEMENT_MAP_OVERRIDES.has(selector))
    .map(([selector, behavior]) => ({ selector, behavior })),
  ...Object.entries(extensionMap)
    .map(([attr, behavior]) => ({ selector: `[${attr}]`, behavior })),
  ...Object.entries(WB_LAZY_ONLY_ELEMENTS).map(([selector, behavior]) => ({ selector, behavior })),
  ...Object.entries(WB_LAZY_ONLY_ATTRIBUTES).map(([attr, behavior]) => ({ selector: `[${attr}]`, behavior })),
  // Semantic property attributes (tooltip=, badge=, ripple, toast-message=)
  // -- shared with wb.js via semantic-attributes.js so both engines support
  // the same vocabulary (#354).
  ...semanticPropertyMappings,
  // No custom-element selectors here. <button-tooltip> lived at this spot as a
  // hardcoded dual-behavior binding -- a SEVENTH place a selector could be
  // bound (#831) -- and was never used in a single .html in the repo or the
  // scaffold. Removed in #921. The tooltip behavior is reached the documented
  // way instead: <button x-tooltip tooltip="Save changes">, on a host the
  // author already knows.
];

const autoInjectMappings = [
  ...Object.entries(nativeMap).map(([selector, behavior]) => ({ selector, behavior })),
  // Legacy bare data-attribute fallback -- pre-dates x-tooltip.
  { selector: '[data-tooltip]', behavior: 'tooltip' },
];

/**
 * Get implicit behaviors for an element based on its type
 * @param {HTMLElement} element 
 * @returns {string[]} Array of behavior names
 */
function getAutoInjectBehaviors(element) {
  flow('getAutoInjectBehaviors', `el=${elLabel(element)}`);
  const behaviors = [];

  // Always check custom elements (regardless of autoInject setting)
  for (const { selector, behavior } of customElementMappings) {
    if (element.matches(selector)) {
      behaviors.push(behavior);
    }
  }

  // `variant` is a strong, unambiguous signal of intent on its own -- a
  // plain <button variant="primary"> is never accidental -- so it triggers
  // its mapped native behavior regardless of the global autoInject setting
  // (see wb.js's getAutoInjectBehavior() for the full rationale/incident).
  if (!getConfig('autoInject') && !element.hasAttribute('variant')) return behaviors;

  // Skip if x-behavior is already present (explicit overrides implicit)
  if (element.hasAttribute('x-behavior')) return behaviors;

  // Skip native/auto-inject entirely when explicitly opted out. wb.js's own
  // autoInjectMappings loop already honors x-ignore this way (see its
  // "Only skip if explicitly ignored" comment) -- this engine lacked the
  // same check, so a plain <header>/<footer>/etc. used for page content
  // (not the generic x-header/x-footer navbar treatment) had no working
  // escape hatch on this engine, silently getting hijacked by the native
  // behavior's classes/layout regardless of x-ignore.
  if (element.hasAttribute('x-ignore')) return behaviors;

  const prefix = getConfig('prefix') || 'x';
  for (const { selector, behavior } of autoInjectMappings) {
    if (!element.matches(selector)) continue;
    // A DIFFERENT explicit x-{behavior} attribute already opts this
    // element into a richer, deliberate behavior -- e.g. <input type="text"
    // x-password> should only get password()'s show/hide-toggle wrapper,
    // never ALSO the generic native-auto-inject input() wrapper racing to
    // wrap the same element a second time (see wb.js's
    // getAutoInjectBehavior() for the full rationale/incident).
    // #923: was a local copy of this rule gated on `hasBehavior(other)` --
    // i.e. the other module being REGISTERED at this instant. Under THIS
    // runtime it usually is not (that is #763's incident verbatim), so the
    // guard missed and both behaviors ran: <article x-cardimage> rendered two
    // cards, and a profile card stacked two covers, two avatars and two role
    // badges on top of each other.
    //
    // The shared guard decides on the ATTRIBUTE, not the registry, which is
    // what makes it independent of load order.
    if (!isReplacedByExplicitBehavior(element, behavior, prefix)) behaviors.push(behavior);
  }
  return behaviors;
}

// v3.0 schema-building step (#489, split off #322) -- mirrors wb.js's own
// WB.processSchema() (src/core/wb.js), which builds a <wb-*> host's internal
// DOM from its matching *.schema.json's $view BEFORE any behavior runs
// against it. wb-lazy.js (this file -- the runtime every standalone demo
// page, the doc-viewer, and test-harness.html load) never had an equivalent
// call anywhere, so x-schema was never set and schema-dependent behaviors
// found nothing pre-built to enhance. Confirmed live: switchInput()
// (src/wb-viewmodels/semantics/switch.js) looks for a pre-built <input> via
// `host.querySelector('input')` -- switch.schema.json's $view is what builds
// that input/track/thumb structure, and that never ran here.
//
// Hooked into WB.inject() itself (below) rather than duplicated across
// scan()/observe()/lazyInject() separately, so it runs exactly once, in the
// right order (schema built, THEN the behavior attaches to the result),
// regardless of which of those three paths triggered this particular
// injection.
//
// Tags skipped below are confirmed (by reading the actual behavior source --
// see wb.js's WB.processSchema for the full per-tag incident history) to
// build their own complete DOM unconditionally, so letting schema ALSO run
// on them would be a pure async race that silently wipes whichever of the
// two finishes second (the x-card* family, x-demo, x-details,
// x-skeleton, x-dialog, x-select, x-article/x-articles, x-fix-card),
// or -- for x-cluster/x-stack/x-row/x-search/x-accordion, which have no
// schema.json of their own at all -- a dead fetch that just 404s.
const SCHEMA_SKIP_TAGS = new Set([
  '[x-demo]', '.x-details', '[x-cluster]', '[x-stack]', '[x-flex]', '[x-searchfield]',
  '[x-accordion]', '[x-article]', '[x-articles]', '.x-select', '[x-skeleton]',
  '.x-dialog', '[x-fix-card]', 'x-view', '.x-audio',
]);

// One fetch attempt per derived schema NAME (not per element) -- avoids
// re-hammering the server with repeated 404s for a wb-* tag that genuinely
// has no matching schema.json (e.g. x-grid, x-modal). Keyed by the
// in-flight Promise (not a plain boolean): a page with several instances of
// the same tag (e.g. multiple <div x-switch>) fires several concurrent
// WB.inject() calls in the same synchronous scan() pass, all reaching this
// point before the first one's fetch has resolved -- a boolean flag set
// eagerly (as this used to do) would make every caller AFTER the first
// think loading was already "handled" and immediately call processElement()
// against a still-unregistered schema, silently skipping every instance but
// the very first (confirmed live: 1 of 17 <div x-switch> on forms.html got
// x-schema, the other 16 didn't). Awaiting the SAME shared promise -- the
// same pattern loadSchemaFile()'s own inFlightSchemaFetches map already uses
// for concurrent identical-filename fetches -- fixes that race.
const schemaLoadPromises = new Map(); // name -> in-flight Promise, removed once settled
const schemaLoadFailed = new Set();   // names confirmed to have no *.schema.json

async function ensureSchemaRegistered(name) {
  if (SchemaBuilder.getSchema(name) || schemaLoadFailed.has(name)) return;
  let promise = schemaLoadPromises.get(name);
  if (!promise) {
    promise = SchemaBuilder.loadSchemaFile(`${name}.schema.json`)
      .then(ok => { if (!ok) schemaLoadFailed.add(name); })
      .finally(() => schemaLoadPromises.delete(name));
    schemaLoadPromises.set(name, promise);
  }
  await promise;
}

/**
 * Build a <wb-*> element's internal DOM from its schema (if one exists and
 * this tag isn't self-sufficient) before a behavior is injected into it.
 * No-op for anything that isn't an eligible wb-* custom element, already
 * schema-built, or has no known behavior mapping at all.
 * @param {HTMLElement} element
 */
/**
 * Which schema, if any, this element wants built.
 *
 * 4.0.0 removed component TAGS. Everything an author writes is now an
 * attribute on a plain element -- <div x-card>, not <x-card>. This function's
 * caller used to begin `if (!tag.startsWith('x-')) return;`, and on a
 * <div x-card> the tag is "div", so it returned immediately: after 4.0.0 the
 * entire schema path in THIS runtime was unreachable. No $view got built and
 * no compliance.baseClass got applied. wb.js reaches processSchema by another
 * route and was unaffected, so the two runtimes silently diverged on every
 * schema-driven behavior -- and wb-lazy is the one 27 pages import (#884).
 *
 * The tag form is still honoured for the few real custom elements that remain.
 * The attribute form resolves through tag-map's extensionMap, the same source
 * of truth the behavior dispatch in this file already uses -- deriving a name
 * from the raw string instead would invent schemas that were never meant to
 * exist (x-grid builds its own DOM in connectedCallback and has no entry).
 */
function schemaNameFor(element) {
  const tag = element.tagName.toLowerCase();

  if (tag.startsWith('x-')) return elementMap[tag] || null;

  for (const attr of element.attributes) {
    const n = attr.name.toLowerCase();
    if (!n.startsWith('x-')) continue;
    if (n.startsWith('x-card') || SCHEMA_SKIP_TAGS.has(n)) continue;
    const name = extensionMap[n];
    if (name) return name;
  }
  return null;
}

async function buildSchemaIfNeeded(element) {
  flow('buildSchemaIfNeeded', `el=${elLabel(element)}`, `schema=${schemaNameFor(element) || 'none'}`);
  const tag = element.tagName.toLowerCase();
  if (tag.startsWith('x-') && (tag.startsWith('x-card') || SCHEMA_SKIP_TAGS.has(tag))) return;
  // x-modal only self-builds a trigger when used with modal-title/
  // modal-content (dialog.js's TRIGGER mode) -- matches wb.js's
  // WB.processSchema exactly.
  if (tag === '[x-modal]' && (element.hasAttribute('modal-title') || element.hasAttribute('modal-content'))) return;
  if (element.hasAttribute('x-schema')) return; // already schema-built

  const name = schemaNameFor(element);
  if (!name) return;

  await ensureSchemaRegistered(name);
  // processElement() re-derives/validates the schema name itself (and is
  // idempotent via its own processedElements WeakSet) -- safely no-ops if
  // nothing got registered above (no matching *.schema.json) or it's a tag
  // its own internal SCHEMA_EXCLUDED_TAGS list also excludes.
  SchemaBuilder.processElement(element);
}

// Track applied behaviors for cleanup
const applied = new WeakMap();

// Track pending injections to prevent race conditions
// Map<HTMLElement, Set<string>>
const pendingInjections = new Map();
let injectionTimeout = null;

// Shared observer for lazy loading
const lazyPending = new WeakMap();
let lazyObserver = null;

function getLazyObserver() {
  if (!lazyObserver) {
    lazyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const behaviors = lazyPending.get(element);
          if (behaviors) {
            behaviors.forEach(name => WB.inject(element, name));
            lazyPending.delete(element);
            lazyObserver.unobserve(element);
          }
        }
      });
    }, {
      // Start injecting well before the element is actually on screen so
      // scrolling to it doesn't show a visible pop-in. 200px wasn't enough
      // head start — a slight but visible delay was noticeable live when
      // scrolling lazy elements into view (#491). 1200px matches the value
      // x-demo.js's lazy observer already settled on for the same class of
      // pop-in (#390: 400px still lost to fast scrolls/nav jumps).
      rootMargin: '1200px'
    });
  }
  return lazyObserver;
}

/**
 * WB - Web Behavior Core
 */
const WB = {
  // Was hardcoded to '2.1.0', independently of wb.js's '3.0.0' -- drifted
  // and never bumped alongside the v3.0.0 rename elsewhere (#371).
  version: '3.0.0',
  
  // Expose behavior names for test compatibility (lazy-loaded, so this is just the registry)
  get behaviors() {
    // Return an object where keys are behavior names
    // This allows tests to check Object.keys(WB.behaviors).length > 0
    return behaviorModules;
  },

  /**
   * Inject a behavior into an element (async - loads behavior on demand)
   * @param {HTMLElement|string} element - Element or selector
   * @param {string} behaviorName - Name of behavior to inject
   * @param {Object} options - Behavior options (override data attributes)
   * @returns {Promise<Function|null>} Cleanup function or null if failed
   */
  /**
  * Workflow for injecting behaviors:
  *
  * 1. Identify the target element:
  *    - Use a proper HTML5 element (e.g., <div>, <section>, <article>, <aside>, <header>, <footer>, <main>, <nav>) as the base.
  *    - Reference it by selector (e.g., '#myElem') or pass the element directly.
  *
  * 2. Choose the behavior/component to inject (e.g., 'card', 'stack', 'repeater').
  *
  * 3. Select the injection method:
  *    a) Inject by URL:
  *       WB.inject('#myElem', 'card', { url: 'https://example.com/x-card.js' });
  *       // WBCard can inject into elements like <article>, <article>, <div x-cardimage>, <div x-cardvideo>, etc.
  *
  *    b) Inject by function/class:
  *       WB.inject('#myElem', 'stack', { factory: WBStack });
  *
  *    c) Inject by config object:
  *       WB.inject('#myElem', 'repeater', { config: { name: 'repeater', factory: () => new WBRepeater() } });
  *
  * 4. The behavior will be loaded and applied to the element asynchronously.
   */
  async inject(element, behaviorName, options = {}) {
    flow('inject', `el=${typeof element === 'string' ? element : elLabel(element)}`, `behavior=${behaviorName}`);
    // Resolve element if string selector
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }

    if (!element || !(element instanceof HTMLElement)) {
      console.warn(`[WB] Invalid element for behavior: ${behaviorName}`);
      return null;
    }

    // Check if behavior exists
    if (!hasBehavior(behaviorName)) {
      console.warn(`[WB] Unknown behavior: ${behaviorName}`);
      return null;
    }

    // Check if already applied
    const elementBehaviors = applied.get(element) || [];
    if (elementBehaviors.some(b => b.name === behaviorName)) {
      return null; // Already applied
    }

    // Check if pending (prevent race conditions)
    let pending = pendingInjections.get(element);
    if (pending && pending.has(behaviorName)) {
      return null; // Already pending
    }

    // Mark as pending
    if (!pending) {
      pending = new Set();
      pendingInjections.set(element, pending);
    }
    pending.add(behaviorName);

    try {
      // Load behavior JS and its CSS in parallel — same JIT loading wb.js
      // does (#342), so standalone demo pages get the same request-count
      // win the main SPA does.
      const [behaviorFn] = await Promise.all([
        getBehavior(behaviorName),
        ensureBehaviorCss(behaviorName)
      ]);

      // The element can be removed from the DOM (page nav swaps innerHTML,
      // a demo re-renders, etc.) while this import was in flight — most
      // behaviors assume `element.parentNode` is non-null (they wrap the
      // element via `parentNode.insertBefore`), so applying to a detached
      // element throws deep inside the behavior instead of failing cleanly.
      if (!element.isConnected) {
        return null;
      }

      // v3.0: build the host's internal DOM from its schema (if any) BEFORE
      // the behavior runs against it -- see buildSchemaIfNeeded()'s comment
      // above for the full rationale (#489, split off #322).
      await buildSchemaIfNeeded(element);
      if (!element.isConnected) {
        return null;
      }

      // Apply behavior
      const cleanup = behaviorFn(element, options);

      // Track for cleanup
      // Re-fetch applied behaviors as they might have changed (though unlikely with pending lock)
      const currentBehaviors = applied.get(element) || [];
      currentBehaviors.push({ name: behaviorName, cleanup });
      applied.set(element, currentBehaviors);

      return cleanup;
    } catch (error) {
      // Pass full Error object for stack trace extraction
      if (!error?.wbModuleLoadReported) {
        if (error?.wbModuleLoadFailure) error.wbModuleLoadReported = true;
        Events.error(`WB: ${behaviorName}`, error, {
          element: element.tagName,
          id: element.id,
          behavior: behaviorName
        });
      }
      
      // Mark element as having an error
      element.setAttribute('x-error', 'true');
      
      return null;
    } finally {
      // Remove from pending
      const p = pendingInjections.get(element);
      if (p) {
        p.delete(behaviorName);
        if (p.size === 0) {
          pendingInjections.delete(element);

          // #970: PER-ELEMENT COMPLETION SIGNAL.
          //
          // This element has no injections left in flight, so whatever it was
          // going to become, it now is. Stamped as an attribute because that is
          // the one thing a test can wait on natively:
          //
          //     await expect(locator).toHaveAttribute('x-ready', '');
          //
          // Playwright retries that assertion, so the wait ends the moment THIS
          // element is done rather than after a fixed sleep.
          //
          // Why per-element and not page-wide: measured on demos/site/cards.html,
          // two loads build the DOM in a DIFFERENT ORDER but reach a byte-for-byte
          // IDENTICAL end state (1,435 elements, same signature). The instability
          // was never wrong rendering — it was tests sampling mid-construction and
          // landing at different points. A page-wide signal cannot fix that here:
          // this page takes longer to finish than the 30s test timeout, which is
          // exactly how awaiting WB.ready killed 31 tests in beforeEach.
          //
          // Settled, not successful: a behavior that threw also stamps x-ready,
          // because the element is equally finished either way. Failure is
          // reported separately via x-error, and conflating "done" with "worked"
          // would make this signal lie in the one case that matters most.
          if (element.isConnected) element.setAttribute('x-ready', '');
        }
      }
    }
  },

  /**
   * Inject a behavior when element enters viewport
   * @param {HTMLElement} element 
   * @param {string} behaviorName 
   */
  lazyInject(element, behaviorName) {
    flow('lazyInject', `el=${elLabel(element)}`, `behavior=${behaviorName}`);
    // Check if already applied or pending
    const elementBehaviors = applied.get(element) || [];
    if (elementBehaviors.some(b => b.name === behaviorName)) return;
    
    const pending = pendingInjections.get(element);
    if (pending && pending.has(behaviorName)) return;

    // Add to lazy pending
    let behaviors = lazyPending.get(element);
    if (!behaviors) {
      behaviors = new Set();
      lazyPending.set(element, behaviors);
      getLazyObserver().observe(element);
    }
    behaviors.add(behaviorName);
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
      }
    } else {
      // Remove all behaviors
      elementBehaviors.forEach(({ cleanup }) => {
        if (typeof cleanup === 'function') cleanup();
      });
      applied.delete(element);
    }
  },

  /**
   * Scan DOM for x-* behaviors and wb-* custom elements
   * Uses batching for better performance
   * @param {HTMLElement} root - Root element to scan (default: document.body)
   */
  // `eager: true` skips the viewport-based IntersectionObserver deferral
  // entirely — every matched element is injected (and awaited) immediately
  // instead of waiting for it to scroll near the viewport. The lazy default
  // is a real perf win on long content pages, but it's the wrong tradeoff
  // for a surface where the user expects pasted/generated content to work
  // the instant it appears (e.g. demos/playground.html) — a user can click
  // a control before it's ever scrolled close enough to enhance, and see
  // nothing happen, which reads as broken rather than "not lazy-loaded yet".
  async scan(root = document.body, { eager = false } = {}) {
    flow('scan', `root=${elLabel(root)}`, `eager=${eager}`);
    // querySelectorAll() only matches DESCENDANTS of root, never root itself
    // — invisible until demo.js's `WB.scan(pre, { eager: true })` call, where
    // `pre` (the exact <pre x-behavior="pre"> just created) IS root. See
    // wb.js's matching fix for the full incident this caused (§7 sizing fed
    // by the code panel's un-wrapped raw-source width).
    const elements = matchingElements(root, '[x-behavior]');
    const injections = [];

    elements.forEach(element => {
      const behaviorList = element.getAttribute('x-behavior').split(/\s+/).filter(Boolean);
      const isEager = eager || element.hasAttribute('x-eager');

      behaviorList.forEach(name => {
        if (isEager) {
          injections.push(WB.inject(element, name));
        } else {
          WB.lazyInject(element, name);
        }
      });
    });

    // Custom elements scan (always active)
    customElementMappings.forEach(({ selector, behavior }) => {
      // querySelectorAll() excludes root itself. Include it when callers scan
      // one custom element directly (as the playground does for its theme
      // control), otherwise the registration silently never runs.
      const customElements = matchingElements(root, selector);
      customElements.forEach(element => {
        if (eager) {
          injections.push(WB.inject(element, behavior));
        } else {
          WB.lazyInject(element, behavior);
        }
      });
    });

    // Auto-inject scan. Unconditional per-element check -- `variant` triggers
    // the mapped behavior regardless of the global autoInject setting (see
    // getAutoInjectBehaviors() above for the full rationale/incident).
    {
      autoInjectMappings.forEach(({ selector, behavior }) => {
        // Was bare querySelectorAll: the auto-inject loop missed the root
        // element, so scanning a native tag directly did nothing (#845).
        const autoElements = matchingElements(root, selector);
        autoElements.forEach(element => {
          if (!getConfig('autoInject') && !element.hasAttribute('variant')) return;
          // Skip if explicitly opted out (matches getAutoInjectBehaviors()'s
          // own x-ignore check, and wb.js's autoInjectMappings loop) -- this
          // inline copy lacked it, so a plain <header>/<footer>/etc. used for
          // page content had no working escape hatch on the initial scan.
          if (element.hasAttribute('x-ignore')) return;
          // #923: and skip when an explicit x-* attribute REPLACES this
          // behavior. This inline copy never had the check, which is why
          // <article x-cardimage> still rendered twice after the guard was
          // fixed in getAutoInjectBehaviors() above -- the rule has to hold on
          // every injection path, not just the tidiest one.
          if (isReplacedByExplicitBehavior(element, behavior)) return;
          // Skip if x-behavior is present (already handled)
          if (!element.hasAttribute('x-behavior')) {
            if (eager) {
              injections.push(WB.inject(element, behavior));
            } else {
              WB.lazyInject(element, behavior);
            }
          }
        });
      });
    }

    // Wait for all injections (eager mode + any x-eager elements)
    await Promise.all(injections);
    
    if (getConfig('debug')) {
      Events.log('info', 'WB', `Scanned: ${elements.length} elements`);
    }
  },

  /**
   * Watch for new elements with x-* behaviors (MutationObserver)
   * @param {HTMLElement} root - Root element to observe (default: document.body)
   * @returns {MutationObserver} The observer instance
   */
  observe(root = document.body) {
    flow('observe', `root=${elLabel(root)}`);
    // Disconnect existing observer if present to prevent duplicates
    if (WB._observer) {
      WB._observer.disconnect();
    }

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        // Handle added nodes
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if node itself has x-behavior
            if (node.hasAttribute('x-behavior')) {
              const behaviorList = node.getAttribute('x-behavior').split(/\s+/).filter(Boolean);
              const isEager = node.hasAttribute('x-eager');
              behaviorList.forEach(name => {
                if (isEager) WB.inject(node, name);
                else WB.lazyInject(node, name);
              });
            } else {
              // Check auto-inject for the node itself
              const autoBehaviors = getAutoInjectBehaviors(node);
              autoBehaviors.forEach(name => WB.lazyInject(node, name));
            }

            // Check descendants
            if (node.hasChildNodes?.()) {
              node.querySelectorAll?.('[x-behavior]').forEach(el => {
                const behaviorList = el.getAttribute('x-behavior').split(/\s+/).filter(Boolean);
                const isEager = el.hasAttribute('x-eager');
                behaviorList.forEach(name => {
                  if (isEager) WB.inject(el, name);
                  else WB.lazyInject(el, name);
                });
              });
            }

            // Check descendants for custom elements (always active)
            if (node.hasChildNodes?.()) {
              customElementMappings.forEach(({ selector, behavior }) => {
                node.querySelectorAll?.(selector).forEach(el => {
                  WB.lazyInject(el, behavior);
                });
              });
            }

            // Check descendants for auto-inject. Unconditional per-element
            // check -- `variant` triggers the mapped behavior regardless of
            // the global autoInject setting.
            if (node.hasChildNodes?.()) {
              autoInjectMappings.forEach(({ selector, behavior }) => {
                node.querySelectorAll?.(selector).forEach(el => {
                  if (!getConfig('autoInject') && !el.hasAttribute('variant')) return;
                  // #923: same replacement guard as the scan path -- a node
                  // added later must resolve identically to the same markup
                  // present at load.
                  if (isReplacedByExplicitBehavior(el, behavior)) return;
                  if (!el.hasAttribute('x-behavior')) {
                    WB.lazyInject(el, behavior);
                  }
                });
              });
            }
          }
        }

        // Handle attribute changes on x-behavior
        if (mutation.type === 'attributes' && mutation.attributeName === 'x-behavior') {
          const element = mutation.target;
          const behaviorList = element.getAttribute('x-behavior')?.split(/\s+/).filter(Boolean) || [];
          const isEager = element.hasAttribute('x-eager');
          
          // Remove behaviors no longer in list
          const current = applied.get(element) || [];
          current.forEach(({ name, cleanup }) => {
            if (!behaviorList.includes(name)) {
              if (typeof cleanup === 'function') cleanup();
            }
          });

          // Add new behaviors
          behaviorList.forEach(name => {
            if (isEager) WB.inject(element, name);
            else WB.lazyInject(element, name);
          });
        }
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['x-behavior']
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
    if (lazyObserver) {
      lazyObserver.disconnect();
      lazyObserver = null;
    }
  },

  /**
   * Get list of available behaviors
   * @returns {string[]} Array of behavior names
   */
  list() {
    return listBehaviors();
  },

  /**
   * Check if a behavior exists
   * @param {string} name - Behavior name
   * @returns {boolean}
   */
  has(name) {
    return hasBehavior(name);
  },

  /**
   * Preload specific behaviors (for critical path optimization)
   * @param {string[]} names - Behavior names to preload
   */
  async preload(names) {
    await preloadBehaviors(names);
  },

  /**
   * Get loading statistics
   * @returns {Object} Cache stats
   */
  stats() {
    return getCacheStats();
  },

  /**
   * The injection workflow for this page load, in order (#970).
   *
   * One line per traced entry point, with the parameter values that decided
   * what happened next. Two runs of the same page should produce the same
   * sequence; where they diverge is where the state differs, and that first
   * divergence is the lead worth following.
   *
   * @returns {string[]} entry-point lines, oldest first
   */
  flowTrace() {
    return flowBuffer.slice();
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
      autoInject, // No default here — see the setConfig() call below for why.
      preload = [] // Array of behavior names to preload
    } = options;

    // Set debug mode
    if (debug) {
      setConfig('debug', true);
      setConfig('logLevel', 'debug');
    }

    // Live report: "hundreds of stack traces [in devtools], not one showing
    // in the error log" -- setupGlobalErrorHandler() was a complete, working
    // implementation that nothing ever called (idempotent, guarded inside
    // error-logger.js itself, so it's safe alongside this init()'s own
    // defensive re-call pattern below).
    setupGlobalErrorHandler();

    // Set autoInject — ONLY when the caller explicitly passed it, not
    // unconditionally. #461 (found while investigating #460): WB.init() is
    // meant to be called defensively/idempotently by every independent
    // component that uses WB — see any
    // framework code sample on demos/frameworks.html (React's useEffect,
    // Vue's/Svelte's onMount(ed), Angular's ngOnInit, Solid's onMount): each
    // calls a bare `WB.init()` with no options, on top of whatever the
    // page's own top-level script already configured. Config is a shared,
    // page-wide singleton (setConfig mutates one module-level object) — if
    // a bare call unconditionally overwrote autoInject with ITS OWN local
    // default (`false`), the LAST WB.init() call to actually RESOLVE (not
    // necessarily the one that ran last in source order — async work like a
    // client-side compile step can reorder completion) would silently win
    // and turn autoInject back off for the rest of the page's lifetime.
    // Confirmed live on demos/frameworks.html: the Svelte/SolidJS sections'
    // own onMount() calls a bare WB.init() AFTER their async compile step,
    // which can resolve AFTER the page's bottom-of-body
    // `WB.init({ autoInject: true })` — clobbering it back to false and
    // silently breaking auto-injected behaviors (and the site-wide click-
    // confirmation toast, #456) for the WHOLE page, not just the newly-
    // mounted element. Only writing when the key is actually present in
    // `options` preserves both documented contracts at once: an explicit
    // `{ autoInject: false }` still forces it off (tests/compliance/
    // autoinject-default-false.spec.ts), and config.js's own module-level
    // default (false) still applies when NO call on the page ever passes it
    // at all — but a defensive, options-less re-init from one component
    // never stomps on a value a DIFFERENT call already explicitly set.
    if ('autoInject' in options) setConfig('autoInject', autoInject);

    // Set theme
    if (theme) {
      Theme.set(theme);
    }

    // Preload critical behaviors
    if (preload.length > 0) {
      await preloadBehaviors(preload);
    }

    // Scan existing elements
    //
    // #962: the DOMContentLoaded branch used to be `() => WB.scan()` — the boot
    // scan's promise was created inside a callback and thrown away. On a real
    // page load the document IS still loading, so that was the normal path:
    // init() resolved before the scan had even started, and NOTHING anywhere
    // held a handle to it.
    //
    // That made readiness unobservable from outside, which is why 492 tests
    // fall back to `waitForTimeout` and guess how long injection takes. A guess
    // about duration fails whenever the machine is slower than the guess — on a
    // 4-core box running 8 workers, often — which is the suite's instability
    // (#961: 19 tests each failing exactly 1 of 3 identical runs).
    //
    // scan() already awaits every injection (Promise.all, line ~691). The only
    // thing missing was keeping its promise. WB.ready is that promise, so a
    // caller can `await WB.ready` instead of sleeping. It resolves when the
    // initial pass is done — NOT when every element on the page is injected,
    // since below-the-fold elements are deferred to the IntersectionObserver
    // by design.
    // NOTE: the `loading` branch deliberately does NOT await. init() must keep
    // returning without waiting for DOMContentLoaded, exactly as before —
    // awaiting here would defer the rest of init (observe registration, the
    // ready log) until DOM ready and change boot timing for every page. The
    // promise is only retained, not waited on.
    if (shouldScan && typeof document !== 'undefined') {
      WB.ready = document.readyState === 'loading'
        ? new Promise((resolve) => {
            document.addEventListener('DOMContentLoaded', () => resolve(WB.scan()));
          })
        : WB.scan();
      if (document.readyState !== 'loading') await WB.ready;
    } else {
      WB.ready = Promise.resolve();
    }

    // Start observing
    if (shouldObserve && typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => WB.observe());
      } else {
        WB.observe();
      }
    }

    console.log(`✅ WB v${WB.version} initialized (lazy loading enabled)`);
    
    if (debug) {
      Events.log('info', 'WB', 'Initialized', options);
    }

    return WB;
  },

  /**
   * Render JSON definition to DOM elements
   * @param {Object|Array} data - Component definition(s)
   * @param {HTMLElement} container - Target container (appends to it)
   * @returns {HTMLElement|HTMLElement[]} The created element(s)
   */
  render(data, container = null) {
    // Handle Array (Fragment)
    if (Array.isArray(data)) {
      const elements = data.map(item => WB.render(item, container));
      return elements;
    }

    if (!data) return null;

    // 1. Determine Tag Name
    let tagName = data.t || 'div';
    let isCustomTag = false;

    // Try to find a custom tag for the behavior
    if (data.b) {
      const mapping = customElementMappings.find(m => m.behavior === data.b);
      // Only use selector if it's a simple tag name (not [attr] or .class)
      if (mapping && /^[a-z][a-z0-9-]*$/.test(mapping.selector)) {
        tagName = mapping.selector;
        isCustomTag = true;
      }
    }

    // 2. Create Element
    const el = document.createElement(tagName);

    // 3. Apply Data Attributes (Props)
    if (data.d) {
      Object.entries(data.d).forEach(([key, val]) => {
        // Handle boolean attributes
        if (val === true) {
          el.setAttribute(`data-${key}`, 'true'); // Standardize on string 'true' for data attrs
        } else if (val === false) {
          // Skip false
        } else {
          el.dataset[key] = val;
        }
      });
    }

    // 4. Apply Behaviors
    // If we didn't find a custom tag, or if there are extra behaviors, set x-behavior
    const behaviors = data.behaviors || [];
    if (data.b && !isCustomTag) {
      behaviors.push(data.b);
    }
    
    if (behaviors.length > 0) {
      el.setAttribute('x-behavior', behaviors.join(' '));
    }

    // 5. Apply ID and Classes
    if (data.id) el.id = data.id;
    if (data.classes) el.className = data.classes;
    if (data.style) Object.assign(el.style, data.style);

    // 6. Handle Content/Children
    if (data.content) {
      el.textContent = data.content;
    } else if (data.html) {
      el.innerHTML = data.html;
    }
    
    if (data.children && Array.isArray(data.children)) {
      data.children.forEach(child => WB.render(child, el));
    }

    // 7. Append to container if provided
    if (container && container.appendChild) {
      container.appendChild(el);
    }

    return el;
  },

  // Expose core modules
  Events,
  Theme,
  config: { get: getConfig, set: setConfig }
};

// Global export
if (typeof window !== 'undefined') {
  if (window.WB) {
    Object.assign(window.WB, WB);
  } else {
    window.WB = WB;
  }
}

export { WB };
export default WB;
