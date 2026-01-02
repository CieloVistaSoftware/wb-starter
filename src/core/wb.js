/**
 * WB - Web Behavior
 * =================
 * Pure JavaScript behavior injection library.
 * No web components. No classes. Just functions that enhance HTML.
 * 
 * @version 2.1.2
 * @license MIT
 * 
 * Usage:
 *   <div data-wb="card" data-title="Hello">Content</div>
 *   <script type="module">
 *     import WB from './wb.js';
 *     WB.init();
 *   </script>
 */

import { behaviors } from '../behaviors/index.js';
import { Events } from './events.js';
import { Theme } from './theme.js';
import { getConfig, setConfig } from './config.js';
import { pubsub } from './pubsub.js';

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
  { selector: 'nav', behavior: 'navbar' },
  { selector: 'aside', behavior: 'sidebar' },
  { selector: 'header', behavior: 'header' },
  { selector: 'footer', behavior: 'footer' },
  { selector: 'article[data-href]', behavior: 'cardlink' },
  
  // Cards
  { selector: 'article', behavior: 'card' }
];

/**
 * Get implicit behavior for an element based on its type
 * @param {HTMLElement} element 
 * @returns {string|null} Behavior name or null
 */
function getAutoInjectBehavior(element) {
  if (!getConfig('autoInject')) return null;
  // Skip if data-wb is already present (explicit overrides implicit)
  if (element.hasAttribute('data-wb')) return null;
  // Skip if explicitly ignored
  if (element.hasAttribute('data-wb-ignore')) return null;
  
  for (const { selector, behavior } of autoInjectMappings) {
    if (element.matches(selector)) {
      return behavior;
    }
  }
  return null;
}

// Track applied behaviors for cleanup
const applied = new WeakMap();
// Track pending injections to prevent re-entry
const pending = new WeakMap();

/**
 * WB - Web Behavior Core
 */
const WB = {
  version: '2.1.2',
  behaviors,
  pubsub,

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
      element = document.querySelector(element);
    }

    if (!element || !(element instanceof HTMLElement)) {
      console.warn(`[WB] Invalid element for behavior: ${behaviorName}`);
      return null;
    }

    // Check if behavior exists
    // Note: With lazy loading, we might not know if it exists until we try to load it
    // But behaviors proxy handles 'has' check
    if (!behaviors[behaviorName]) {
      console.warn(`[WB] Unknown behavior: ${behaviorName}`);
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
      // Await the behavior execution (it might be async due to lazy loading)
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
   * Scan DOM for elements with data-wb and inject behaviors
   * @param {HTMLElement} root - Root element to scan (default: document.body)
   * @returns {Promise<void>}
   */
  async scan(root = document.body) {
    const elements = root.querySelectorAll('[data-wb]');
    const promises = [];

    elements.forEach(element => {
      const behaviorList = element.dataset.wb.split(/\s+/).filter(Boolean);

      behaviorList.forEach(name => {
        promises.push(WB.inject(element, name));
      });
    });

    // Auto-inject scan
    if (getConfig('autoInject')) {
      autoInjectMappings.forEach(({ selector, behavior }) => {
        const autoElements = root.querySelectorAll(selector);
        autoElements.forEach(element => {
          // Skip if data-wb is present (already handled) or ignored
          if (!element.hasAttribute('data-wb') && !element.hasAttribute('data-wb-ignore')) {
            promises.push(WB.inject(element, behavior));
          }
        });
      });
    }

    await Promise.all(promises);

    pubsub.publish('wb:scan', { count: elements.length });

    // Log only in debug mode
    if (getConfig('debug')) {
      Events.log('info', 'WB', `Scanned: ${elements.length} elements`);
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

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        // Handle added nodes
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if node itself has data-wb
            if (node.dataset?.wb) {
              const behaviorList = node.dataset.wb.split(/\s+/).filter(Boolean);
              behaviorList.forEach(name => WB.inject(node, name));
            } else {
              // Check auto-inject for the node itself
              const autoBehavior = getAutoInjectBehavior(node);
              if (autoBehavior) {
                WB.inject(node, autoBehavior);
              }
            }

            // Check descendants
            node.querySelectorAll?.('[data-wb]').forEach(el => {
              const behaviorList = el.dataset.wb.split(/\s+/).filter(Boolean);
              behaviorList.forEach(name => WB.inject(el, name));
            });

            // Check descendants for auto-inject
            if (getConfig('autoInject')) {
              autoInjectMappings.forEach(({ selector, behavior }) => {
                node.querySelectorAll?.(selector).forEach(el => {
                  if (!el.hasAttribute('data-wb') && !el.hasAttribute('data-wb-ignore')) {
                    WB.inject(el, behavior);
                  }
                });
              });
            }
          }
        }

        // Handle attribute changes on data-wb
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-wb') {
          const element = mutation.target;
          const behaviorList = element.dataset.wb?.split(/\s+/).filter(Boolean) || [];
          
          // Remove behaviors no longer in list
          const current = applied.get(element) || [];
          current.forEach(({ name, cleanup }) => {
            if (!behaviorList.includes(name)) {
              if (typeof cleanup === 'function') cleanup();
            }
          });

          // Add new behaviors
          behaviorList.forEach(name => WB.inject(element, name));
        }
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-wb']
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
  init(options = {}) {
    const {
      scan: shouldScan = true,
      observe: shouldObserve = true,
      theme = null,
      debug = false,
      autoInject = false // Default to false unless specified
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

    // Set theme
    if (theme) {
      Theme.set(theme);
    }

    // Scan existing elements
    if (shouldScan && typeof document !== 'undefined') {
      // Wait for DOM ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => WB.scan());
      } else {
        WB.scan();
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
  window.WB = WB;
}

export { WB };
export default WB;
