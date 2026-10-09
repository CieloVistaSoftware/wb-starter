/**
 * WB - Web Behavior (Lazy Loading Version)
 * =========================================
 * Pure JavaScript behavior injection library.
 * Behaviors are loaded on-demand when first used.
 * 
 * @version 2.1.0
 * @license MIT
 */

import { hasAuthoredAttr } from './read-attr.js';
import { getBehavior, hasBehavior, listBehaviors, preloadBehaviors, getCacheStats, behaviorModules } from '../wb-viewmodels/index.js';
import { markReady } from './ready-signal.js';
import { Events } from './events.js';
import './click-confirm.js';
import { Theme } from './theme.js';
import { getConfig, setConfig } from './config.js';
import { matchingElements } from './dom-query.js';
import { setRule } from './dynamic-style.js';
import { setupGlobalErrorHandler } from './error-logger.js';
import { elementMap, nativeMap, extensionMap } from './tag-map.js';
import { isReplacedByExplicitBehavior, DIRECTIVES } from './replacement-guard.js';
import { warnXBehaviorDeprecated } from './x-behavior-deprecation.js';
import { isComponentLandmark } from './component-landmark.js';
import { semanticPropertyMappings } from './semantic-attributes.js';
import { ensureBehaviorCss } from './style-loader.js';
import { makeDlog, traceStatusLabel, isTraceCategoryEnabled } from './debug-trace.js';
import { sliceOverBudget, nextSlice } from './main-thread-budget.js';
import { runtimeTracker, settledCall } from './injection-tracker.js';
import {
  beginInFlight, failInjection, removeApplied, installReadiness,
  startObserving, stopObserving, commonInitOptions, bootDocument,
} from './runtime-shared.js';
import SchemaBuilder from './mvvm/schema-builder.js';
import { aliasesFor, BEHAVIOR_ALIASES } from './attribute-aliases.js';
import { teachByExample } from './teach-by-example.js';

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
 * Always recorded, even when the `flow` category is off: the entry point and
 * its parameters cost one string per call, and a trace you have to reproduce
 * a failure to enable is useless for the failure that already happened.
 * Logging still respects the category, so consoles stay quiet by default.
 *
 * The CALLER is recorded only while the `flow` category is on (#961). Finding
 * it means capturing and parsing a stack on every call, and on
 * cards-permutation-matrix.html that was 113ms of a single 1.7s main-thread
 * task, paid by every visitor whose tracing was off. Turn the category on to
 * get `fn(params) <- caller` lines again.
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
 * not `flow` itself. Called only while the `flow` category is on: it was
 * described as "microseconds", but inject/lazyInject/getAutoInjectBehaviors
 * ARE per element, and a profile of one card page put it at 113ms (#961).
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

// Whether the `flow` category is on, read at most every 250ms: the category
// lives in localStorage, and reading and parsing it on every call was its own
// cost on the hot path (#961). A flip still takes effect without a reload.
let flowCheckedAt = -Infinity;
let flowOn = false;
function flowEnabled() {
  const t = performance.now();
  if (t - flowCheckedAt > 250) {
    flowOn = isTraceCategoryEnabled('flow');
    flowCheckedAt = t;
  }
  return flowOn;
}

function flow(fn, ...parts) {
  const on = flowEnabled();
  const call = `${fn}(${parts.filter((p) => p !== undefined).join(', ')})`;
  const line = on ? `${call} <- ${callerFrame(fn)}` : call;
  if (flowBuffer.length < FLOW_LIMIT) flowBuffer.push(line);
  if (on) dlog('flow', `[flow] ${line}`);
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

// x-grid was described here as a REAL custom element (x-grid.js, eagerly
// imported by wb.js) whose own connectedCallback called the layout function
// directly. It never was one -- nothing called customElements.define() for
// WBGrid, so that connectedCallback never ran, and the file is now deleted
// (#1063). x-grid dispatches as an ordinary injected behavior on BOTH
// runtimes, which is what this entry already did.
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
  'x-flip': 'flip',
  'x-flash': 'flash',
  'x-relativetime': 'relativetime',
  // x-glow, x-rainbow, x-sparkle: removed (#831). extensionMap in tag-map.js
  // already declares each with the same selector and behavior, so every
  // x-glow element matched two mappings and was queued twice.
  'x-password': 'password',
  // #1185: documented from 4.0.0, never wired here (wb.js resolves x-{name}).
  'x-ul': 'ul',
  'x-ol': 'ol',
  'x-dl': 'dl',
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
  // x-toast and x-collapse all moved to tag-map.js's extensionMap (shared
  // with wb.js) -- see the comment block there for the drawer/drawer-layout
  // disambiguation notes.
};

/**
 * `[x-{name}]` for each registered behavior no map above routes (#1642).
 * Computed from the registry, not listed, so a behavior added to index.js
 * gets its attribute without anyone remembering to add it here.
 * @returns {{selector: string, behavior: string}[]}
 */
// Not routed on their own: move.js's move() wires these on the buttons inside
// its x-move container. Routing them here too would bind every button twice,
// and one click would swap the item two places instead of one.
const PARENT_WIRED_BEHAVIORS = new Set(['moveup', 'movedown', 'moveleft', 'moveright']);

function unroutedBehaviorAttributes() {
  const routed = new Set([
    ...Object.keys(extensionMap),
    ...Object.keys(WB_LAZY_ONLY_ATTRIBUTES),
    ...Object.keys(BEHAVIOR_ALIASES).map((old) => `x-${old}`),
  ]);
  return listBehaviors()
    .filter((name) => !routed.has(`x-${name}`) && !DIRECTIVES.has(name) && !PARENT_WIRED_BEHAVIORS.has(name))
    .map((name) => ({ selector: `[x-${name}]`, behavior: name }));
}

// Auto-injection mappings
const customElementMappings = [
  ...Object.entries(elementMap)
    .filter(([selector]) => !ELEMENT_MAP_OVERRIDES.has(selector))
    .map(([selector, behavior]) => ({ selector, behavior })),
  ...Object.entries(extensionMap)
    .map(([attr, behavior]) => ({ selector: `[${attr}]`, behavior })),
  ...Object.entries(WB_LAZY_ONLY_ELEMENTS).map(([selector, behavior]) => ({ selector, behavior })),
  ...Object.entries(WB_LAZY_ONLY_ATTRIBUTES).map(([attr, behavior]) => ({ selector: `[${attr}]`, behavior })),
  // A renamed behavior's old attribute runs the new behavior (#668).
  ...Object.entries(BEHAVIOR_ALIASES).map(([old, now]) => ({ selector: `[x-${old}]`, behavior: now })),
  // Every other registered behavior by its own x-{name} attribute (#1642).
  // These 46 (list, json, divider, datepicker, hotkey, ...) were reachable
  // ONLY as x-behavior="name": <ul x-list> did nothing at all, silently, while
  // knownBehaviorAttributes() below called the attribute known. wb.js already
  // routed every registered name this way. With x-behavior deprecated, the
  // attribute is the one spelling, so it has to work for every behavior.
  ...unroutedBehaviorAttributes(),
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

  // Skip if x-behavior is already present (explicit overrides implicit).
  // #967: ask the shared guard first, so <pre x-behavior="pre"> on an
  // auto-inject page reports that it restates the tag, on this runtime as on
  // wb.js. Only the report matters here; the element is skipped either way.
  if (element.hasAttribute('x-behavior')) {
    const xPrefix = getConfig('prefix') || 'x';
    for (const { selector, behavior } of autoInjectMappings) {
      if (element.matches(selector)) isReplacedByExplicitBehavior(element, behavior, xPrefix);
    }
    return behaviors;
  }

  // Skip native/auto-inject entirely when explicitly opted out. wb.js's own
  // autoInjectMappings loop already honors x-ignore this way (see its
  // "Only skip if explicitly ignored" comment) -- this engine lacked the
  // same check, so a plain <header>/<footer>/etc. used for page content
  // (not the generic x-header/x-footer navbar treatment) had no working
  // escape hatch on this engine, silently getting hijacked by the native
  // behavior's classes/layout regardless of x-ignore.
  if (element.hasAttribute('x-ignore')) return behaviors;

  // A card's own <header>/<footer> is the card's, not the page's
  // (component-landmark.js). This runtime never had the rule, so card headers
  // on every lazy page picked up x-header and its padding.
  if (isComponentLandmark(element)) return behaviors;

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
// x-skeleton, x-dialog, x-select, x-articles, x-fix-card),
// or -- for x-cluster/x-stack/x-row/x-search/x-accordion, which have no
// schema.json of their own at all -- a dead fetch that just 404s.
//
// The entries are ATTRIBUTE NAMES, compared against `attr.name` in
// schemaNameFor(). They used to read '[x-demo]', '.x-details', '.x-select',
// ... -- selector/class spellings left by the 4.0.0 tag-to-attribute rewrite
// -- and an attribute name never equals '[x-demo]', so the set matched
// nothing: every self-building behavior with a non-empty $view (details,
// articles, select, skeleton, dialog, audio) got schema-built AND built by
// its behavior. x-dropdown is the same kind of behavior (dropdown() builds
// its trigger and menu) and was missing: its $view emptied the author's
// trigger text and left a second, empty menu beside the real one.
const SCHEMA_SKIP_TAGS = new Set([
  'x-demo', 'x-details', 'x-cluster', 'x-stack', 'x-flex', 'x-searchfield',
  'x-accordion', 'x-articles', 'x-select', 'x-skeleton',
  'x-dialog', 'x-fix-card', 'x-view', 'x-audio', 'x-dropdown',
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
    const name = extensionMap[n] || BEHAVIOR_ALIASES[n.slice(2)];
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
  // (Was `tag === '[x-modal]'`, which no tag name can equal -- same rewrite
  // damage as SCHEMA_SKIP_TAGS above.)
  if (element.hasAttribute('x-modal') && (hasAuthoredAttr(element, 'modal-title') || hasAuthoredAttr(element, 'modal-content'))) return;
  if (element.hasAttribute('x-schema')) return; // already schema-built

  const name = schemaNameFor(element);
  if (!name) return;

  await ensureSchemaRegistered(name);
  // processElement() re-derives/validates the schema name itself (and is
  // idempotent via its own processedElements WeakSet) -- safely no-ops if
  // nothing got registered above (no matching *.schema.json) or it's a tag
  // its own internal SCHEMA_EXCLUDED_TAGS list also excludes.
  keepAuthoredText(element, SchemaBuilder.getSchema(name));
  SchemaBuilder.processElement(element);
}

/**
 * Text written INSIDE the tag is the author's content: <div x-checkbox>Run
 * tests</div> means a checkbox labelled "Run tests". processElement() clears
 * the host and fills each {{prop}} slot of the $view from the attribute or,
 * failing that, the schema default -- so the author's words were thrown away
 * and the placeholder "this is the label" rendered instead (wb.js pages kept
 * the text, because checkbox.js builds there and reads textContent). When the
 * host holds only text and no attribute sets the $view's text slot, that text
 * becomes the slot's attribute before the build runs.
 */
function keepAuthoredText(element, schema) {
  if (!schema || element.children.length) return;
  const text = (element.textContent || '').trim();
  if (!text) return;
  // A part whose content is `<slot>{{prop}}</slot>` is where the schema says
  // authored content goes, so it wins over the first bare `{{prop}}`. Without
  // this, drawer.schema.json's `{{title}}` part (listed before its
  // `<slot>{{content}}</slot>` body) took the text: `<aside x-drawer>position=
  // left</aside>` got title="position=left" -- a panel headed by what should
  // have been its body, plus a native tooltip repeating it on the trigger.
  const parts = (schema.$view || []).map((part) => String(part.content || '').trim());
  const slot = parts.map((c) => /^<slot>\{\{(\w+)\}\}<\/slot>$/.exec(c)).find(Boolean)
    || parts.map((c) => /^\{\{(\w+)\}\}$/.exec(c)).find(Boolean);
  if (!slot) return;
  const prop = slot[1];
  const attr = prop.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
  if (element.hasAttribute(attr) || element.hasAttribute(prop)) return;
  // A registered synonym (drawer-content for content) is the author setting
  // that slot too; the text is then the trigger's label, not its content.
  if (aliasesFor(schema.schemaFor, prop).some((a) => element.hasAttribute(a))) return;
  element.setAttribute(attr, text);
}

// Track applied behaviors for cleanup
const applied = new WeakMap();

// Track pending injections to prevent race conditions
// Map<HTMLElement, Set<string>>
const pendingInjections = new Map();
// element -> Map<behaviorName, Promise> settling when that injection finishes,
// so a second inject() of an in-flight behavior can wait for it.
const inFlight = new WeakMap();
let injectionTimeout = null;
// #961/#962: the countable, awaitable view of the same in-flight work.
// Same module wb.js uses — one contract, implemented once (#923/#951 are what
// happens when the two runtimes each grow their own copy).
// #962: shared with wb.js, so either runtime's settled() sees all work.
const injectionTracker = runtimeTracker;

// Shared observer for lazy loading
const lazyPending = new WeakMap();
// observed element -> the elements waiting on it. Usually just itself; see
// lazyWatchTarget() for when it is not.
const lazyWatchers = new WeakMap();
let lazyObserver = null;
// #962: observed element -> a promise settled by the observer's FIRST report on
// it. An IntersectionObserver always reports every newly observed element once,
// visible or not, so this is a callback, never a timer: in view -> resolved when
// its injections finish; out of view -> resolved at once, because work that is
// deliberately deferred is not work in flight. scan() awaits these, so an
// awaited scan() -- and navigateTo() behind it -- ends with the visible page
// built instead of a promise that runs ahead of it.
const lazyFirstReport = new WeakMap();

function firstReportFor(target) {
  let entry = lazyFirstReport.get(target);
  if (!entry) {
    let resolve;
    const promise = new Promise((r) => { resolve = r; });
    entry = { promise, resolve, reported: false };
    lazyFirstReport.set(target, entry);
    watchForRemoval(target, entry);
  }
  return entry;
}

// #1246: a target removed from the document before the observer's first
// report on it is not work in flight -- it can never be shown. On Windows CI
// Chromium sometimes never delivers that report (the diagnostics read
// "progress (awaiting viewport)" pending with no progress element left in the
// stage), so settled() waited out its deadline on an element that no longer
// existed. One MutationObserver, live only while a first report is awaited,
// settles such a target the moment it leaves the document.
const awaitingFirstReport = new Map();
let removalObserver = null;
function watchForRemoval(target, entry) {
  awaitingFirstReport.set(target, entry);
  entry.promise.then(() => forgetAwaiting(target));
  if (!removalObserver && typeof MutationObserver === 'function') {
    removalObserver = new MutationObserver(() => {
      awaitingFirstReport.forEach((pending, node) => {
        if (node.isConnected) return;
        pending.reported = true;
        pending.resolve();
        forgetAwaiting(node);
      });
    });
    removalObserver.observe(document, { childList: true, subtree: true });
  }
}
function forgetAwaiting(target) {
  awaitingFirstReport.delete(target);
  if (!awaitingFirstReport.size && removalObserver) {
    removalObserver.disconnect();
    removalObserver = null;
  }
}

/**
 * The element whose intersection stands in for `element`'s.
 *
 * An element that is display:none BY ITS OWN STYLE has no box, and an
 * IntersectionObserver never reports a boxless element as intersecting -- so
 * a behavior deferred until it is near the viewport was deferred forever.
 * That is exactly the elements whose behavior is what makes them visible: a
 * native <audio> without `controls` is display:none until audio.js builds its
 * player, so <audio src playlist show-eq> rendered as nothing at all
 * (demos/site/content.html; live-examples-render.spec.ts). Its parent has a
 * box in the same place, so watch that instead. An element hidden by an
 * ANCESTOR (a closed <details>, an inactive tab) keeps being watched itself:
 * it gains a box the moment that ancestor shows, and that is when it should
 * build.
 */
function lazyWatchTarget(element) {
  // Computed display, not getClientRects(): it answers the same question for
  // the element's OWN style (an ancestor's display:none leaves the child's
  // computed value alone) and costs a style lookup, not a forced layout per
  // deferred element.
  if (!element.parentElement) return element;
  return getComputedStyle(element).display === 'none' ? element.parentElement : element;
}

function getLazyObserver() {
  if (!lazyObserver) {
    lazyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const target = entry.target;
        const report = firstReportFor(target);
        if (entry.isIntersecting) {
          const waiting = lazyWatchers.get(target);
          lazyWatchers.delete(target);
          lazyObserver.unobserve(target);
          const injections = [];
          if (waiting) {
            waiting.forEach((element) => {
              const behaviors = lazyPending.get(element);
              if (behaviors) {
                behaviors.forEach(name => injections.push(WB.inject(element, name)));
                lazyPending.delete(element);
              }
            });
          }
          // Settled by the injections themselves: they resolve when built.
          Promise.all(injections).then(() => report.resolve(), () => report.resolve());
          lazyFirstReport.delete(target);
        } else if (!report.reported) {
          // First report says "not in view": nothing is in flight for it.
          // A later scroll injects it through the branch above.
          report.reported = true;
          report.resolve();
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

    // #1168: x-ignore opts an element out of EVERY behavior, here as in
    // wb.js's inject(). This runtime honoured it only for native auto-inject,
    // so <span x-chip x-ignore> became a chip on every lazy page (the demos and
    // the behaviors page) while wb.js left it alone. inject() is the choke
    // point the scan loops, lazyInject and direct callers all reach.
    if (element.hasAttribute('x-ignore')) {
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
      // Already pending: wait for it, as wb.js does. Returning at once let
      // `await WB.scan(root)` resolve while the injection was still in flight.
      await inFlight.get(element)?.get(behaviorName);
      return null; // the first caller owns the cleanup
    }

    // Mark as pending
    if (!pending) {
      pending = new Set();
      pendingInjections.set(element, pending);
    }
    pending.add(behaviorName);
    const settle = beginInFlight(inFlight, element, behaviorName);
    // Counted here, AFTER every early return above, so start/end always pair:
    // an invalid element, an unknown behavior, an already-applied or
    // already-pending behavior all bail before this line and never reach the
    // finally below.
    const injectionRecord = injectionTracker.start(behaviorName, element);

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

      // #961: each await above resolves as a microtask once the module is
      // cached, so without a yield every injection on the page, and the DOM
      // it builds, ran inside ONE task: 1.4s to 4.5s on the card matrix
      // fixture, with the page unable to paint or answer anything meanwhile.
      // Give the task back when this slice has used its budget. The check is
      // inline and synchronous right before the work it guards (see
      // main-thread-budget.js). The injection is already counted as in
      // flight, so settled()/whenIdle() keep waiting through the yield, and
      // x-ready is still stamped only in the finally below.
      while (sliceOverBudget()) await nextSlice();
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

      // An empty invocation is a cry for help — answer it by demonstrating.
      await teachByExample(element, behaviorName);

      // Apply behavior
      // Awaited: an async behavior (x-mdhtml loads marked, fetches, renders)
      // returns a Promise at its first await. Unawaited, the finally below
      // stamped x-ready and released whenIdle() while the element was still
      // empty and loading, and the Promise was recorded as its "cleanup", so
      // removal tore nothing down. wb.js already awaited; this had drifted (#1219).
      // Same slice check as above, again right before the synchronous part.
      while (sliceOverBudget()) await nextSlice();
      if (!element.isConnected) {
        return null;
      }
      const cleanup = await behaviorFn(element, options);

      // Track for cleanup
      // Re-fetch applied behaviors as they might have changed (though unlikely with pending lock)
      const currentBehaviors = applied.get(element) || [];
      currentBehaviors.push({ name: behaviorName, cleanup });
      applied.set(element, currentBehaviors);

      return cleanup;
    } catch (error) {
      // Reported with its stack (once: a module-load failure is reported by
      // the first element that hit it), and marked x-error on the element.
      const report = !error?.wbModuleLoadReported;
      if (report && error?.wbModuleLoadFailure) error.wbModuleLoadReported = true;
      failInjection(element, behaviorName, error, { report });
      
      return null;
    } finally {
      // Release anyone awaiting this injection, then remove from pending.
      inFlight.get(element)?.delete(behaviorName);
      settle();
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
          // #1094: was an unconditional attribute write. Nothing in the product
          // read it — 0 CSS rules, 0 runtime readers — so every visitor carried
          // a Playwright hook on every element. markReady keeps the knowledge;
          // the DOM stamp is opt-in, which in practice means the test harness.
          markReady(element);
        }
      }
      // Last, so a whenIdle() waiter woken by this always observes the
      // x-ready stamp above rather than racing it.
      injectionTracker.end(injectionRecord);
    }
  },

  // pendingCount, pendingBehaviors, whenIdle() and settled(): installed from
  // runtime-shared.js just after this object, the same for both runtimes (#883).


  /**
   * Inject a behavior when element enters viewport
   * @param {HTMLElement} element 
   * @param {string} behaviorName 
   */
  /**
   * Inject when the element nears the viewport.
   * @returns {Promise<void>} resolves once the observer has reported on it:
   *   after the injection if it is in view, at once if it is deferred (#962).
   */
  lazyInject(element, behaviorName) {
    flow('lazyInject', `el=${elLabel(element)}`, `behavior=${behaviorName}`);
    // Check if already applied or pending
    const elementBehaviors = applied.get(element) || [];
    if (elementBehaviors.some(b => b.name === behaviorName)) return Promise.resolve();

    const pending = pendingInjections.get(element);
    if (pending && pending.has(behaviorName)) {
      return inFlight.get(element)?.get(behaviorName) || Promise.resolve();
    }

    // Add to lazy pending
    const target = lazyWatchTarget(element);
    let behaviors = lazyPending.get(element);
    if (!behaviors) {
      behaviors = new Set();
      lazyPending.set(element, behaviors);
      let waiting = lazyWatchers.get(target);
      if (!waiting) {
        waiting = new Set();
        lazyWatchers.set(target, waiting);
        // Created before observe(), so the observer's first report finds it,
        // and counted as work until that report arrives (#962): until the
        // observer says whether it is in view, nobody knows it is finished.
        injectionTracker.track(`${behaviorName} (awaiting viewport)`, firstReportFor(target).promise);
        getLazyObserver().observe(target);
      }
      waiting.add(element);
    }
    behaviors.add(behaviorName);
    const report = lazyFirstReport.get(target);
    return report ? report.promise : Promise.resolve();
  },

  /**
   * Remove a specific behavior from an element
   * @param {HTMLElement} element - Target element
   * @param {string} behaviorName - Behavior to remove (or all if not specified)
   */
  remove(element, behaviorName = null) {
    removeApplied(applied, element, behaviorName);
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
    // `pre` (the exact <pre> just created) IS root. See
    // wb.js's matching fix for the full incident this caused (§7 sizing fed
    // by the code panel's un-wrapped raw-source width).
    // x-behavior="a b" is deprecated (#1642): old markup still runs, and warns.
    const elements = matchingElements(root, '[x-behavior]');
    const injections = [];
    // One queueing rule for all three scans below (#883: it was written out
    // three times): inject now, or hand to the viewport-deferred lazy path.
    // x-eager is honoured on EVERY path, not only on x-behavior hosts (#1642):
    // it used to be read only there, so <pre x-eager> built lazily the moment
    // its x-behavior="pre" was dropped for the tag alone.
    const queueInjection = (element, name, now) => {
      const eagerHere = now || element.hasAttribute('x-eager');
      injections.push(eagerHere ? WB.inject(element, name) : WB.lazyInject(element, name));
    };

    elements.forEach(element => {
      warnXBehaviorDeprecated(element); // #1642: still runs, but says so
      const behaviorList = element.getAttribute('x-behavior').split(/\s+/).filter(Boolean);
      behaviorList.forEach(name => queueInjection(element, name, eager));
    });

    // Custom elements scan (always active)
    customElementMappings.forEach(({ selector, behavior }) => {
      // querySelectorAll() excludes root itself. Include it when callers scan
      // one custom element directly (as the playground does for its theme
      // control), otherwise the registration silently never runs.
      const customElements = matchingElements(root, selector);
      customElements.forEach(element => queueInjection(element, behavior, eager));
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
          // A card's own landmark is not the page's (component-landmark.js).
          if (isComponentLandmark(element)) return;
          // #923: and skip when an explicit x-* attribute REPLACES this
          // behavior. This inline copy never had the check, which is why
          // <article x-cardimage> still rendered twice after the guard was
          // fixed in getAutoInjectBehaviors() above -- the rule has to hold on
          // every injection path, not just the tidiest one.
          if (isReplacedByExplicitBehavior(element, behavior)) return;
          // Skip if x-behavior is present (already handled)
          if (!element.hasAttribute('x-behavior')) queueInjection(element, behavior, eager);
        });
      });
    }

    // Wait for every injection this scan started: eager ones to finish, and
    // lazy ones until the observer has reported on them (built if in view,
    // deferred if not -- #962).
    await Promise.all(injections);

    reportUnknownBehaviorAttributes(root);

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

    // One mutation record, handled exactly as the observer used to handle it
    // inline.
    const handleMutation = (mutation) => {
      // Handle added nodes
      for (const node of mutation.addedNodes) {
        // Handled a task later now: a node removed again meanwhile is not
        // enhanced (re-inserting it queues a fresh record).
        if (node.nodeType === Node.ELEMENT_NODE && node.isConnected) {
          // Check if node itself has x-behavior
          if (node.hasAttribute('x-behavior')) {
            warnXBehaviorDeprecated(node); // #1642
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
              warnXBehaviorDeprecated(el); // #1642
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
                // Same x-ignore opt-out as the scan path and
                // getAutoInjectBehaviors(). This third copy never had it, so a
                // content <header x-ignore> inside any node added after load
                // (every SPA page fragment) still got header() and .x-header.
                if (el.hasAttribute('x-ignore')) return;
                // Same landmark rule as the scan path (component-landmark.js).
                if (isComponentLandmark(el)) return;
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
        warnXBehaviorDeprecated(element); // #1642
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
    };

    // #961: this used to run inside the MutationObserver callback itself. A
    // callback is a microtask delivered after EVERY behavior that touched the
    // DOM, and each delivery queried ~30 selectors per added node and read
    // getComputedStyle() (lazyWatchTarget) on a document the previous behavior
    // had just dirtied, forcing a full style recalc each time -- all inside the
    // one long task the injections already formed. Records are now queued and
    // handled in a later task, in budgeted slices, so one style recalc serves a
    // whole batch. The batch is counted as work (track) from the moment it is
    // queued, so settled()/whenIdle() still cannot resolve between a node's
    // insertion and its lazyInject().
    let queued = [];
    const drain = async () => {
      await nextSlice();
      while (queued.length) {
        const batch = queued;
        queued = [];
        for (let i = 0; i < batch.length; i++) {
          if (sliceOverBudget()) {
            queued = batch.slice(i).concat(queued);
            await nextSlice();
            break;
          }
          handleMutation(batch[i]);
        }
      }
    };
    let draining = null;
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) queued.push(mutation);
      if (draining) return;
      draining = drain().finally(() => { draining = null; });
      injectionTracker.track('observe (queued mutations)', draining);
    });

    return startObserving(WB, observer, root, ['x-behavior']);
  },

  /**
   * Stop observing DOM changes
   */
  disconnect() {
    stopObserving(WB);
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
    // autoInject has no default — see the setConfig() call below for why.
    const { shouldScan, shouldObserve, theme, debug, autoInject } = commonInitOptions(options);
    const {
      preload = [], // Array of behavior names to preload
      onSettled = null, // #962: called once the first build has finished
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
    // The scan and observer start themselves live in runtime-shared.js.
    await bootDocument(WB, shouldScan, shouldObserve);

    console.log(`✅ WB v${WB.version} initialized (lazy loading enabled)`);
    
    if (debug) {
      Events.log('info', 'WB', 'Initialized', options);
    }

    // #962 -- John: "wb.init(cb => callback(cb)) requires no timing". Called
    // once the first build has finished, never on a timer. A failure to settle
    // is reported, not swallowed: nothing dies silently.
    if (typeof onSettled === 'function') {
      WB.settled(onSettled).catch((err) => console.error('[WB] init onSettled:', err && err.message));
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
    // If we didn't find a custom tag, or if there are extra behaviors, each one
    // gets its own x-{name} attribute. Never x-behavior="a b": that spelling is
    // deprecated (#1642).
    const behaviors = data.behaviors || [];
    if (data.b && !isCustomTag) {
      behaviors.push(data.b);
    }
    behaviors.forEach(name => el.setAttribute(`x-${name}`, ''));

    // 5. Apply ID and Classes
    if (data.id) el.id = data.id;
    if (data.classes) el.className = data.classes;
    // A style object in builder data becomes a generated rule, not the
    // element's style attribute (#779).
    if (data.style) setRule(el, 'data-style', data.style);

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

installReadiness(WB, injectionTracker, settledCall);


/**
 * An x-* attribute that names nothing is the one failure this system had no
 * voice for.
 *
 * scan() resolves behaviours by SELECTOR: [x-behavior], the custom-element
 * mappings, then the auto-inject mappings. An attribute in none of them matches
 * no selector, so no code path is entered for it -- no injection, no throw, no
 * x-error, nothing in the console. Typo `x-carfile` for `x-cardfile`, or keep
 * using a behaviour 4.0.0 removed, and the element stays blank for ever while
 * the page reports success.
 *
 * Verified before writing this: in ONE eager scan, `x-cardfile` decorated
 * correctly (📄) while `x-totallyfakebehavior` produced no decoration, no
 * x-error attribute, and no console output at all.
 *
 * John: "No failure should fail silently."
 *
 * Reported through Events.error so it lands in the Error Log page with every
 * other failure, and marked on the element so it is visible in the DOM too.
 * Reported once per attribute per element -- a MutationObserver re-scan must
 * not turn one typo into a stream.
 */

/**
 * x- attributes that are control flags, not behaviours. Flagging these would
 * make the check fire on correct markup, and a check that cries wolf is one
 * people learn to ignore.
 */
const NON_BEHAVIOR_X_ATTRIBUTES = new Set([
  'x-behavior',   // names behaviours explicitly; resolved above
  'x-eager',      // scheduling hint
  'x-ignore',     // opt out of auto-injection
  'x-error',      // set BY the injector when a behaviour throws
  'x-ready',      // completion signal
  'x-schema',     // marks schema-built elements
  'x-unknown-behavior', // set by this reporter
  // STATE MARKERS written by behaviours onto their own host once applied. They
  // are output, not input, so an element carrying one is working correctly.
  //
  // These were missed because the first list was built by grepping src/core/
  // ONLY -- and markers are set by the BEHAVIOURS, in src/wb-viewmodels/. The
  // check then reported x-hydrated on the behaviors page: a false positive on
  // correct markup, which is the one thing that makes a check worth ignoring.
  // The full list comes from grepping setAttribute('x-*') across all of src/.
  'x-hydrated',
  // Written by teachByExample onto an element it filled in. Same mistake as
  // x-hydrated, made again the same day: a new marker added without adding it
  // here, so the reporter flagged output it had produced itself.
  'x-docs',
  'x-teaching-example',
]);

/**
 * `<behaviour>-init` markers — x-autosize-init, x-datepicker-init, x-diff-init.
 * Three exist and the naming is a convention, so match the shape rather than
 * chase each new one into the list above.
 */
const STATE_MARKER_SUFFIX = /-init$/;

/**
 * Every attribute that DOES name a behaviour.
 *
 * Both maps, never one: WB_LAZY_ONLY_ATTRIBUTES holds 39 behaviours that appear
 * nowhere in tag-map, so checking extensionMap alone would report x-breadcrumb,
 * x-notify, x-copybutton and every animation effect as unknown -- the exact
 * incomplete-registry mistake #1056 fixed on the behaviours page.
 */
function knownBehaviorAttributes() {
  return new Set([
    ...Object.keys(extensionMap || {}),
    ...Object.keys(WB_LAZY_ONLY_ATTRIBUTES || {}),
    // THE THIRD REGISTRY, and the one that actually decides existence.
    //
    // A behaviour may wire its own helper attributes: move.js:242 does
    // `wire('x-moveright', moveright)` for all six directions, and those names
    // are in behaviorModules (index.js:250 -- moveright: 'move') without ever
    // appearing in either selector map. So the reporter called x-moveright and
    // x-moveleft unknown on the behaviours page -- 9 errors in data/errors.json,
    // which failed compliance/error-log-empty.spec.ts and dark-mode.spec.ts.
    //
    // That is the incomplete-registry mistake this function's own comment warns
    // about, made one map short of the warning. behaviorModules is what
    // getBehavior() consults before throwing "Unknown behavior", so it is the
    // registry whose answer matters; read it rather than list its members here
    // (#831 is the work of collapsing all of them into one).
    ...Object.keys(behaviorModules || {}).map((name) => `x-${name}`),
  ]);
}

const reportedUnknown = new WeakMap();

function reportUnknownBehaviorAttributes(root) {
  let scope;
  try {
    scope = matchingElements(root, '*');
  } catch {
    return;   // never let the reporter break the scan it reports on
  }

  const known = knownBehaviorAttributes();

  for (const element of scope) {
    if (!element.attributes) { continue; }

    for (const attr of Array.from(element.attributes)) {
      const name = attr.name;
      if (!name.startsWith('x-')) { continue; }
      // A BARE `x-` NAMES NOTHING, so it is not a misspelling of anything.
      // demos/intellisense-check.html:26 is `<div x-tabs x->` on purpose — that
      // is the page where you type the prefix to see what IntelliSense offers.
      // Reporting it made the reporter fire on deliberately correct markup,
      // which is the one thing that teaches people to ignore a check.
      if (name === 'x-') { continue; }
      if (NON_BEHAVIOR_X_ATTRIBUTES.has(name)) { continue; }
      if (STATE_MARKER_SUFFIX.test(name)) { continue; }
      if (known.has(name)) { continue; }

      let seen = reportedUnknown.get(element);
      if (!seen) { seen = new Set(); reportedUnknown.set(element, seen); }
      if (seen.has(name)) { continue; }
      seen.add(name);

      element.setAttribute('x-unknown-behavior', name);

      Events.error(
        `WB: unknown behavior "${name}"`,
        new Error(
          `<${element.tagName.toLowerCase()}> carries ${name}, which matches no behavior — ` +
          `nothing will be applied. Check the spelling, or whether the behavior was removed.`
        ),
        { element: element.tagName, id: element.id, attribute: name },
      );
    }
  }
}



// Global export
if (typeof window !== 'undefined') {
  if (window.WB) {
    // NOT Object.assign: it READS a getter and copies the value, so
    // `pendingCount` would land on the global as a frozen number captured at
    // load time — a readiness signal permanently stuck at 0, which is worse
    // than not having one (#961/#962). Copying descriptors keeps it live.
    Object.defineProperties(window.WB, Object.getOwnPropertyDescriptors(WB));
  } else {
    window.WB = WB;
  }
}

export { WB };
export default WB;
