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
import { Theme } from './theme.js';
import { getConfig, setConfig } from './config.js';
import { elementMap, nativeMap, extensionMap } from './tag-map.js';
import { semanticPropertyMappings } from './semantic-attributes.js';
import { ensureBehaviorCss } from './style-loader.js';
import { makeDlog, traceStatusLabel } from './debug-trace.js';

// Debug logging — silent unless localStorage['wb-debug'] names a category
// (or is '1' for everything). Was forced true|| for a while; reverted per
// "filter out all tracing except the blank video get and subsequent paint"
// (see wb.js's matching comment). #338 generalized the flag into a
// selectable category filter (see debug-trace.js) — this runtime has no
// dlog(category, ...) call sites of its own today, but shares the same
// mechanism so one added here later doesn't need its own bespoke parsing.
const dlog = makeDlog();
// Always announce the tracing state — first thing in the console, every
// load, regardless of whether it's on or off.
console.log(`[WB-lazy] debug tracing: ${traceStatusLabel()} (localStorage.setItem('wb-debug', '1') for everything, or a comma-separated category list, then reload)`);

// #333: this table used to hand-duplicate tag-map.js's elementMap/nativeMap/
// extensionMap (wb.js's own single source of truth) and had drifted --
// e.g. this file was missing header/footer (present in nativeMap) while
// tag-map.js was missing every legacy card-*/noun-first alias this file
// still needs to serve older standalone demo pages. Now built by spreading
// the shared tag-map.js tables first, with only the genuinely
// runtime-specific entries layered on top explicitly -- so anything added to
// tag-map.js going forward is picked up here automatically instead of
// silently working on only one runtime.

// Two wb-* tags where tag-map.js's elementMap disagrees with what this
// runtime has always shipped live (wb-drawer -> drawer there vs
// -> drawerLayout here; wb-modal -> dialog there vs -> modal here). Kept as
// this runtime's existing values rather than silently adopting tag-map.js's
// -- changing live dispatch for either tag needs its own investigation into
// which value is actually correct (tracked in #333).
const ELEMENT_MAP_OVERRIDES = new Set(['wb-drawer', 'wb-modal']);

// wb-grid is still a REAL custom element (wb-grid.js, eagerly imported by
// wb.js) whose own connectedCallback calls the layout function directly.
// wb-lazy.js has no such registration (only wb-card.js, separately, for
// <wb-card>), so it needs dispatching as an ordinary injected behavior here.
// wb-cluster/wb-stack/wb-row/wb-accordion USED to be real custom elements
// too, but those `extends HTMLElement` wrappers were removed (#279) in favor
// of tag-map.js's elementMap (cluster/stack/flex/accordion) -- now picked up
// automatically via the elementMap spread above, no longer needed here.
// The rest of this table covers the legacy card-*/noun-first tag aliases and
// a few tags tag-map.js genuinely doesn't know about at all (wb-inputgroup,
// wb-formrow, wb-stat, wb-code-card) -- none of these are duplicated anywhere
// else.
const WB_LAZY_ONLY_ELEMENTS = {
  'card-basic': 'card',
  'wb-inputgroup': 'inputgroup',
  'wb-formrow': 'formrow',
  'card-image': 'cardimage',
  'card-video': 'cardvideo',
  'card-profile': 'cardprofile',
  'card-pricing': 'cardpricing',
  'card-product': 'cardproduct',
  'card-stats': 'cardstats',
  'card-testimonial': 'cardtestimonial',
  'card-hero': 'cardhero',
  'card-file': 'cardfile',
  'card-notification': 'cardnotification',
  'card-portfolio': 'cardportfolio',
  'card-link': 'cardlink',
  'card-horizontal': 'cardhorizontal',
  'card-overlay': 'cardoverlay',
  'card-button': 'cardbutton',
  'card-expandable': 'cardexpandable',
  'card-minimizable': 'cardminimizable',
  'card-draggable': 'carddraggable',
  'profile-card': 'cardprofile',
  'hero-card': 'cardhero',
  'stats-card': 'cardstats',
  'testimonial-card': 'cardtestimonial',
  'video-card': 'cardvideo',
  'file-card': 'cardfile',
  'notification-card': 'cardnotification',
  'basic-card': 'card',
  'image-card': 'cardimage',
  'overlay-card': 'cardoverlay',
  'portfolio-card': 'cardportfolio',
  'link-card': 'cardlink',
  'horizontal-card': 'cardhorizontal',
  'wb-code-card': 'demo',
  'wb-grid': 'grid',
  'wb-flex': 'flex',
  'wb-container': 'container',
  'wb-sidebar': 'sidebarlayout',
  'wb-center': 'center',
  'wb-cover': 'cover',
  'wb-masonry': 'masonry',
  'wb-switcher': 'switcher',
  'wb-reel': 'reel',
  'wb-frame': 'frame',
  'wb-drawer': 'drawerLayout', // conflicts with elementMap's 'drawer' -- see ELEMENT_MAP_OVERRIDES above
  'wb-icon': 'icon',
  'wb-control': 'control',
  'wb-repeater': 'repeater',
  'wb-modal': 'modal', // conflicts with elementMap's 'dialog' -- see ELEMENT_MAP_OVERRIDES above
  'wb-stat': 'stat',
};

// Extension attributes tag-map.js's extensionMap doesn't cover. wb.js doesn't
// need an equivalent list at all for these -- it resolves x-{name} shorthand
// attributes dynamically from the behaviors registry itself
// (Object.keys(behaviors) in scan()/observe()), not from a hardcoded
// selector table. This runtime's dispatch (getAutoInjectBehaviors(), below)
// is selector-table-driven, so it still needs these listed explicitly.
// Porting wb.js's dynamic approach here would remove the need for this list
// entirely -- a larger follow-up, not done as part of this consolidation.
const WB_LAZY_ONLY_ATTRIBUTES = {
  'x-breadcrumb': 'breadcrumb',
  'x-toast': 'toast',
  'x-notify': 'notify',
  'x-typewriter': 'typewriter',
  'x-bounce': 'bounce',
  'x-pulse': 'pulse',
  'x-rainbow': 'rainbow',
  'x-copy': 'copy',
  'x-collapse': 'collapse',
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
  'x-form': 'form',
  'x-password': 'password',
  'x-tags': 'tags',
  'x-file': 'file',
  'x-masked': 'masked',
  'x-stepper': 'stepper',
  'x-counter': 'counter',
  'x-autocomplete': 'autocomplete',
  'x-otp': 'otp',
  'x-colorpicker': 'colorpicker',
  'x-search': 'search',
  'x-floatinglabel': 'floatinglabel',
  'x-label': 'label', // x-label="text" on any form control (input, select, ...) — see src/wb-viewmodels/label.js
  'x-clock': 'clock',
  'x-countdown': 'countdown',
  'x-youtube': 'youtube',
  'x-pagination': 'pagination',
  'x-steps': 'steps',
  'x-timeline': 'timeline',
  'x-kbd': 'kbd',
  'x-gallery': 'gallery',
  'x-image': 'image',
  'x-popover': 'popover',
  'x-confirm': 'confirm',
  'x-prompt': 'prompt',
  // drawer() (overlay.js) — a slide-out panel + backdrop triggered by a plain
  // click. x-drawer-layout (below) maps to a DIFFERENT behavior
  // (drawerLayout, a page-shell layout primitive) — easy to conflate, but
  // not the same thing.
  'x-drawer': 'drawer',
  'x-lightbox': 'lightbox',
  'x-share': 'share',
  'x-print': 'print',
  'x-fullscreen': 'fullscreen',
  'x-truncate': 'truncate',
  'x-masonry': 'masonry',
  'x-dropdown': 'dropdown',
  'x-toggle': 'toggle',
  'x-drawer-layout': 'drawerLayout',
  'x-autosize': 'autosize',
};

// Auto-injection mappings
const customElementMappings = [
  ...Object.entries(elementMap)
    .filter(([selector]) => !ELEMENT_MAP_OVERRIDES.has(selector))
    .map(([selector, behavior]) => ({ selector, behavior })),
  ...Object.entries(extensionMap)
    .filter(([attr]) => !attr.startsWith('x-as-')) // morphing -- not supported by this runtime's dispatch
    .map(([attr, behavior]) => ({ selector: `[${attr}]`, behavior })),
  ...Object.entries(WB_LAZY_ONLY_ELEMENTS).map(([selector, behavior]) => ({ selector, behavior })),
  ...Object.entries(WB_LAZY_ONLY_ATTRIBUTES).map(([attr, behavior]) => ({ selector: `[${attr}]`, behavior })),
  // Semantic property attributes (tooltip=, badge=, ripple, toast-message=)
  // -- shared with wb.js via semantic-attributes.js so both engines support
  // the same vocabulary (#354).
  ...semanticPropertyMappings,
  // button-tooltip gets BOTH behaviors -- intentional dual-behavior element,
  // not a duplicate-entry bug.
  { selector: 'button-tooltip', behavior: 'tooltip' },
  { selector: 'button-tooltip', behavior: 'toast' },
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

  const prefix = getConfig('prefix') || 'x';
  const prefixAttr = `${prefix}-`;
  for (const { selector, behavior } of autoInjectMappings) {
    if (!element.matches(selector)) continue;
    // A DIFFERENT explicit x-{behavior} attribute already opts this
    // element into a richer, deliberate behavior -- e.g. <input type="text"
    // x-password> should only get password()'s show/hide-toggle wrapper,
    // never ALSO the generic native-auto-inject input() wrapper racing to
    // wrap the same element a second time (see wb.js's
    // getAutoInjectBehavior() for the full rationale/incident).
    let overridden = false;
    for (const attr of element.attributes) {
      if (!attr.name.startsWith(prefixAttr)) continue;
      const other = attr.name.slice(prefixAttr.length);
      if (other !== behavior && hasBehavior(other)) { overridden = true; break; }
    }
    if (!overridden) behaviors.push(behavior);
  }
  return behaviors;
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
    }, { rootMargin: '200px' });
  }
  return lazyObserver;
}

/**
 * WB - Web Behavior Core
 */
const WB = {
  version: '2.1.0',
  
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
  *       WB.inject('#myElem', 'card', { url: 'https://example.com/wb-card.js' });
  *       // WBCard can inject into elements like <wb-card>, <card-basic>, <wb-cardimage>, <wb-cardvideo>, etc.
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
      Events.error(`WB: ${behaviorName}`, error, {
        element: element.tagName,
        id: element.id,
        behavior: behaviorName
      });
      
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
    const elements = root.querySelectorAll('[x-behavior]');
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
      const customElements = root.querySelectorAll(selector);
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
        const autoElements = root.querySelectorAll(selector);
        autoElements.forEach(element => {
          if (!getConfig('autoInject') && !element.hasAttribute('variant')) return;
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
      preload = [] // Array of behavior names to preload
    } = options;

    // Set debug mode
    if (debug) {
      setConfig('debug', true);
      setConfig('logLevel', 'debug');
    }

    // Set autoInject — unconditional (see wb.js's init() for why: only ever
    // setting it to `true` left config.js's `true` module default in effect
    // for any caller passing `autoInject: false` or omitting it).
    setConfig('autoInject', autoInject);

    // Set theme
    if (theme) {
      Theme.set(theme);
    }

    // Preload critical behaviors
    if (preload.length > 0) {
      await preloadBehaviors(preload);
    }

    // Scan existing elements
    if (shouldScan && typeof document !== 'undefined') {
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
