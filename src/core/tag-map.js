/**
 * Tag-Map Registry
 * =================
 * THE behavior registry: every selector that binds a behavior is declared
 * here and nowhere else (#831). wb.js and wb-lazy.js both read it; neither
 * keeps a table of its own. The maps:
 *
 *   elementMap        tag name      -> behavior   (empty since 4.0.0)
 *   nativeMap         native selector -> behavior (auto-inject)
 *   extensionMap      x-* attribute -> behavior
 *   BEHAVIOR_ALIASES  renamed x- name -> the behavior it now runs
 *   propertyMap       plain attribute (tooltip=, badge=) -> behavior
 *   legacyLazyMap     [data-tooltip] -> tooltip, wb-lazy.js only
 *
 * A registered behavior that no map routes still answers to [x-{name}]: both
 * runtimes compute that selector from wb-viewmodels/index.js (#1642).
 * scripts/audit-behavior-registry.mjs --gate fails if a selector table
 * appears anywhere else.
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
  // <article> IS a card in this system (John: "an article is a card in this
  // system"). It names the card behavior directly: there is no separate
  // article behavior, and x-card is the attribute form for any other host.
  'article': 'card',

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
  'footer': 'footer',
  // #958 -- John, 2026-09-10: "in html5 there is a nav element, when we
  // created the navbar our intent was to give the nav links a look and feel of
  // our site". A <nav> picks up navbar the way an <article> picks up card. A
  // plain <nav> gets the link look only (navbar() leaves its layout alone);
  // brand/items/logo/sticky/variant make it the site header.
  'nav': 'navbar'
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
  'x-glass': 'glass',
  // #463 -- a cart that remembers what Add to Cart added.
  'x-cart': 'cart',
  'x-release': 'release',
  // x-progress on any host; <progress> injects it on its own. x-progressbar
  // was a second spelling of the same behavior and has been removed -- one
  // behavior, one name (the same fix as x-article -> x-card).
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
  // location (not a table in wb-lazy.js, which no longer has one) so both
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
  // 'card' says what you get, for a host that is not an <article>.
  //
  // Names the `card` behavior directly. It used to say 'article', which worked
  // only because index.js routes `article` to card.js -- true, but indirect:
  // it made <div x-card> depend on a mapping two files away that is about
  // <article> auto-injection, not about this attribute.
  'x-card': 'card',

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
  'x-codetheme': 'codetheme',
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
  'x-spinner': 'spinner',
  'x-status': 'status',
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
  // x-article was added here once and is gone again: it routed to an
  // 'article' behavior that index.js sent to card.js anyway, so it was a
  // second spelling of x-card. <article> is a card; x-card is its attribute.

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
  // sibling 'x-copybutton' attribute (further down this table),
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
  'x-label': 'label',

  // #831: everything below lived in wb-lazy.js's WB_LAZY_ONLY_ATTRIBUTES, a
  // second registry nothing but that runtime read. Anything that enumerated
  // tag-map.js alone (the behaviors page, the docs list, every audit) missed
  // these, and the table grew from 34 to 45 keys while #667 asked for it to
  // shrink. Moved here in the table's own order, so wb-lazy.js binds them in
  // the same sequence as before; that table is gone.
  //
  // mdhtml.js marks rendered code blocks with bare x-pre / x-code presence
  // attributes and relies on WB.scan() picking them up (#322). <pre>, <code>,
  // <kbd> and <img> also auto-inject the same behavior through nativeMap
  // above; the x- form applies it to another host (#834).
  'x-pre': 'pre',
  'x-code': 'code',
  'x-breadcrumb': 'breadcrumb',
  'x-notify': 'notify',
  'x-typewriter': 'typewriter',
  'x-bounce': 'bounce',
  'x-pulse': 'pulse',
  // x-copybutton (#291) overlays a separate positioned copy button on any
  // element; x-copy above makes the element itself the trigger.
  'x-copybutton': 'copybutton',
  'x-fadein': 'fadein',
  'x-shake': 'shake',
  // Entrance / attention-seeker animations and relative time (#138).
  'x-slidein': 'slidein',
  'x-zoomin': 'zoomin',
  'x-wobble': 'wobble',
  'x-tada': 'tada',
  'x-jello': 'jello',
  'x-heartbeat': 'heartbeat',
  'x-flip': 'flip',
  'x-flash': 'flash',
  'x-relativetime': 'relativetime',
  // <input type="password"> auto-injects this through nativeMap (#481).
  'x-password': 'password',
  // #1185: documented from 4.0.0.
  'x-ul': 'ul',
  'x-ol': 'ol',
  'x-dl': 'dl',
  'x-stepper': 'stepper',
  'x-otp': 'otp',
  // Not searchfield: x-searchfield above is the container-aware wrapper.
  'x-search': 'search',
  'x-clock': 'clock',
  'x-countdown': 'countdown',
  'x-pagination': 'pagination',
  'x-steps': 'steps',
  'x-kbd': 'kbd',
  // #834: the element is <img>; docs/behaviors/img.md teaches x-img.
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
  'x-autosize': 'autosize'
};

// ============================================================================
// RENAMED BEHAVIORS (old x- name -> the behavior it now runs)
// ============================================================================
// Keyed and valued without the `x-` prefix. A rename keeps the old spelling
// working for pages written against it, but the old name is NOT a second
// behavior: it has no doc, schema or examples of its own, and the inventories
// (the reference docs, the behaviors page) list only the new name.
// wb-lazy.js binds `[x-old]`; wb-viewmodels/index.js registers the old key, so
// wb.js's x-{name} route reaches it too. Moved here from attribute-aliases.js
// (#831), so an alias is a registry entry like any other.

export const BEHAVIOR_ALIASES = Object.freeze({
  // #668: a highlight.js theme picker; its sync event was already
  // x:codetheme:sync and its tests were already named code-theme-*.
  codecontrol: 'codetheme',
  // #1105: status-coloured text and window dots; "span" named an HTML
  // element no native element maps to.
  span: 'status',
  // #830: John -- "an equivalent x-nav for injecting anywhere". <nav> gets
  // navbar natively (nativeMap above); x-nav is that same behavior on any
  // other host. x-navbar is the canonical name (extensionMap above), so the
  // behaviors page lists navbar once.
  nav: 'navbar',
});

// ============================================================================
// LEGACY AUTO-INJECT (wb-lazy.js only)
// ============================================================================
// A bare data-attribute fallback that pre-dates x-tooltip. wb-lazy.js applies
// it on its auto-inject path beside nativeMap; wb.js never has, and adding it
// there would change what wb.js pages do, so it is its own map rather than a
// nativeMap row. Moved here from a literal in wb-lazy.js (#831).

export const legacyLazyMap = {
  '[data-tooltip]': 'tooltip',
};

// ============================================================================
// PROPERTY ATTRIBUTES (plain attribute name -> behavior, no x- prefix)
// ============================================================================
// <button tooltip="Hi">, <span badge="success">, <button ripple>,
// <button toast-message="Saved">. A real, intentional feature, not legacy
// syntax. Separate from extensionMap because the semantics differ: the
// attribute carries no x- prefix, its VALUE is the behavior's content, and
// two of them are excluded from hosts that own the same attribute (below).
// Moved here from semantic-attributes.js (#831); both runtimes read it.

export const propertyMap = {
  tooltip: 'tooltip',
  'toast-message': 'toast',
  ripple: 'ripple',
  badge: 'badge',
};

// Every x-card* family tag treats `badge` AND `tooltip` as its own component
// props (composeCard renders `badge` as an internal .x-card__badge span, and
// wires `tooltip`/`hoverText` straight to the same themed tooltip.js behavior
// itself -- #283). The bare [badge]/[tooltip] selectors below would
// otherwise also match these cards, double-applying feedback.js's badge()
// on the card ROOT element (confirmed: a <article badge="NEW" variant="glass">
// picked up x-badge/x-badge--glass classes and collapsed to fit-content
// width instead of filling its grid column) -- and for `tooltip`, RACING
// composeCard()'s own tooltip wiring: this generic auto-inject calls tooltip()
// with no explicit content, so it falls back to reading the element's
// `title` attribute chain and, as a side effect, strips the native `title`
// attribute immediately. If that generic injection's dynamic import happened
// to resolve before card behavior's, composeCard() would then read an
// already-stripped `title` attribute and silently drop the card's heading
// (confirmed live: <article title="…" tooltip="…"> intermittently rendered
// with no header at all, depending on import timing). Excluded explicitly so
// card components keep sole ownership of their own `badge`/`tooltip`
// attributes.
export const CARD_TAGS = [
  'x-card', 'x-cardbutton', 'x-carddraggable', 'x-cardexpandable', 'x-cardfile',
  'x-cardhero', 'x-cardhorizontal', 'x-cardimage', 'x-cardlink', 'x-card-link',
  'x-cardminimizable', 'x-cardnotification', 'x-cardoverlay', 'x-cardportfolio',
  'x-cardpricing', 'x-cardproduct', 'x-cardprofile', 'x-cardstats',
  'x-cardtestimonial', 'x-cardvideo',
];
// #625/#626: the tag-based exclusion above only ever covered the x-card*
// CUSTOM TAGS -- it has no way to recognize a semantic
// <article x-behavior="card">/<article x-card>. Confirmed live:
// docs/components/cards/card.md's "Card anatomy" example, rewritten to
// <article x-behavior="card" badge="LIVE">, picked up x-badge/x-badge--live
// classes on the ROOT element. Both attribute forms (x-card, and the
// always-available generic x-behavior="card") are excluded too.
const CARD_BEHAVIOR_NAMES = ['card']; // extend as more card variants migrate to semantic HTML + x-behavior
// <article> is the third form, and the one the docs now use. It IS a card by
// auto-injection (nativeMap above), so it owns its own `badge` exactly as
// <x-card> and [x-card] do -- but it is not a card TAG and carries no x-card
// attribute, so neither existing exclusion caught it.
const CARD_TAG_EXCLUSIONS = CARD_TAGS.map(tag => `:not(${tag})`).join('')
  + ':not(article)'
  + CARD_BEHAVIOR_NAMES.map(b => `:not([x-behavior~="${b}"])`).join('')
  + CARD_BEHAVIOR_NAMES.map(b => `:not([x-${b}])`).join('');

const CARD_OWNED_ATTRIBUTES = ['badge', 'tooltip'];

// <header> renders its OWN `badge` (header.js builds .x-header__badge in
// .x-header__right), so the generic badge() must not also run on it: it
// re-read the header's `icon` and prepended a second .x-badge__icon, and
// used badge="v1.0" as a variant name (x-badge--v1.0 on the header root).
// Badge-only: header has no tooltip handling of its own, so it keeps the
// generic themed [tooltip].
const BADGE_ONLY_EXCLUSIONS = ':not(header)';

/**
 * { selector, behavior } pairs, one per propertyMap entry, ready to feed
 * straight into a `querySelectorAll(selector)` + inject loop.
 */
export const propertyMappings = Object.entries(propertyMap).map(([attr, behavior]) => ({
  selector: CARD_OWNED_ATTRIBUTES.includes(attr)
    ? `[${attr}]${CARD_TAG_EXCLUSIONS}${attr === 'badge' ? BADGE_ONLY_EXCLUSIONS : ''}`
    : `[${attr}]`,
  behavior,
}));

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
