/**
 * WB Behaviors Registry - Lazy Loading
 * =====================================
 * Behaviors are loaded on-demand when first used.
 * Each behavior group is loaded only once, then cached.
 * 
 * @version 2.1.1 (2025-12-21) - Fixed semantic module paths
 */

// Cache for loaded modules
const moduleCache = new Map();

// Track which behaviors are loading to prevent duplicate requests
const loadingPromises = new Map();

/**
 * Export name aliases
 * Maps behavior names to specific export names in the module
 */
const exportAliases = {
  switch: 'switchInput',
  image: 'img',
  figure: 'figure',
  ratio: 'ratio',
  'drawer-layout': 'drawerLayout',
  'sidebar-layout': 'sidebarlayout'
};

/**
 * Behavior → Module mapping
 * Maps behavior names to their module paths
 */
const behaviorModules = {
  // Hero → hero.js
  hero: 'hero',
  
  // Cards (19) → card.js
  card: 'card', cardimage: 'card', cardvideo: 'card', cardbutton: 'card',
  cardhero: 'card', cardprofile: 'card', cardpricing: 'card', cardstats: 'card',
  cardtestimonial: 'card', cardproduct: 'card', cardnotification: 'card',
  cardfile: 'card', cardlink: 'card', cardhorizontal: 'card', carddraggable: 'card',
  cardexpandable: 'card', cardminimizable: 'card', cardoverlay: 'card', cardportfolio: 'card',
  
  // UI Core
  demo: 'demo',
  progressbar: 'progressbar',
  modal: 'semantics/dialog',
  dialog: 'semantics/dialog',
  tooltip: 'tooltip',
  dropdown: 'dropdown',
  accordion: 'collapse',
  collapse: 'collapse',
  tabs: 'tabs',
  details: 'semantics/details',
  mdhtml: 'mdhtml',
  builder: 'builder',
  
  // Feedback (10) → feedback.js
  toast: 'feedback', badge: 'feedback', progress: 'feedback', spinner: 'feedback',
  avatar: 'feedback', chip: 'feedback', alert: 'feedback', skeleton: 'feedback',
  divider: 'feedback', breadcrumb: 'feedback', notify: 'feedback', pill: 'feedback',
  
  // Navigation (8) → navigation.js
  navbar: 'navigation', sidebar: 'navigation', menu: 'navigation',
  pagination: 'navigation', steps: 'navigation', treeview: 'navigation',
  backtotop: 'navigation', link: 'navigation', statusbar: 'navigation',
  
  // Header → header.js
  header: 'header',
  
  // Footer → footer.js
  footer: 'footer',
  
  // Data Display - Semantic HTML
  table: 'semantics/table',
  code: 'semantics/code',
  pre: 'semantics/pre',
  kbd: 'semantics/inline',
  mark: 'semantics/inline',
  json: 'semantics/json',
  timeline: 'semantics/timeline',
  stat: 'semantics/stat',
  list: 'semantics/list',
  desclist: 'semantics/desclist',
  empty: 'semantics/empty',
  
  // Media (10) → media.js
  image: 'media', gallery: 'media', video: 'media', audio: 'media',
  youtube: 'media', vimeo: 'media', embed: 'media', figure: 'media',
  carousel: 'media', ratio: 'media',
  
  // Overlays (8) → overlay.js
  popover: 'overlay', drawer: 'overlay', lightbox: 'overlay', offcanvas: 'overlay',
  sheet: 'overlay', confirm: 'overlay', prompt: 'overlay',
  
  // Form Inputs - Semantic HTML
  input: 'semantics/input',
  textarea: 'semantics/textarea',
  select: 'semantics/select',
  checkbox: 'semantics/checkbox',
  radio: 'semantics/radio',
  button: 'semantics/button',
  switch: 'semantics/switch',
  range: 'semantics/range',
  rating: 'semantics/rating',
  
  // Form Enhancements (13) → enhancements.js
  form: 'enhancements', fieldset: 'enhancements', label: 'enhancements',
  help: 'enhancements', error: 'enhancements', inputgroup: 'enhancements',
  formrow: 'enhancements', stepper: 'enhancements', search: 'enhancements',
  password: 'enhancements', masked: 'enhancements', counter: 'enhancements',
  floatinglabel: 'enhancements',
  otp: 'enhancements', colorpicker: 'enhancements', tags: 'enhancements',
  autocomplete: 'enhancements', file: 'enhancements',
  
  // Validation
  validator: 'validator',
  
  // Notes
  notes: 'notes',
  
  // Docs
  docsviewer: 'docs-viewer',
  
  // Animation (31) → effects.js
  animate: 'effects', fadein: 'effects', fadeout: 'effects', slidein: 'effects',
  slideout: 'effects', zoomin: 'effects', zoomout: 'effects', bounce: 'effects',
  shake: 'effects', pulse: 'effects', flip: 'effects', rotate: 'effects',
  swing: 'effects', tada: 'effects', wobble: 'effects', jello: 'effects',
  heartbeat: 'effects', flash: 'effects', rubberband: 'effects', typewriter: 'effects',
  countup: 'effects', parallax: 'effects', reveal: 'effects', marquee: 'effects',
  confetti: 'effects', sparkle: 'effects', glow: 'effects', rainbow: 'effects',
  fireworks: 'effects', snow: 'effects', particle: 'effects',
  
  // Layout (19) → layouts.js + standalone
  draggable: 'draggable',
  resizable: 'resizable',
  globe: 'globe',
  scrollalong: 'scrollalong',
  scrollProgress: 'scroll-progress',
  slider: 'slider',
  sticky: 'sticky',
  grid: 'layouts', flex: 'layouts', container: 'layouts', stack: 'layouts',
  cluster: 'layouts', center: 'layouts', sidebarlayout: 'layouts', 'sidebar-layout': 'layouts',
  switcher: 'layouts', masonry: 'layouts', fixed: 'layouts',
  scrollable: 'layouts', cover: 'layouts', frame: 'layouts', reel: 'layouts',
  imposter: 'layouts', icon: 'layouts', drawerLayout: 'layouts', 'drawer-layout': 'layouts',
  
  // Utility → helpers.js + standalone
  span: 'span',
  control: 'wb-control',
  repeater: 'wb-repeater',
  copy: 'copy',
  moveup: 'move', movedown: 'move', moveleft: 'move', moveright: 'move', moveall: 'move',
  toggle: 'toggle',
  ripple: 'ripple',
  darkmode: 'darkmode',
  themecontrol: 'themecontrol',
  codecontrol: 'codecontrol',
  lazy: 'helpers', print: 'helpers', share: 'helpers', fullscreen: 'helpers',
  hotkey: 'helpers', clipboard: 'helpers', scroll: 'helpers', truncate: 'helpers',
  highlight: 'helpers', external: 'helpers', countdown: 'helpers', clock: 'helpers',
  relativetime: 'helpers', offline: 'helpers', visible: 'helpers', debug: 'helpers'
};

/**
 * Load a module dynamically (with caching)
 * @param {string} moduleName - Name of the module file (without .js)
 * @returns {Promise<Object>} The loaded module exports
 */
async function loadModule(moduleName) {
  // Return cached module if available
  if (moduleCache.has(moduleName)) {
    return moduleCache.get(moduleName);
  }
  
  // Return existing promise if already loading
  if (loadingPromises.has(moduleName)) {
    return loadingPromises.get(moduleName);
  }
  
  // Create loading promise
  const loadPromise = import(`./${moduleName}.js`)
    .then(module => {
      moduleCache.set(moduleName, module);
      loadingPromises.delete(moduleName);
      console.log(`[WB] Loaded module: ${moduleName}.js`);
      return module;
    })
    .catch(error => {
      loadingPromises.delete(moduleName);
      console.error(`[WB] Failed to load module: ${moduleName}.js`, error);
      throw error;
    });
  
  loadingPromises.set(moduleName, loadPromise);
  return loadPromise;
}

/**
 * Get a behavior function (lazy loads if needed)
 * @param {string} name - Behavior name
 * @returns {Promise<Function>} The behavior function
 */
export async function getBehavior(name) {
  const moduleName = behaviorModules[name];
  
  if (!moduleName) {
    throw new Error(`[WB] Unknown behavior: ${name}`);
  }
  
  const module = await loadModule(moduleName);
  
  // Determine export name (check aliases first, then use behavior name)
  const exportName = exportAliases[name] || name;
  
  if (!module[exportName]) {
    // Try default export
    if (module.default) {
      if (typeof module.default === 'function') {
        return module.default;
      }
      // If default is an object, look for the export name inside it
      if (typeof module.default === 'object' && module.default[exportName]) {
        return module.default[exportName];
      }
    }
    throw new Error(`[WB] Behavior '${name}' not found in module '${moduleName}' (looked for export '${exportName}')`);
  }
  
  return module[exportName];
}

/**
 * Check if a behavior exists
 * @param {string} name - Behavior name
 * @returns {boolean}
 */
export function hasBehavior(name) {
  return name in behaviorModules;
}

/**
 * Get list of all available behaviors
 * @returns {string[]}
 */
export function listBehaviors() {
  return Object.keys(behaviorModules);
}

/**
 * Preload specific behaviors (for critical path)
 * @param {string[]} names - Array of behavior names to preload
 */
export async function preloadBehaviors(names) {
  const modules = new Set(names.map(name => behaviorModules[name]).filter(Boolean));
  await Promise.all([...modules].map(loadModule));
}

/**
 * Get cache stats
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
  return {
    loaded: moduleCache.size,
    loading: loadingPromises.size,
    modules: [...moduleCache.keys()]
  };
}

// Export behaviorModules for WB.behaviors compatibility
export { behaviorModules };

// For backward compatibility - proxy object that lazy loads
export const behaviors = new Proxy({}, {
  get(target, prop) {
    if (prop === 'then') return undefined; // Not a promise
    if (typeof prop !== 'string') return undefined;
    
    // Return a wrapper that loads on demand
    return async (element, options) => {
      const fn = await getBehavior(prop);
      return fn(element, options);
    };
  },
  has(target, prop) {
    return prop in behaviorModules;
  },
  ownKeys() {
    return Object.keys(behaviorModules);
  },
  getOwnPropertyDescriptor(target, prop) {
    if (prop in behaviorModules) {
      return { enumerable: true, configurable: true };
    }
  }
});

export default behaviors;
