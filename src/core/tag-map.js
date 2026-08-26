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
  // EMPTY ON PURPOSE.
  //
  // John: "we are not using components any more ... there should be nothing
  // calling for x-tag." The 104 <wb-*> component tags that lived here are
  // gone. Every one had a replacement, so no behavior was lost: 18 became the
  // semantic element that already auto-injects them (<article> -> <article>),
  // the rest became a host carrying the x- attribute
  // (<div x-alert> -> <div x-alert>).
  //
  // Kept as an exported empty object rather than deleted: wb-lazy.js and
  // style-loader.js both import it, so an empty map means "no component tags"
  // everywhere at once instead of a missing-export crash.
  //
  // Eleven behaviors were reachable ONLY through their tag -- container, grid,
  // center, cover, switcher, reel, frame, icon, stat, sidebarlayout, modal.
  // Their x- forms were added to extensionMap below FIRST; deleting the tags
  // without them would have deleted the behaviors with them.
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
  // <article> injects the article behavior, which renders a card. The
  // behavior is named for the element that triggers it; "card" describes
  // what you see, and lives in the class and the docs, not the registry.
  'article': 'article',

  // Media
  'img': 'img',
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
  // #816: glow, sparkle and rainbow are implemented in effects.js and styled
  // in effects.css, and had no entry here — so those attributes dispatched to
  // nothing while ripple, confetti and fireworks worked. Three of six
  // registered, with nothing marking which three.
  'x-glow': 'glow',
  'x-sparkle': 'sparkle',
  'x-rainbow': 'rainbow',
  'x-tooltip': 'tooltip',
  'x-draggable': 'draggable',
  'x-resizable': 'resizable',
  'x-sticky': 'sticky',
  'x-scrollalong': 'scrollalong',
  'x-darkmode': 'darkmode',
  'x-themecontrol': 'themecontrol',
  'x-move': 'move',
  // #764 -- as wide as the container allows. No semantic tag maps to this:
  // width is a layout decision, not something an element IS.
  'x-fill': 'fill',
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

  // #783 -- morphing (x-as-card / x-as-timeline / x-as-article) removed.
  // It never ran under the lazy runtime: wb-lazy.js filtered x-as-* out of
  // its dispatch table, and index.html loads that runtime -- so every
  // documented morph example did nothing on a normal page.

  // John, screenshot on docs/behaviors-reference.md's cluster example:
  // "don't use class names when an x-cluster behavior works better...
  // Intellisense will list all x-behaviors." stack()/cluster() (layouts.js)
  // already worked via the <div x-stack>/<div x-cluster> TAG form (elementMap
  // above), but had no attribute-decoration form for applying them to an
  // arbitrary element -- unlike most other behaviors in this table. Canonical
  // location (not wb-lazy.js's own WB_LAZY_ONLY_ATTRIBUTES table) so both
  // runtimes and any tooling reading getExtensionAttributes() pick it up.
  'x-stack': 'stack',
  'x-cluster': 'cluster',

  // #626: every other behavior in this table gets its own dedicated
  // x-{name} attribute (x-drawer, x-popover, x-confirm, ...) -- 'card' never
  // did, so docs/components/cards/card.md's semantic rewrite had to fall
  // back to the lower-level generic x-behavior="card" attribute instead of
  // the pattern every other doc uses. John: "shouldn't all of our behaviors
  // be addressable via x-behaviorname vs x-behavior=''" -- yes. Adding the
  // dedicated key for consistency; x-behavior="card" still works too (it's
  // the always-available generic fallback every registered behavior name
  // supports, not being removed here).
  // Kept: 'card' says what you get, for a host that is not an <article>.
  'x-card': 'article',

  // #631: an audit (John: "how many x-tags do we have and whether or not
  // they all have an equivalent x-attribute") found 65 of the 104 wb-* tags
  // had NO dedicated x-{name} entry anywhere -- confirmed live that all 65
  // already WORK today via wb.js's dynamic [x-{behaviorName}] dispatch
  // (scan()'s "Semantic Shorthand" step builds that selector for every
  // registered behavior name, no table needed), but wb-lazy.js has no such
  // dynamic path -- ONLY this table drives its dispatch -- so every one of
  // these silently never worked there, and none of them were discoverable
  // via any x-attribute reference/IntelliSense since nothing declared them.
  // John: "I want to get to the point we primarily support x-attributes and
  // deprecate wb-* elements" -- registering all of them here is the
  // prerequisite: wb-lazy.js parity, plus making every one of them a real,
  // documented, discoverable attribute instead of an undocumented fallback.
  // x-search already maps to the DIFFERENT 'search' behavior (searchfield's
  // own x-search tag is the CONTAINER-aware wrapper, see tag-map.js's own
  // comment above) -- used x-searchfield here, not x-search, to avoid
  // silently colliding the two.
  'x-accordion': 'accordion',
  'x-alert': 'alert',
  'x-articles': 'articles',
  'x-audio': 'audio',
  'x-avatar': 'avatar',
  'x-badge': 'badge',
  'x-button': 'button',
  'x-checkbox': 'checkbox',
  'x-chip': 'chip',
  'x-codecontrol': 'codecontrol',
  'x-control': 'control',
  'x-demo': 'demo',
  'x-details': 'details',
  'x-dialog': 'dialog',
  'x-error': 'error',
  'x-fieldset': 'fieldset',
  'x-figure': 'figure',
  'x-fix-card': 'fix-card',
  'x-flex': 'flex',
  'x-footer': 'footer',
  'x-formrow': 'formrow',
  'x-globe': 'globe',
  'x-header': 'header',
  'x-help': 'help',
  'x-hero': 'hero',
  'x-input': 'input',
  'x-inputgroup': 'inputgroup',
  'x-mdhtml': 'mdhtml',
  'x-navbar': 'navbar',
  'x-notes': 'notes',
  'x-rating': 'rating',
  'x-ratio': 'ratio',
  'x-repeater': 'repeater',
  'x-searchfield': 'searchfield',
  'x-select': 'select',
  'x-skeleton': 'skeleton',
  'x-slider': 'slider',
  'x-span': 'span',
  'x-spinner': 'spinner',
  'x-switch': 'switch',
  'x-table': 'table',
  'x-tabs': 'tabs',
  'x-textarea': 'textarea',
  'x-video': 'video',
  'x-vimeo': 'vimeo',
  // Card-variant family -- these have no native semantic element of their
  // own (unlike button/table/dialog/etc, which also auto-apply via
  // autoInject on a plain native tag) -- x-{name} on a semantic wrapper
  // (e.g. <article x-cardhero>) is the ONLY non-tag way to reach any of
  // these, making dedicated registration more important here, not less.
  'x-cardbutton': 'cardbutton',
  'x-carddraggable': 'carddraggable',
  'x-cardexpandable': 'cardexpandable',
  'x-cardfile': 'cardfile',
  'x-cardhero': 'cardhero',
  'x-cardhorizontal': 'cardhorizontal',
  'x-cardimage': 'cardimage',
  'x-cardlink': 'cardlink',
  'x-cardminimizable': 'cardminimizable',
  'x-cardnotification': 'cardnotification',
  'x-cardoverlay': 'cardoverlay',
  'x-cardportfolio': 'cardportfolio',
  'x-cardpricing': 'cardpricing',
  'x-cardproduct': 'cardproduct',
  'x-cardprofile': 'cardprofile',
  'x-cardstats': 'cardstats',
  'x-cardtestimonial': 'cardtestimonial',
  'x-cardvideo': 'cardvideo',

  // #645: consolidation of x-attributes that were only ever registered in
  // wb-lazy.js's own local WB_LAZY_ONLY_ATTRIBUTES table (duplicated
  // per-runtime instead of shared here) -- wb.js never needed a table entry
  // for these at all (its dynamic x-{name} dispatch, see #631 comment
  // above, already covered them), but wb-lazy.js's dispatch is
  // table-driven, so each only ever worked on the eager (wb.js) runtime.
  // Moving them here gives both runtimes the same source of truth and lets
  // the matching lines in wb-lazy.js be deleted instead of drifting.
  //
  // x-article is the one genuine addition, not a relocation -- it had ZERO
  // x-attribute coverage anywhere (absent from both this table and
  // wb-lazy.js's), unlike the other 19 below, which were already fully
  // functional via wb-lazy.js's table. Routes to the 'article' behavior
  // (src/wb-viewmodels/article.js, already reachable via the <div x-article>
  // tag in elementMap above). Distinct from 'x-articles' just above (plural
  // LIST view, a different behavior) and from the former 'x-as-article' in the
  // Morphing section above (morph-only form that rewrites an existing
  // element's semantics) -- three different names for three different
  // behaviors, not aliases of each other.
  'x-article': 'article',

  // #834 -- the three native mappings that had no x- form at all. A tag that
  // auto-injects must have an attribute that applies the same behavior to
  // another host; without it the behavior is reachable one way only.
  // Layout and utility behaviors that were reachable ONLY through their
  // <wb-*> tag. With components going away they needed an attribute form or
  // the behavior would have gone with the tag. Registered here (not in
  // wb-lazy.js) so both runtimes and every tooling path see them -- putting
  // them in the second registry is what hid them in the first place.
  'x-container': 'container',
  'x-grid': 'grid',
  'x-center': 'center',
  'x-cover': 'cover',
  'x-switcher': 'switcher',
  'x-reel': 'reel',
  'x-frame': 'frame',
  'x-icon': 'icon',
  'x-stat': 'stat',
  'x-sidebarlayout': 'sidebarlayout',
  'x-modal': 'modal',
  'x-radio': 'radio',
  'x-range': 'range',
  'x-mark': 'mark',
  'x-autocomplete': 'autocomplete',
  'x-colorpicker': 'colorpicker',
  'x-counter': 'counter',
  'x-file': 'file',
  'x-floatinglabel': 'floatinglabel',
  'x-masked': 'masked',
  'x-tags': 'tags',
  'x-collapse': 'collapse',
  // x-copy makes the element itself the copy trigger -- distinct from the
  // sibling 'x-copybutton' attribute (still wb-lazy.js-only, unmoved),
  // which overlays a separate positioned copy button on any element. See
  // src/wb-viewmodels/copy.js.
  'x-copy': 'copy',
  'x-drawer': 'drawer',
  // Hyphenated to match #363's tag-name convention (x-drawer-layout, not
  // x-drawerLayout) -- a page-shell layout primitive, a DIFFERENT behavior
  // from plain 'x-drawer' above (slide-out panel + backdrop triggered by a
  // click). Easy to conflate by name, not the same thing.
  'x-drawer-layout': 'drawerLayout',
  'x-dropdown': 'dropdown',
  'x-gallery': 'gallery',
  'x-toast': 'toast',
  'x-toggle': 'toggle',
  // x-timeline renders a real timeline component -- adjacent to, but not a
  // collision with, the former 'x-as-timeline' morph attribute (removed #783) (a
  // morph-only form that rewrites an existing element's semantics).
  'x-timeline': 'timeline',
  'x-youtube': 'youtube',
  // Lowest priority of this batch -- 'form'/'label' already auto-inject
  // natively via nativeMap's 'form'/'label' selectors (autoInject only).
  // These add the same explicit, opt-in x-{name} form every other behavior
  // in this table gets.
  'x-form': 'form',
  'x-label': 'label'
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
 * @param {string} tagName - Element tag name (e.g., '.x-card', '[x-cardhero]')
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
