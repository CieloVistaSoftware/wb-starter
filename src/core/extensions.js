/**
 * Extensions Registry - x-* Attribute Behaviors
 * ==============================================
 * Manages extension behaviors that can be applied to any element.
 * 
 * Two types:
 * 1. Decorations (HAS-A) - Add capability: x-ripple, x-tooltip
 * 2. Morphs (BECOMES) - Transform element: x-as-card, x-as-timeline
 * 
 * @version 3.0.0
 * @see docs/architecture/ATTRIBUTE-NAMING-STANDARD.md
 */

/**
 * Extension types
 */
export const ExtensionType = {
  DECORATION: 'decoration',  // HAS-A: adds capability to element
  MORPH: 'morph'             // BECOMES: transforms element into component
};

/**
 * Extension definitions
 * 
 * Each extension has:
 * - type: 'decoration' or 'morph'
 * - module: module path (for lazy loading)
 * - behavior: behavior name (for morphs, references component behavior)
 * - description: human-readable description
 */
export const extensions = {
  // ═══════════════════════════════════════════════════════════════════
  // DECORATIONS - Add capability to any element (HAS-A relationship)
  // Usage: <button x-ripple>, <img x-lazy>, <div x-animate="bounce">
  // ═══════════════════════════════════════════════════════════════════
  
  // Visual Effects (31)
  'ripple':      { type: ExtensionType.DECORATION, module: 'ripple', description: 'Material ripple effect on click' },
  'animate':     { type: ExtensionType.DECORATION, module: 'effects', description: 'Generic animation trigger' },
  'fadein':      { type: ExtensionType.DECORATION, module: 'effects', description: 'Fade in animation' },
  'fadeout':     { type: ExtensionType.DECORATION, module: 'effects', description: 'Fade out animation' },
  'slidein':     { type: ExtensionType.DECORATION, module: 'effects', description: 'Slide in animation' },
  'slideout':    { type: ExtensionType.DECORATION, module: 'effects', description: 'Slide out animation' },
  'zoomin':      { type: ExtensionType.DECORATION, module: 'effects', description: 'Zoom in animation' },
  'zoomout':     { type: ExtensionType.DECORATION, module: 'effects', description: 'Zoom out animation' },
  'bounce':      { type: ExtensionType.DECORATION, module: 'effects', description: 'Bounce animation' },
  'shake':       { type: ExtensionType.DECORATION, module: 'effects', description: 'Shake animation' },
  'pulse':       { type: ExtensionType.DECORATION, module: 'effects', description: 'Pulse animation' },
  'flip':        { type: ExtensionType.DECORATION, module: 'effects', description: 'Flip animation' },
  'rotate':      { type: ExtensionType.DECORATION, module: 'effects', description: 'Rotate animation' },
  'swing':       { type: ExtensionType.DECORATION, module: 'effects', description: 'Swing animation' },
  'tada':        { type: ExtensionType.DECORATION, module: 'effects', description: 'Tada attention animation' },
  'wobble':      { type: ExtensionType.DECORATION, module: 'effects', description: 'Wobble animation' },
  'jello':       { type: ExtensionType.DECORATION, module: 'effects', description: 'Jello animation' },
  'heartbeat':   { type: ExtensionType.DECORATION, module: 'effects', description: 'Heartbeat animation' },
  'flash':       { type: ExtensionType.DECORATION, module: 'effects', description: 'Flash animation' },
  'rubberband':  { type: ExtensionType.DECORATION, module: 'effects', description: 'Rubberband animation' },
  'typewriter':  { type: ExtensionType.DECORATION, module: 'effects', description: 'Typewriter text effect' },
  'countup':     { type: ExtensionType.DECORATION, module: 'effects', description: 'Count up number animation' },
  'parallax':    { type: ExtensionType.DECORATION, module: 'effects', description: 'Parallax scroll effect' },
  'reveal':      { type: ExtensionType.DECORATION, module: 'effects', description: 'Scroll reveal animation' },
  'marquee':     { type: ExtensionType.DECORATION, module: 'effects', description: 'Marquee scrolling text' },
  'confetti':    { type: ExtensionType.DECORATION, module: 'effects', description: 'Confetti celebration effect' },
  'sparkle':     { type: ExtensionType.DECORATION, module: 'effects', description: 'Sparkle effect' },
  'glow':        { type: ExtensionType.DECORATION, module: 'effects', description: 'Glow effect' },
  'rainbow':     { type: ExtensionType.DECORATION, module: 'effects', description: 'Rainbow color cycle' },
  'fireworks':   { type: ExtensionType.DECORATION, module: 'effects', description: 'Fireworks effect' },
  'snow':        { type: ExtensionType.DECORATION, module: 'effects', description: 'Falling snow effect' },
  'particle':    { type: ExtensionType.DECORATION, module: 'effects', description: 'Particle effect' },
  
  // Interaction
  'tooltip':     { type: ExtensionType.DECORATION, module: 'tooltip', description: 'Tooltip on hover' },
  'draggable':   { type: ExtensionType.DECORATION, module: 'draggable', description: 'Make element draggable' },
  'resizable':   { type: ExtensionType.DECORATION, module: 'resizable', description: 'Make element resizable' },
  'copy':        { type: ExtensionType.DECORATION, module: 'copy', description: 'Copy to clipboard on click' },
  'toggle':      { type: ExtensionType.DECORATION, module: 'toggle', description: 'Toggle visibility/state' },
  'reorder':     { type: ExtensionType.DECORATION, module: 'reorder', description: 'Drag to reorder items' },
  
  // Movement
  'moveup':      { type: ExtensionType.DECORATION, module: 'move', description: 'Move element up' },
  'movedown':    { type: ExtensionType.DECORATION, module: 'move', description: 'Move element down' },
  'moveleft':    { type: ExtensionType.DECORATION, module: 'move', description: 'Move element left' },
  'moveright':   { type: ExtensionType.DECORATION, module: 'move', description: 'Move element right' },
  'moveall':     { type: ExtensionType.DECORATION, module: 'move', description: 'Move element in any direction' },
  
  // Scroll behaviors
  'scrollalong': { type: ExtensionType.DECORATION, module: 'scrollalong', description: 'Scroll-linked movement' },
  'scrollProgress': { type: ExtensionType.DECORATION, module: 'scroll-progress', description: 'Scroll progress indicator' },
  'sticky':      { type: ExtensionType.DECORATION, module: 'sticky', description: 'Sticky positioning' },
  'scroll':      { type: ExtensionType.DECORATION, module: 'helpers', description: 'Smooth scroll behavior' },
  
  // Media
  'lazy':        { type: ExtensionType.DECORATION, module: 'helpers', description: 'Lazy load images/content' },
  
  // Utility
  'print':       { type: ExtensionType.DECORATION, module: 'helpers', description: 'Print element' },
  'share':       { type: ExtensionType.DECORATION, module: 'helpers', description: 'Share via Web Share API' },
  'fullscreen':  { type: ExtensionType.DECORATION, module: 'helpers', description: 'Toggle fullscreen' },
  'hotkey':      { type: ExtensionType.DECORATION, module: 'helpers', description: 'Keyboard shortcut binding' },
  'clipboard':   { type: ExtensionType.DECORATION, module: 'helpers', description: 'Clipboard operations' },
  'truncate':    { type: ExtensionType.DECORATION, module: 'helpers', description: 'Truncate text with ellipsis' },
  'highlight':   { type: ExtensionType.DECORATION, module: 'helpers', description: 'Highlight text matches' },
  'external':    { type: ExtensionType.DECORATION, module: 'helpers', description: 'External link indicator' },
  'countdown':   { type: ExtensionType.DECORATION, module: 'helpers', description: 'Countdown timer' },
  'clock':       { type: ExtensionType.DECORATION, module: 'helpers', description: 'Live clock display' },
  'relativetime': { type: ExtensionType.DECORATION, module: 'helpers', description: 'Relative time display' },
  'offline':     { type: ExtensionType.DECORATION, module: 'helpers', description: 'Offline indicator' },
  'visible':     { type: ExtensionType.DECORATION, module: 'helpers', description: 'Visibility detection' },
  'debug':       { type: ExtensionType.DECORATION, module: 'helpers', description: 'Debug info overlay' },
  
  // Theme/Control
  'darkmode':    { type: ExtensionType.DECORATION, module: 'darkmode', description: 'Dark mode toggle' },
  'themecontrol': { type: ExtensionType.DECORATION, module: 'themecontrol', description: 'Theme control panel' },
  'codecontrol': { type: ExtensionType.DECORATION, module: 'codecontrol', description: 'Code editor controls' },
  
  // ═══════════════════════════════════════════════════════════════════
  // MORPHS - Transform element into component (BECOMES relationship)
  // Usage: <article x-as-card>, <ul x-as-timeline>
  // ═══════════════════════════════════════════════════════════════════
  
  'as-card':       { type: ExtensionType.MORPH, behavior: 'card', description: 'Transform into card component' },
  'as-timeline':   { type: ExtensionType.MORPH, behavior: 'timeline', description: 'Transform into timeline' },
  'as-alert':      { type: ExtensionType.MORPH, behavior: 'alert', description: 'Transform into alert' },
  'as-badge':      { type: ExtensionType.MORPH, behavior: 'badge', description: 'Transform into badge' },
  'as-chip':       { type: ExtensionType.MORPH, behavior: 'chip', description: 'Transform into chip' },
  'as-pill':       { type: ExtensionType.MORPH, behavior: 'pill', description: 'Transform into pill' },
  'as-avatar':     { type: ExtensionType.MORPH, behavior: 'avatar', description: 'Transform into avatar' },
  'as-tooltip':    { type: ExtensionType.MORPH, behavior: 'tooltip', description: 'Transform into tooltip' },
  'as-tabs':       { type: ExtensionType.MORPH, behavior: 'tabs', description: 'Transform into tabs' },
  'as-accordion':  { type: ExtensionType.MORPH, behavior: 'accordion', description: 'Transform into accordion' },
  'as-collapse':   { type: ExtensionType.MORPH, behavior: 'collapse', description: 'Transform into collapse' },
  'as-dropdown':   { type: ExtensionType.MORPH, behavior: 'dropdown', description: 'Transform into dropdown' },
  'as-modal':      { type: ExtensionType.MORPH, behavior: 'modal', description: 'Transform into modal' },
  'as-drawer':     { type: ExtensionType.MORPH, behavior: 'drawer', description: 'Transform into drawer' },
  'as-popover':    { type: ExtensionType.MORPH, behavior: 'popover', description: 'Transform into popover' },
  'as-hero':       { type: ExtensionType.MORPH, behavior: 'hero', description: 'Transform into hero section' },
  'as-navbar':     { type: ExtensionType.MORPH, behavior: 'navbar', description: 'Transform into navbar' },
  'as-sidebar':    { type: ExtensionType.MORPH, behavior: 'sidebar', description: 'Transform into sidebar' },
  'as-footer':     { type: ExtensionType.MORPH, behavior: 'footer', description: 'Transform into footer' },
  'as-header':     { type: ExtensionType.MORPH, behavior: 'header', description: 'Transform into header' },
  'as-breadcrumb': { type: ExtensionType.MORPH, behavior: 'breadcrumb', description: 'Transform into breadcrumb' },
  'as-pagination': { type: ExtensionType.MORPH, behavior: 'pagination', description: 'Transform into pagination' },
  'as-steps':      { type: ExtensionType.MORPH, behavior: 'steps', description: 'Transform into steps' },
  'as-gallery':    { type: ExtensionType.MORPH, behavior: 'gallery', description: 'Transform into gallery' },
  'as-carousel':   { type: ExtensionType.MORPH, behavior: 'carousel', description: 'Transform into carousel' },
  'as-table':      { type: ExtensionType.MORPH, behavior: 'table', description: 'Transform into enhanced table' },
  'as-list':       { type: ExtensionType.MORPH, behavior: 'list', description: 'Transform into enhanced list' },
  'as-grid':       { type: ExtensionType.MORPH, behavior: 'grid', description: 'Transform into grid layout' },
  'as-masonry':    { type: ExtensionType.MORPH, behavior: 'masonry', description: 'Transform into masonry layout' }
};

/**
 * Get all extension names
 * @returns {string[]}
 */
export function listExtensions() {
  return Object.keys(extensions);
}

/**
 * Get all decoration names
 * @returns {string[]}
 */
export function listDecorations() {
  return Object.keys(extensions).filter(name => 
    extensions[name].type === ExtensionType.DECORATION
  );
}

/**
 * Get all morph names  
 * @returns {string[]}
 */
export function listMorphs() {
  return Object.keys(extensions).filter(name => 
    extensions[name].type === ExtensionType.MORPH
  );
}

/**
 * Check if an extension exists
 * @param {string} name - Extension name (without x- prefix)
 * @returns {boolean}
 */
export function hasExtension(name) {
  return name in extensions;
}

/**
 * Check if extension is a decoration
 * @param {string} name - Extension name
 * @returns {boolean}
 */
export function isDecoration(name) {
  return extensions[name]?.type === ExtensionType.DECORATION;
}

/**
 * Check if extension is a morph
 * @param {string} name - Extension name
 * @returns {boolean}
 */
export function isMorph(name) {
  return extensions[name]?.type === ExtensionType.MORPH;
}

/**
 * Get extension info
 * @param {string} name - Extension name
 * @returns {Object|null} Extension definition or null
 */
export function getExtension(name) {
  return extensions[name] || null;
}

/**
 * Get the behavior name for a morph extension
 * @param {string} name - Morph name (e.g., 'as-card')
 * @returns {string|null} Behavior name or null
 */
export function getMorphBehavior(name) {
  const ext = extensions[name];
  return ext?.type === ExtensionType.MORPH ? ext.behavior : null;
}

/**
 * Parse an x-* attribute name
 * @param {string} attrName - Full attribute name (e.g., 'x-ripple', 'x-as-card')
 * @param {string} prefix - Prefix to use (default: 'x')
 * @returns {{ name: string, type: string, behavior: string|null } | null}
 */
export function parseExtensionAttribute(attrName, prefix = 'x') {
  if (!attrName.startsWith(`${prefix}-`)) return null;
  
  const name = attrName.slice(prefix.length + 1); // Remove 'x-'
  const ext = extensions[name];
  
  if (!ext) return null;
  
  return {
    name,
    type: ext.type,
    behavior: ext.type === ExtensionType.MORPH ? ext.behavior : name
  };
}

export default {
  extensions,
  ExtensionType,
  listExtensions,
  listDecorations,
  listMorphs,
  hasExtension,
  isDecoration,
  isMorph,
  getExtension,
  getMorphBehavior,
  parseExtensionAttribute
};
