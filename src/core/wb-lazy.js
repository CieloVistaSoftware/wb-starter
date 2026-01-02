/**
 * WB - Web Behavior (Lazy Loading Version)
 * =========================================
 * Pure JavaScript behavior injection library.
 * Behaviors are loaded on-demand when first used.
 * 
 * @version 2.1.0
 * @license MIT
 */

import { getBehavior, hasBehavior, listBehaviors, preloadBehaviors, getCacheStats, behaviorModules } from '../behaviors/index.js';
import { Events } from './events.js';
import { Theme } from './theme.js';
import { getConfig, setConfig } from './config.js';

// Auto-injection mappings
const customElementMappings = [
  { selector: 'price-card', behavior: 'cardpricing' },
  { selector: 'product-card', behavior: 'cardproduct' },
  { selector: 'profile-card', behavior: 'cardprofile' },
  { selector: 'hero-card', behavior: 'cardhero' },
  { selector: 'stats-card', behavior: 'cardstats' },
  { selector: 'testimonial-card', behavior: 'cardtestimonial' },
  { selector: 'video-card', behavior: 'cardvideo' },
  { selector: 'file-card', behavior: 'cardfile' },
  { selector: 'notification-card', behavior: 'cardnotification' },
  { selector: 'portfolio-card', behavior: 'cardportfolio' },
  { selector: 'link-card', behavior: 'cardlink' },
  { selector: 'horizontal-card', behavior: 'cardhorizontal' },
  { selector: 'basic-card', behavior: 'card' },
  { selector: 'image-card', behavior: 'cardimage' },
  { selector: 'overlay-card', behavior: 'cardoverlay' },
  
  // === NEW LAYOUT MAPPINGS ===
  
  // Structural
  { selector: 'wb-grid', behavior: 'grid' },
  { selector: 'wb-flex', behavior: 'flex' },
  { selector: 'wb-stack', behavior: 'stack' },
  { selector: 'wb-cluster', behavior: 'cluster' },
  { selector: 'wb-container', behavior: 'container' },
  
  // Aliases (Common Terminology)
  { selector: 'wb-row', behavior: 'flex' },     // Alias for horizontal flex
  { selector: 'wb-column', behavior: 'stack' }, // Alias for vertical stack

  // Page Layouts
  { selector: 'wb-sidebar', behavior: 'sidebarlayout' },
  { selector: 'wb-center', behavior: 'center' },
  { selector: 'wb-cover', behavior: 'cover' },
  { selector: 'wb-masonry', behavior: 'masonry' },
  { selector: 'wb-switcher', behavior: 'switcher' },

  // Specialty
  { selector: 'wb-reel', behavior: 'reel' },
  { selector: 'wb-frame', behavior: 'frame' },
  { selector: 'wb-sticky', behavior: 'sticky' },
  { selector: 'wb-drawer', behavior: 'drawerLayout' },
  { selector: 'wb-icon', behavior: 'icon' },

  // Interactive Elements
  { selector: 'button-tooltip', behavior: 'tooltip' },
  { selector: 'button-tooltip', behavior: 'toast' },

  // Generic Attributes (Always Active)
  { selector: '[tooltip]', behavior: 'tooltip' },
  { selector: '[toast-message]', behavior: 'toast' },
  { selector: '[ripple]', behavior: 'ripple' },
  { selector: '[badge]', behavior: 'badge' }
];

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
  
  // Cards
  { selector: 'article', behavior: 'card' },
  
  // Tooltips
  { selector: '[data-tooltip]', behavior: 'tooltip' }
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

  if (!getConfig('autoInject')) return behaviors;
  
  // Skip if data-wb is already present (explicit overrides implicit)
  if (element.hasAttribute('data-wb')) return behaviors;
  
  for (const { selector, behavior } of autoInjectMappings) {
    if (element.matches(selector)) {
      behaviors.push(behavior);
    }
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
      // Load behavior on demand
      const behaviorFn = await getBehavior(behaviorName);
      
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
      element.dataset.wbError = 'true';
      
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
   * Scan DOM for elements with data-wb and inject behaviors
   * Uses batching for better performance
   * @param {HTMLElement} root - Root element to scan (default: document.body)
   */
  async scan(root = document.body) {
    const elements = root.querySelectorAll('[data-wb]');
    const injections = [];

    elements.forEach(element => {
      const behaviorList = element.dataset.wb.split(/\s+/).filter(Boolean);
      const isEager = element.hasAttribute('data-wb-eager');

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
        WB.lazyInject(element, behavior);
      });
    });

    // Auto-inject scan
    if (getConfig('autoInject')) {
      autoInjectMappings.forEach(({ selector, behavior }) => {
        const autoElements = root.querySelectorAll(selector);
        autoElements.forEach(element => {
          // Skip if data-wb is present (already handled)
          if (!element.hasAttribute('data-wb')) {
            WB.lazyInject(element, behavior);
          }
        });
      });
    }

    // Wait for all injections (only eager ones)
    await Promise.all(injections);
    
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
              const isEager = node.hasAttribute('data-wb-eager');
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
              node.querySelectorAll?.('[data-wb]').forEach(el => {
                const behaviorList = el.dataset.wb.split(/\s+/).filter(Boolean);
                const isEager = el.hasAttribute('data-wb-eager');
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

            // Check descendants for auto-inject
            if (getConfig('autoInject') && node.hasChildNodes?.()) {
              autoInjectMappings.forEach(({ selector, behavior }) => {
                node.querySelectorAll?.(selector).forEach(el => {
                  if (!el.hasAttribute('data-wb')) {
                    WB.lazyInject(el, behavior);
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
          const isEager = element.hasAttribute('data-wb-eager');
          
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

    // Set autoInject
    if (autoInject) {
      setConfig('autoInject', true);
    }

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
    // If we didn't find a custom tag, or if there are extra behaviors, add data-wb
    const behaviors = data.behaviors || [];
    if (data.b && !isCustomTag) {
      behaviors.push(data.b);
    }
    
    if (behaviors.length > 0) {
      el.dataset.wb = behaviors.join(' ');
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
  window.WB = WB;
}

export { WB };
export default WB;
