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
  // Layout — behaviors, not classes that extend HTMLElement (v3). The
  // <wb-column>/<wb-cluster>/<wb-stack>/<wb-row> custom elements were removed
  // (#279) — each was a thin connectedCallback wrapper that just called the
  // already-existing pure behavior function from layouts.js directly.
  'wb-column': 'stack',
  'wb-cluster': 'cluster',
  'wb-stack': 'stack',
  // flex()'s own default direction is 'row' (layouts.js), so no special
  // options are needed to reproduce wb-row.js's hardcoded direction:'row'.
  'wb-row': 'flex',
  // Components
  'wb-alert': 'alert',
  'wb-article': 'article',
  'wb-articles': 'articles',
  // wb-autocomplete/wb-colorpicker/wb-counter/wb-error/wb-fieldset/wb-file/
  // wb-floatinglabel/wb-formrow/wb-help/wb-inputgroup/wb-label/wb-masked/
  // wb-tags (#365 audit): each has its own real behavior function
  // (src/wb-viewmodels/*.js, already registered in wb-viewmodels/index.js's
  // behaviorModules) AND its own schema.json, but was missing here entirely
  // -- getElementBehavior() (used by both wb.js's _detectSchemaName() and
  // its own unconditional wb-* injection loop in scan()) returns null for
  // any tag not in this map, so WB.scan() never dispatched ANY of these 13
  // tags at all: no schema fetch, no behavior injection, no x-schema
  // attribute, nothing -- a silent total no-op, confirmed live via a bare
  // `<wb-X></wb-X>` producing zero classes/children/console output for each.
  // Each behavior already handles being called on a plain non-input host
  // element (autocomplete/colorpicker/file/tags/floatinglabel all build a
  // real child <input> or wrapper when `element` isn't already one), so
  // wiring the tag here restores the same real, functioning render these
  // already get via their (working) x-{name} attribute form on native
  // elements -- it does not change x-* behavior at all, only enables the
  // <wb-X> custom-tag form to actually run.
  'wb-autocomplete': 'autocomplete',
  'wb-colorpicker': 'colorpicker',
  'wb-counter': 'counter',
  'wb-error': 'error',
  'wb-fieldset': 'fieldset',
  'wb-file': 'file',
  'wb-floatinglabel': 'floatinglabel',
  'wb-formrow': 'formrow',
  'wb-help': 'help',
  'wb-inputgroup': 'inputgroup',
  'wb-label': 'label',
  'wb-masked': 'masked',
  'wb-tags': 'tags',
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
  'wb-card-link': 'cardlink',
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
  // wb-fix-card (#365): own file (fix-card.js), not part of the wb-card*
  // family generated above -- was missing here entirely, so WB.scan() never
  // dispatched the tag and fix-card.js's customElements.define() never ran.
  'wb-fix-card': 'fix-card',
  'wb-checkbox': 'checkbox',
  'wb-chip': 'chip',
  'wb-codecontrol': 'codecontrol',
  'wb-collapse': 'collapse',
  'wb-confetti': 'confetti',
  'wb-control': 'control',
  'wb-copy': 'copy',
  'wb-darkmode': 'darkmode',
  'wb-demo': 'demo',
  'wb-details': 'details',
  'wb-dialog': 'dialog',
  // dialog.js's TRIGGER mode (modal-title/modal-content) was written for this
  // exact tag but never mapped here, so WB never invoked it — the "Open Modal"
  // click did nothing regardless of how many times dialog.js itself was fixed
  // (#251, recurred).
  'wb-modal': 'dialog',
  'wb-draggable': 'draggable',
  'wb-drawer': 'drawer',
  // #363: was 'wb-drawerLayout' (mixed-case key) -- getElementBehavior()
  // always looks up tagName.toLowerCase(), and the real tag is authored
  // lowercase/hyphenated everywhere (confirmed live: demos/site/layout.html
  // uses <wb-drawer-layout>), so the old mixed-case key could never match
  // any real tag lookup. Renamed to the actual lowercase tag name.
  'wb-drawer-layout': 'drawerLayout',
  'wb-dropdown': 'dropdown',
  'wb-figure': 'figure',
  'wb-fireworks': 'fireworks',
  'wb-footer': 'footer',
  'wb-form': 'form',
  'wb-gallery': 'gallery',
  'wb-globe': 'globe',
  'wb-header': 'header',
  'wb-hero': 'hero',
  'wb-input': 'input',
  'wb-mdhtml': 'mdhtml',
  'wb-move': 'move',
  'wb-release': 'release',
  'wb-navbar': 'navbar',
  'wb-notes': 'notes',
  'wb-progress': 'progress',
  'wb-rating': 'rating',
  'wb-ratio': 'ratio',
  'wb-repeater': 'repeater',
  'wb-resizable': 'resizable',
  'wb-ripple': 'ripple',
  'wb-scrollalong': 'scrollalong',
  // 'searchfield' (not the bare 'search' behavior) — search() operates
  // directly on whatever element it's given (used as-is via x-search on a
  // literal <input>). <wb-search> is a CONTAINER tag, not an input itself;
  // it needs the child-input-aware wrapper. See search.js's searchField().
  'wb-search': 'searchfield',
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
  'wb-codecolorcontrol': 'codecolorcontrol',
  'wb-toast': 'toast',
  'wb-toggle': 'toggle',
  'wb-tooltip': 'tooltip',
  'wb-timeline': 'timeline',
  // wb-accordion is DEPRECATED (prefer <details>/<summary> — see
  // semantics/details.js) but still rendered/toggled via accordion()
  // (collapse.js), retained for back-compat (#279).
  'wb-accordion': 'accordion',
  'wb-video': 'video',
  'wb-vimeo': 'vimeo',
  'wb-youtube': 'youtube'
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
  // #481: type="password" is as unambiguous a signal as checkbox/radio/range
  // above -- no reason it alone shouldn't be enough to get the show/hide
  // toggle. Explicit x-password still works too (getAutoInjectBehavior()'s
  // hasAttribute(candidate) check below skips the auto-inject path when it's
  // already present, so it's never double-applied).
  'input[type="password"]': 'password',
  // <input> is native semantic HTML -- autoInject decorates it like any
  // other native element (button/select/textarea below), not a special
  // case requiring x-input. Order matters: getNativeBehavior() returns on
  // first selector match, so the specific checkbox/radio/range entries
  // above still win for those types. wb.js's getAutoInjectBehavior() (and
  // wb-lazy.js's equivalent) separately skips this generic fallback when a
  // DIFFERENT explicit x-{behavior} attribute is already present (e.g.
  // x-password, x-search) -- so a deliberately-opted-into richer behavior
  // is never double-applied alongside the generic input() wrapper.
  'input': 'input',
  'select': 'select',
  'textarea': 'textarea',
  'button': 'button',
  'form': 'form',
  'fieldset': 'fieldset',
  'label': 'label',
  'article': 'card', // semantic <article> -> card (only when autoInject enabled)

  // Media
  'img': 'image',
  'video': 'video',
  'audio': 'audio',
  'figure': 'figure',

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
  'x-release': 'release',
  // docs/behaviors/*.md documents x-progressbar ("attribute-based progress
  // bar... apply directly to any element, no custom tag required") and
  // semantics/progress.js's own code comment says it was "gate widened...
  // to also cover x-progress on any element" -- but NEITHER attribute name
  // was ever actually registered anywhere in this map or wb-lazy.js's own
  // table. Every documented example was a fully inert, unstyled div
  // (confirmed live: no class, no fill, no percent). Routes to the modern
  // `progress` behavior (semantics/progress.js), not the @deprecated
  // progressbar.js -- that older file only reads `variant`/`value` via
  // element.dataset, not the plain attributes every doc example (and Law
  // 11) uses, so it would reproduce the exact same silent-no-op bug under
  // a different name.
  'x-progressbar': 'progress',
  'x-progress': 'progress',

  // Animations & Effects
  'x-confetti': 'confetti',
  'x-fireworks': 'fireworks',
  'x-snow': 'snow',
  'x-stagelight': 'stagelight',

  // Morphing (x-as-{name})
  'x-as-card': 'card',
  'x-as-timeline': 'timeline',
  'x-as-article': 'article',

  // John, screenshot on docs/behaviors-reference.md's cluster example:
  // "don't use class names when an x-cluster behavior works better...
  // Intellisense will list all x-behaviors." stack()/cluster() (layouts.js)
  // already worked via the <wb-stack>/<wb-cluster> TAG form (elementMap
  // above), but had no attribute-decoration form for applying them to an
  // arbitrary element -- unlike most other behaviors in this table. Canonical
  // location (not wb-lazy.js's own WB_LAZY_ONLY_ATTRIBUTES table) so both
  // runtimes and any tooling reading getExtensionAttributes() pick it up.
  'x-stack': 'stack',
  'x-cluster': 'cluster'
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
