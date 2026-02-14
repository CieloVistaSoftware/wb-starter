/**
 * Tag-Map Registry
 * =================
 * Centralized mapping of element tags and selectors to behavior names.
 * Source: src/wb-models/*.schema.json (generated from schema-index.json)
 * Last Updated: 2026-02-13
 */

// ============================================================================
// CUSTOM ELEMENT MAPPINGS (wb-* tags → behavior names)
// ============================================================================
// Maps HTML tag names to behavior function names
// Source: Each filename in src/wb-models/ without extension and .schema

export const elementMap = {
  // Components
  'wb-alert': 'alert',
  'wb-article': 'article',
  'wb-articles': 'articles',
  'wb-audio': 'audio',
  'wb-avatar': 'avatar',
  'wb-badge': 'badge',
  'wb-button': 'button',
  'wb-card': 'card',
  'wb-cardbutton': 'cardbutton',
  'wb-carddraggable': 'carddraggable',
  'wb-cardexpandable': 'cardexpandable',
  'wb-cardfile': 'cardfile',
  'wb-cardhero': 'cardhero',
  'wb-cardhorizontal': 'cardhorizontal',
  'wb-cardimage': 'cardimage',
  'wb-cardlink': 'cardlink',
  'wb-cardminimizable': 'cardminimizable',
  'wb-cardnotification': 'cardnotification',
  'wb-cardoverlay': 'cardoverlay',
  'wb-cardportfolio': 'cardportfolio',
  'wb-cardpricing': 'cardpricing',
  'wb-cardproduct': 'cardproduct',
  'wb-cardprofile': 'cardprofile',
  'wb-cardstats': 'cardstats',
  'wb-cardtestimonial': 'cardtestimonial',
  'wb-cardvideo': 'cardvideo',
  'wb-checkbox': 'checkbox',
  'wb-chip': 'chip',
  'wb-codecontrol': 'codecontrol',
  'wb-collapse': 'collapse',
  'wb-confetti': 'confetti',
  'wb-copy': 'copy',
  'wb-darkmode': 'darkmode',
  'wb-demo': 'demo',
  'wb-details': 'details',
  'wb-dialog': 'dialog',
  'wb-draggable': 'draggable',
  'wb-drawer': 'drawer',
  'wb-drawerLayout': 'drawerLayout',
  'wb-dropdown': 'dropdown',
  'wb-fireworks': 'fireworks',
  'wb-footer': 'footer',
  'wb-globe': 'globe',
  'wb-header': 'header',
  'wb-hero': 'hero',
  'wb-input': 'input',
  'wb-mdhtml': 'mdhtml',
  'wb-move': 'move',
  'wb-navbar': 'navbar',
  'wb-notes': 'notes',
  'wb-progress': 'progress',
  'wb-rating': 'rating',
  'wb-resizable': 'resizable',
  'wb-ripple': 'ripple',
  'wb-scrollalong': 'scrollalong',
  'wb-search': 'search',
  'wb-select': 'select',
  'wb-skeleton': 'skeleton',
  'wb-slider': 'slider',
  'wb-snow': 'snow',
  'wb-span': 'span',
  'wb-spinner': 'spinner',
  'wb-stagelight': 'stagelight',
  'wb-sticky': 'sticky',
  'wb-switch': 'switch',
  'wb-table': 'table',
  'wb-tabs': 'tabs',
  'wb-textarea': 'textarea',
  'wb-themecontrol': 'themecontrol',
  'wb-toast': 'toast',
  'wb-toggle': 'toggle',
  'wb-tooltip': 'tooltip',
  'wb-timeline': 'timeline'
};

// ============================================================================
// NATIVE ELEMENT AUTO-INJECT MAPPINGS
// ============================================================================
// Maps native HTML element selectors to behaviors
// Only applied when config.autoInject = true
// These are behaviors that enhance native elements

export const nativeMap = {
  // Form Elements
  'input[type="checkbox"]': 'checkbox',
  'input[type="radio"]': 'radio',
  'input[type="range"]': 'range',
  'select': 'select',
  'textarea': 'textarea',
  'button': 'button',
  'form': 'form',
  'fieldset': 'fieldset',
  'label': 'label',

  // Media
  'img': 'image',
  'video': 'video',
  'audio': 'audio',

  // Semantic Text
  'code': 'code',
  'pre': 'pre',
  'kbd': 'kbd',
  'mark': 'mark',

  // Structure
  'table': 'table',
  'details': 'details',
  'dialog': 'dialog',
  'progress': 'progress',
  'header': 'header',
  'footer': 'footer'
};

// ============================================================================
// EXTENSION MAPPINGS (x-* attributes → behavior names)
// ============================================================================
// Maps x-* extension attributes to behavior names
// Extensions are effects, utilities, and morphing behaviors
// Applied via x-{name} attributes on any element

export const extensionMap = {
  // Effects & Utilities
  'x-ripple': 'ripple',
  'x-tooltip': 'tooltip',
  'x-draggable': 'draggable',
  'x-resizable': 'resizable',
  'x-sticky': 'sticky',
  'x-scrollalong': 'scrollalong',
  'x-darkmode': 'darkmode',
  'x-themecontrol': 'themecontrol',
  'x-move': 'move',

  // Animations & Effects
  'x-confetti': 'confetti',
  'x-fireworks': 'fireworks',
  'x-snow': 'snow',
  'x-stagelight': 'stagelight',

  // Morphing (x-as-{name})
  'x-as-card': 'card',
  'x-as-timeline': 'timeline',
  'x-as-article': 'article'
};

// ============================================================================
// MERGED REGISTRY
// ============================================================================
// All behaviors in one set for quick lookups

export const allBehaviors = {
  ...elementMap,
  ...nativeMap,
  ...extensionMap
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get behavior name from element tag
 * @param {string} tagName - Element tag name (e.g., 'wb-card', 'wb-cardhero')
 * @returns {string|null} Behavior name or null if not found
 */
export function getElementBehavior(tagName) {
  const lower = tagName.toLowerCase();
  return elementMap[lower] || null;
}

/**
 * Find matching native auto-inject behavior for an element
 * @param {HTMLElement} element - DOM element to match
 * @returns {string|null} Behavior name or null if no match
 */
export function getNativeBehavior(element) {
  for (const [selector, behavior] of Object.entries(nativeMap)) {
    if (element.matches(selector)) {
      return behavior;
    }
  }
  return null;
}

/**
 * Get behavior from extension attribute name
 * @param {string} attrName - Attribute name (e.g., 'x-ripple')
 * @returns {string|null} Behavior name or null if not found
 */
export function getExtensionBehavior(attrName) {
  return extensionMap[attrName] || null;
}

/**
 * Check if a behavior exists
 * @param {string} name - Behavior name
 * @returns {boolean}
 */
export function hasBehavior(name) {
  return name in allBehaviors;
}

/**
 * Get all element tag names
 * @returns {string[]} Array of wb-* tag names
 */
export function getElementTags() {
  return Object.keys(elementMap);
}

/**
 * Get all native selectors
 * @returns {string[]} Array of CSS selectors
 */
export function getNativeSelectors() {
  return Object.keys(nativeMap);
}

/**
 * Get all extension attributes
 * @returns {string[]} Array of x-* attribute names
 */
export function getExtensionAttributes() {
  return Object.keys(extensionMap);
}
