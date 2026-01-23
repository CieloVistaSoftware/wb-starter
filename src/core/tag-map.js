/**
 * Tag Map - Custom Element to Behavior Mapping
 * =============================================
 * Maps <wb-*> custom element tags to their behavior names.
 * 
 * Pattern: <wb-{name}> → behavior '{name}'
 * 
 * @version 3.0.0
 * @see docs/architecture/ATTRIBUTE-NAMING-STANDARD.md
 */

/**
 * Components - Standalone custom elements (IS-A relationship)
 * Usage: <wb-card>, <wb-hero>, <wb-navbar>
 * 
 * These are full components that render their own DOM structure.
 */
export const components = new Set([
  // Hero
  'hero',
  
  // Cards (19)
  'card', 'cardimage', 'cardvideo', 'cardbutton', 'cardhero', 'cardprofile',
  'cardpricing', 'cardstats', 'cardtestimonial', 'cardproduct', 'cardnotification',
  'cardfile', 'cardlink', 'cardhorizontal', 'carddraggable', 'cardexpandable',
  'cardminimizable', 'cardoverlay', 'cardportfolio',
  
  // UI Core
  'demo', 'progressbar', 'modal', 'dialog', 'dropdown', 'accordion', 
  'collapse', 'tabs', 'tab', 'details', 'mdhtml', 'docs', 'builder',
  
  // Feedback (12)
  'toast', 'badge', 'progress', 'spinner', 'avatar', 'chip', 
  'alert', 'skeleton', 'divider', 'breadcrumb', 'notify', 'pill',
  
  // Navigation (8)
  'navbar', 'sidebar', 'menu', 'pagination', 'steps', 'treeview',
  'backtotop', 'link', 'statusbar', 'header', 'footer',
  
  // Data Display - Semantic
  'table', 'code', 'pre', 'kbd', 'mark', 'json', 'timeline', 
  'stat', 'list', 'desclist', 'empty',
  
  // Media (10)
  'image', 'gallery', 'video', 'audio', 'youtube', 'vimeo', 
  'embed', 'figure', 'carousel', 'ratio',
  
  // Overlays (7)
  'popover', 'drawer', 'lightbox', 'offcanvas', 'sheet', 'confirm', 'prompt',
  
  // Form Inputs - Semantic
  'input', 'textarea', 'select', 'checkbox', 'radio', 'button', 
  'switch', 'range', 'rating',
  
  // Form Enhancements (18)
  'form', 'fieldset', 'label', 'help', 'error', 'inputgroup',
  'formrow', 'stepper', 'search', 'password', 'masked', 'counter',
  'floatinglabel', 'otp', 'colorpicker', 'tags', 'autocomplete', 'file',
  
  // Utility components
  'validator', 'notes', 'issues', 'docsviewer',
  
  // Layout (19)
  'grid', 'flex', 'container', 'stack', 'cluster', 'center',
  'sidebarlayout', 'switcher', 'masonry', 'fixed', 'scrollable',
  'cover', 'frame', 'reel', 'imposter', 'icon', 'drawerlayout',
  
  // Other components
  'stagelight', 'span', 'control', 'repeater', 'features', 'globe'
]);

/**
 * Tag → Behavior mapping
 * Maps custom element tag names to behavior names
 * 
 * Format: 'wb-{tag}' → '{behavior}'
 */
export const tagMap = new Map();

// Auto-populate from components set
// Most follow the pattern: wb-card → card
for (const name of components) {
  tagMap.set(`wb-${name}`, name);
}

// Special case aliases (if tag name differs from behavior name)
// tagMap.set('wb-accordion', 'collapse'); // Example: alias

/**
 * Reverse lookup: Behavior → Tag
 */
export const behaviorToTag = new Map();

for (const [tag, behavior] of tagMap) {
  behaviorToTag.set(behavior, tag);
}

/**
 * Check if a tag is a known WB component
 * @param {string} tagName - Lowercase tag name (e.g., 'wb-card')
 * @returns {boolean}
 */
export function isComponent(tagName) {
  return tagMap.has(tagName.toLowerCase());
}

/**
 * Get behavior name for a tag
 * @param {string} tagName - Lowercase tag name (e.g., 'wb-card')
 * @returns {string|null} Behavior name or null
 */
export function getBehaviorForTag(tagName) {
  return tagMap.get(tagName.toLowerCase()) || null;
}

/**
 * Get tag name for a behavior
 * @param {string} behavior - Behavior name (e.g., 'card')
 * @returns {string|null} Tag name or null
 */
export function getTagForBehavior(behavior) {
  return behaviorToTag.get(behavior) || null;
}

/**
 * Get all component names
 * @returns {string[]} Array of component names
 */
export function listComponents() {
  return [...components];
}

export default {
  tagMap,
  behaviorToTag,
  components,
  isComponent,
  getBehaviorForTag,
  getTagForBehavior,
  listComponents
};
