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

// Auto-injection mappings
const customElementMappings = [
  // Card custom tags - BOTH wb-* AND card-* namespaces for flexibility
  { selector: 'wb-card', behavior: 'card' },
  { selector: 'card-basic', behavior: 'card' },
  
  // wb-* prefix (primary)
  { selector: 'wb-cardimage', behavior: 'cardimage' },
  { selector: 'wb-cardvideo', behavior: 'cardvideo' },
  { selector: 'wb-cardprofile', behavior: 'cardprofile' },
  { selector: 'wb-cardpricing', behavior: 'cardpricing' },
  { selector: 'wb-cardproduct', behavior: 'cardproduct' },
  { selector: 'wb-cardstats', behavior: 'cardstats' },
  { selector: 'wb-cardtestimonial', behavior: 'cardtestimonial' },
  { selector: 'wb-cardhero', behavior: 'cardhero' },
  { selector: 'wb-cardfile', behavior: 'cardfile' },
  { selector: 'wb-cardnotification', behavior: 'cardnotification' },
  { selector: 'wb-cardportfolio', behavior: 'cardportfolio' },
  { selector: 'wb-cardlink', behavior: 'cardlink' },
  { selector: 'wb-cardhorizontal', behavior: 'cardhorizontal' },
  { selector: 'wb-cardoverlay', behavior: 'cardoverlay' },
  { selector: 'wb-cardbutton', behavior: 'cardbutton' },
  { selector: 'wb-cardexpandable', behavior: 'cardexpandable' },
  { selector: 'wb-cardminimizable', behavior: 'cardminimizable' },
  { selector: 'wb-carddraggable', behavior: 'carddraggable' },
  
  // Feedback Components
  { selector: 'wb-spinner', behavior: 'spinner' },
  { selector: 'wb-avatar', behavior: 'avatar' },
  { selector: 'wb-badge', behavior: 'badge' },
  { selector: 'wb-alert', behavior: 'alert' },
  { selector: 'wb-progress', behavior: 'progress' },
  { selector: 'wb-rating', behavior: 'rating' },
  { selector: 'wb-tabs', behavior: 'tabs' },
  { selector: 'wb-switch', behavior: 'switch' },
  
  // Attributes
  { selector: '[x-breadcrumb]', behavior: 'breadcrumb' },
  { selector: '[x-toast]', behavior: 'toast' },
  { selector: '[x-notify]', behavior: 'notify' },
  { selector: '[x-typewriter]', behavior: 'typewriter' },
  { selector: '[x-bounce]', behavior: 'bounce' },
  { selector: '[x-pulse]', behavior: 'pulse' },
  { selector: '[x-rainbow]', behavior: 'rainbow' },
  
  // card-* prefix (alternative/legacy)
  { selector: 'card-image', behavior: 'cardimage' },
  { selector: 'card-video', behavior: 'cardvideo' },
  { selector: 'card-profile', behavior: 'cardprofile' },
  { selector: 'card-pricing', behavior: 'cardpricing' },
  { selector: 'card-product', behavior: 'cardproduct' },
  { selector: 'card-stats', behavior: 'cardstats' },
  { selector: 'card-testimonial', behavior: 'cardtestimonial' },
  { selector: 'card-hero', behavior: 'cardhero' },
  { selector: 'card-file', behavior: 'cardfile' },
  { selector: 'card-notification', behavior: 'cardnotification' },
  { selector: 'card-portfolio', behavior: 'cardportfolio' },
  { selector: 'card-link', behavior: 'cardlink' },
  { selector: 'card-horizontal', behavior: 'cardhorizontal' },
  { selector: 'card-overlay', behavior: 'cardoverlay' },
  { selector: 'card-button', behavior: 'cardbutton' },
  { selector: 'card-expandable', behavior: 'cardexpandable' },
  { selector: 'card-minimizable', behavior: 'cardminimizable' },
  { selector: 'card-draggable', behavior: 'carddraggable' },
  
  // Custom Card Names (noun-first)
  { selector: 'profile-card', behavior: 'cardprofile' },
  { selector: 'hero-card', behavior: 'cardhero' },
  { selector: 'stats-card', behavior: 'cardstats' },
  { selector: 'testimonial-card', behavior: 'cardtestimonial' },
  { selector: 'video-card', behavior: 'cardvideo' },
  { selector: 'file-card', behavior: 'cardfile' },
  { selector: 'notification-card', behavior: 'cardnotification' },
  { selector: 'basic-card', behavior: 'card' },
  { selector: 'image-card', behavior: 'cardimage' },
  { selector: 'overlay-card', behavior: 'cardoverlay' },
  { selector: 'portfolio-card', behavior: 'cardportfolio' },
  { selector: 'link-card', behavior: 'cardlink' },
  { selector: 'horizontal-card', behavior: 'cardhorizontal' },
  
  { selector: 'wb-demo', behavior: 'demo' },
  { selector: 'wb-code-card', behavior: 'demo' },
  { selector: 'wb-mdhtml', behavior: 'mdhtml' },
  
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
  { selector: 'wb-span', behavior: 'span' },
  { selector: 'wb-control', behavior: 'control' },
  { selector: 'wb-repeater', behavior: 'repeater' },

  // Interactive Elements
  { selector: 'button-tooltip', behavior: 'tooltip' },
  { selector: 'button-tooltip', behavior: 'toast' },

  // Generic Attributes (Always Active)
  { selector: '[tooltip]', behavior: 'tooltip' },
  { selector: '[x-tooltip]', behavior: 'tooltip' },
  { selector: '[toast-message]', behavior: 'toast' },
  { selector: '[ripple]', behavior: 'ripple' },
  { selector: '[x-ripple]', behavior: 'ripple' },
  { selector: '[badge]', behavior: 'badge' },
  
  // Behavior Attributes
  { selector: '[x-copy]', behavior: 'copy' },
  { selector: '[x-draggable]', behavior: 'draggable' },
  { selector: '[x-collapse]', behavior: 'collapse' },
  { selector: '[x-fadein]', behavior: 'fadein' },
  { selector: '[x-shake]', behavior: 'shake' },
  { selector: '[x-confetti]', behavior: 'confetti' },
  { selector: '[x-form]', behavior: 'form' },
  { selector: '[x-password]', behavior: 'password' },
  { selector: '[x-tags]', behavior: 'tags' },
  { selector: '[x-file]', behavior: 'file' },
  { selector: '[x-masked]', behavior: 'masked' },
  { selector: '[x-stepper]', behavior: 'stepper' },
  { selector: '[x-counter]', behavior: 'counter' },
  { selector: '[x-autocomplete]', behavior: 'autocomplete' },
  { selector: '[x-otp]', behavior: 'otp' },
  { selector: '[x-colorpicker]', behavior: 'colorpicker' },
  { selector: '[x-search]', behavior: 'search' },
  { selector: '[x-floatinglabel]', behavior: 'floatinglabel' },
  { selector: '[x-clock]', behavior: 'clock' },
  { selector: '[x-countdown]', behavior: 'countdown' },
  { selector: '[x-youtube]', behavior: 'youtube' },
  { selector: '[x-pagination]', behavior: 'pagination' },
  { selector: '[x-steps]', behavior: 'steps' },
  { selector: '[x-timeline]', behavior: 'timeline' },
  { selector: '[x-kbd]', behavior: 'kbd' },
  { selector: '[x-gallery]', behavior: 'gallery' },
  { selector: '[x-image]', behavior: 'image' },
  { selector: '[x-popover]', behavior: 'popover' },
  { selector: '[x-confirm]', behavior: 'confirm' },
  { selector: '[x-prompt]', behavior: 'prompt' },
  { selector: '[x-lightbox]', behavior: 'lightbox' },
  { selector: '[x-share]', behavior: 'share' },
  { selector: '[x-print]', behavior: 'print' },
  { selector: '[x-fullscreen]', behavior: 'fullscreen' },
  { selector: '[x-darkmode]', behavior: 'darkmode' },
  { selector: '[x-truncate]', behavior: 'truncate' },
  { selector: '[x-sticky]', behavior: 'sticky' },
  { selector: '[x-scrollalong]', behavior: 'scrollalong' },
  { selector: '[x-masonry]', behavior: 'masonry' },
  { selector: '[x-dropdown]', behavior: 'dropdown' },
  { selector: '[x-toggle]', behavior: 'toggle' },
  { selector: '[x-drawer-layout]', behavior: 'drawerLayout' },
  { selector: '[x-autosize]', behavior: 'autosize' },
  { selector: 'wb-accordion', behavior: 'accordion' },
  { selector: 'wb-modal', behavior: 'modal' },

  // New Components
  { selector: 'wb-codecontrol', behavior: 'codecontrol' },
  { selector: 'wb-collapse', behavior: 'collapse' },
  { selector: 'wb-darkmode', behavior: 'darkmode' },
  { selector: 'wb-dropdown', behavior: 'dropdown' },
  { selector: 'wb-footer', behavior: 'footer' },
  { selector: 'wb-header', behavior: 'header' },
  { selector: 'wb-globe', behavior: 'globe' },
  { selector: 'wb-stagelight', behavior: 'stagelight' },
  { selector: 'wb-audio', behavior: 'audio' },
  { selector: 'wb-stat', behavior: 'stat' },
  { selector: 'wb-button', behavior: 'button' },
  { selector: 'wb-dialog', behavior: 'dialog' },
  { selector: 'wb-details', behavior: 'details' },
  { selector: 'wb-hero', behavior: 'hero' },
  { selector: 'wb-input', behavior: 'input' },
  { selector: 'wb-notes', behavior: 'notes' },
  { selector: 'wb-select', behavior: 'select' },
  { selector: 'wb-skeleton', behavior: 'skeleton' },
  { selector: 'wb-slider', behavior: 'slider' },
  { selector: 'wb-table', behavior: 'table' },
  { selector: 'wb-textarea', behavior: 'textarea' },
  { selector: 'wb-timeline', behavior: 'timeline' },
  { selector: 'wb-toast', behavior: 'toast' },
  { selector: 'wb-toggle', behavior: 'toggle' },
  { selector: 'wb-tooltip', behavior: 'tooltip' },
  { selector: 'wb-resizable', behavior: 'resizable' },
  { selector: 'wb-navbar', behavior: 'navbar' },
  { selector: 'wb-checkbox', behavior: 'checkbox' },
  { selector: 'wb-search', behavior: 'search' },
  { selector: 'wb-rating', behavior: 'rating' }
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
  
  // Skip if x-behavior is already present (explicit overrides implicit)
  if (element.hasAttribute('x-behavior')) return behaviors;
  
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
  async scan(root = document.body) {
    const elements = root.querySelectorAll('[x-behavior]');
    const injections = [];

    elements.forEach(element => {
      const behaviorList = element.getAttribute('x-behavior').split(/\s+/).filter(Boolean);
      const isEager = element.hasAttribute('x-eager');

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
          // Skip if x-behavior is present (already handled)
          if (!element.hasAttribute('x-behavior')) {
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

            // Check descendants for auto-inject
            if (getConfig('autoInject') && node.hasChildNodes?.()) {
              autoInjectMappings.forEach(({ selector, behavior }) => {
                node.querySelectorAll?.(selector).forEach(el => {
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
