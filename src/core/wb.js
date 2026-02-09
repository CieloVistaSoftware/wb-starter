// Ensure WB is declared on window for type safety (for TS/IDE, no-op at runtime)
// @ts-ignore
if (typeof window !== 'undefined' && typeof window.WB === 'undefined') {
  /** @type {any} */ (window).WB = undefined;
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

// Register Layout Custom Elements
import '../wb-viewmodels/wb-grid.js';
import '../wb-viewmodels/wb-cluster.js';
import '../wb-viewmodels/wb-stack.js';
import '../wb-viewmodels/wb-row.js';
import '../wb-viewmodels/wb-column.js';

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

// Auto-injection mappings
const autoInjectMappings = [
  // Form Elements
  { selector: 'input[type="checkbox"]', behavior: 'checkbox' },
  { selector: 'input[type="radio"]', behavior: 'radio' },
  { selector: 'input[type="range"]', behavior: 'range' },
  { selector: 'select', behavior: 'select' },
  { selector: 'textarea', behavior: 'textarea' },
  { selector: 'button', behavior: 'button' },
  { selector: 'form', behavior: 'form' },
  { selector: 'fieldset', behavior: 'fieldset' },
  { selector: 'label', behavior: 'label' },
  
  // Media
  { selector: 'img', behavior: 'image' },
  { selector: 'video', behavior: 'video' },
  { selector: 'audio', behavior: 'audio' },
  
  // Semantic Text
  { selector: 'code', behavior: 'code' },
  { selector: 'pre', behavior: 'pre' },
  { selector: 'kbd', behavior: 'kbd' },
  { selector: 'mark', behavior: 'mark' },
  
  // Structure
  { selector: 'table', behavior: 'table' },
  { selector: 'details', behavior: 'details' },
  { selector: 'dialog', behavior: 'dialog' },
  { selector: 'progress', behavior: 'progress' },
  { selector: 'header', behavior: 'header' },
  { selector: 'footer', behavior: 'footer' }
];

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
 * @param {HTMLElement} element 
 * @returns {string|null} Behavior name or null
 */
function getAutoInjectBehavior(element) {
  if (!getConfig('autoInject')) return null;
  // Skip if explicitly ignored
  if (element.hasAttribute('x-ignore')) return null;
  
  // Note: We do NOT skip if other behaviors are present.
  // Auto-injection is additive unless explicitly ignored.
  // The inject() function handles duplicate prevention.

  let candidate = null;
  for (const { selector, behavior } of autoInjectMappings) {
    if (element.matches(selector)) {
      candidate = behavior;
      break;
    }
  }
  
  if (!candidate) return null;

  // Check if candidate is already explicitly applied
  // We don't need to check here because inject() handles duplicates.
  // But we might want to avoid the call if we know it's there.
  const prefix = getConfig('prefix') || 'x';
  if (element.hasAttribute(`${prefix}-${candidate}`)) return null;
  if (element.hasAttribute(candidate) && !RESERVED_ATTRIBUTES.has(candidate)) return null;
  if (element.hasAttribute(`data-wb-${candidate}`)) return null;

  return candidate;
}

// Track applied behaviors for cleanup
const applied = new WeakMap();
// Track pending injections to prevent re-entry
const pending = new WeakMap();
// Track schema-processed elements
const schemaProcessed = new WeakSet();

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
      element.dataset.wbError = 'true';
      
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
    
    // Get schema name from tag or data-wb
    const name = schemaName || WB._detectSchemaName(element);
    if (!name) return;
    
    // Check if schema exists
    let schema = SchemaBuilder.getSchema(name);
    if (!schema) {
      console.warn(`[WB] Schema for "${name}" not registered yet — attempting on-demand fetch`);
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
      SchemaBuilder.processElement(element, name);
      schemaProcessed.add(element);
      element.dataset.wbSchema = name;
    } catch (err) {
      console.error('[WB] processSchema failed for', name, err && err.message);
    }
  }
  },
  
  /**
   * Detect schema name from element
   * @private
   */
  _detectSchemaName(element) {
    const tagName = element.tagName.toLowerCase();
    
    // <wb-card> → card
    if (tagName.startsWith('wb-')) {
      return tagName.replace('wb-', '').replace(/-/g, '');
    }
    
    // → ERROR (Strict Mode)
    if (element.hasAttribute('x-behavior')) {
      // Schema detection handled by scanner/observer error logging
      return null;
    }
    
    return null;
  },

  /**
   * Scan DOM for elements with data-wb and inject behaviors
   * @param {HTMLElement} root - Root element to scan (default: document.body)
   * @returns {Promise<void>}
   */
  async scan(root = document.body) {
    const promises = [];
    const behaviorNames = Object.keys(behaviors);
    const knownBehaviors = new Set(behaviorNames);
    const prefix = getConfig('prefix') || 'x'; // Default to x-
    const useSchemas = getConfig('useSchemas');

    // v3.0: Process wb-* custom element tags through schema builder first
    if (useSchemas) {
      // Collect promises so we can await schema-built elements before continuing
      const schemaPromises = [];
      root.querySelectorAll('*').forEach(el => {
        const htmlEl = /** @type {HTMLElement} */ (el);
        const tag = htmlEl.tagName.toLowerCase();
        if (tag.startsWith('wb-') && tag !== 'wb-view') {
          // WB.processSchema is async-capable; collect the promise and allow it to load schemas on-demand
          try {
            const p = WB.processSchema(htmlEl, /*blocking*/ true);
            if (p && typeof p.then === 'function') schemaPromises.push(p);
          } catch (err) {
            console.warn('[WB] processSchema threw:', err && err.message);
          }
        }
      });

      // Await processing of schema-built elements to make injection deterministic
      if (schemaPromises.length) {
        await Promise.all(schemaPromises);
      }
    }

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
        element.setAttribute('data-wb-error', 'legacy');
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
            // Pass the attribute value as config if present
            const options = attr.value ? { config: attr.value } : {};
            promises.push(WB.inject(htmlEl, behaviorName, options));
          }
        });
      });
    }

    // Auto-inject scan
    if (getConfig('autoInject')) {
      autoInjectMappings.forEach(({ selector, behavior }) => {
        const autoElements = root.querySelectorAll(selector);
        autoElements.forEach(element => {
          const htmlEl = /** @type {HTMLElement} */ (element);
          // Only skip if explicitly ignored
          if (!htmlEl.hasAttribute('x-ignore')) {
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
   * Watch for new elements with data-wb (MutationObserver)
   * @param {HTMLElement} root - Root element to observe (default: document.body)
   * @returns {MutationObserver} The observer instance
   */
  observe(root = document.body) {
    // Disconnect existing observer if present to prevent duplicates
    if (WB._observer) {
      WB._observer.disconnect();
    }

    const behaviorNames = Object.keys(behaviors);
    const knownBehaviors = new Set(behaviorNames);
    const prefix = getConfig('prefix') || 'x'; // Default to x-
    const useSchemas = getConfig('useSchemas');
    
    // Build attribute filter list
    const attributeFilter = ['x-behavior'];
    behaviorNames.forEach(name => {
      attributeFilter.push(`${prefix}-${name}`);
      attributeFilter.push(`${prefix}-as-${name}`);
    });

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        // Handle added nodes
        for (const node of mutation.addedNodes) {
          // Skip non-element nodes
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          
          // Cast to HTMLElement after type check
          const el = /** @type {HTMLElement} */ (node);
          const tag = el.tagName.toLowerCase();
            
          // v3.0: Process wb-* tags through schema builder
          if (useSchemas && tag.startsWith('wb-') && tag !== 'wb-view') {
            WB.processSchema(el);
          }
            
          // 1. Check node itself
          // Legacy data-wb check
          if (el.dataset?.wb) {
            const val = el.dataset.wb;
            const name = val.split(/\s+/)[0];
            console.error(`[WB] Legacy syntax detected:. Use <wb-${name}>.`);
            // Do not process
          }
            
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
            
          // Legacy data-wb check (descendants)
          // Note: data-wb is deprecated - use wb-* custom elements or x-* attributes
          el.querySelectorAll('[data-wb]').forEach(descendant => {
            const descEl = /** @type {HTMLElement} */ (descendant);
            const val = descEl.dataset.wb || '';
            const name = val.split(/\s+/)[0] || 'unknown';
            console.error(`[WB] Legacy syntax detected:. Use <wb-${name}>.`);
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

          // Auto-inject descendants
          if (getConfig('autoInject')) {
            autoInjectMappings.forEach(({ selector, behavior }) => {
              el.querySelectorAll(selector).forEach(descendant => {
                const descEl = /** @type {HTMLElement} */ (descendant);
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
            // ... existing data-wb logic ...
            const behaviorList = element.dataset.wb?.split(/\s+/).filter(Boolean) || [];
            const current = applied.get(element) || [];
            current.forEach(({ name, cleanup }) => {
              if (!behaviorList.includes(name)) {
                // Only remove if not also present as shorthand
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
                // Attribute removed - check if it's still in data-wb
                const list = element.dataset.wb?.split(/\s+/).filter(Boolean) || [];
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
      schemaPath = '/src/wb-models' // Path to schema files
    } = options;

    // Set debug mode
    if (debug) {
      setConfig('debug', true);
      setConfig('logLevel', 'debug');
    }

    // Set autoInject
    if (autoInject) {
      setConfig('autoInject', true);
    }

    // Set prefix
    setConfig('prefix', prefix);
    
    // v3.0: Set schema options
    setConfig('useSchemas', useSchemas);
    setConfig('schemaPath', schemaPath);

    // Set theme
    if (theme) {
      Theme.set(theme);
    }

    // v3.0: Initialize Schema Builder
    if (useSchemas) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('  WB Behaviors v3.0 - MVVM Architecture');
      console.log('═══════════════════════════════════════════════════════');
      
      try {
        await SchemaBuilder.loadSchemas(schemaPath);
        console.log(`[WB] Schema Builder loaded ${SchemaBuilder.registry.size} schemas`);
      } catch (error) {
        console.warn('[WB] Failed to load schemas:', error);
        // Continue without schemas - behaviors still work
      }
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
    
    // v3.0: Start schema observer if using schemas
    if (useSchemas) {
      SchemaBuilder.startObserver();
    }

    console.log(`✅ WB (Web Behavior) v${WB.version} initialized`);
    
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
