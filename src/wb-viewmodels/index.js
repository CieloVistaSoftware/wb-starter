/**
 * WB Behaviors Registry - Lazy Loading
 * =====================================
 * Behaviors are loaded on-demand when first used.
 * Each behavior group is loaded only once, then cached.
 * 
 * @version 2.1.1 (2025-12-21) - Fixed semantic module paths
 */

// Debug logging — silent unless localStorage['wb-debug'] === '1'.
const WB_DEBUG = (() => { try { return localStorage.getItem('wb-debug') === '1'; } catch (e) { return false; } })();
const _wbClog = console.log.bind(console);
const dlog = (...args) => { if (WB_DEBUG) _wbClog(...args); };

// Cache for loaded modules
const moduleCache = new Map();

// Track which behaviors are loading to prevent duplicate requests
const loadingPromises = new Map();

// #513: a failure is memoized for a cooldown window so every caller in that
// window shares one error (and, via error.wbModuleLoadFailure below, one log
// entry in wb-lazy.js) instead of repeating the same failed request and the
// same console.error per element. The window expires rather than being
// permanent -- a module killed by a five-second network blip must recover
// on its own, not stay dead for the rest of the page's life.
const MODULE_FAILURE_COOLDOWN_MS = 5000;
const failedModules = new Map(); // moduleName -> { error, at }
const moduleImportRetries = 2;

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
  'sidebar-layout': 'sidebarlayout',
  // <wb-search> is a container tag, not an input — searchField() (search.js)
  // wraps/creates the child <input> and delegates to search(). See #279.
  searchfield: 'searchField',
  // x-copybutton (#291) — copy.js exports the function as `copyButton`
  // (camelCase), but the behavior/attribute name is lowercase `copybutton`.
  copybutton: 'copyButton'
};

/**
 * Behavior → Module mapping
 * Maps behavior names to their module paths
 */
const behaviorModules = {
  // Article / Articles List → article.js
  article: 'article', articles: 'article',

  // Hero → hero.js
  hero: 'hero',
  
  // Cards (19) → card.js
  card: 'card', cardimage: 'card', cardvideo: 'card', cardbutton: 'card',
  cardhero: 'card', cardprofile: 'card', cardpricing: 'card', cardstats: 'card',
  cardtestimonial: 'card', cardproduct: 'card', cardnotification: 'card',
  cardfile: 'card', cardlink: 'card', cardhorizontal: 'card', carddraggable: 'card',
  cardexpandable: 'card', cardminimizable: 'card', cardoverlay: 'card', cardportfolio: 'card',

  // Fix Card (#365) → fix-card.js. Own file, not part of card.js's
  // family -- a hand-rolled WBCard subclass that self-registers via
  // customElements.define(). Was never wired into this lazy-load registry
  // (nor tag-map.js's elementMap), so <wb-fix-card> never upgraded to the
  // real class and .data= silently did nothing. This entry + the matching
  // 'wb-fix-card' elementMap entry (tag-map.js) makes WB.scan() actually
  // import fix-card.js on first encounter, which is what runs the
  // customElements.define() side effect.
  'fix-card': 'fix-card',

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
  
  // Feedback (10) → feedback.js (progress moved to semantics/progress)
  toast: 'feedback', badge: 'feedback', spinner: 'feedback',
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
  progress: 'semantics/progress',
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
  // Diff (lightweight shim) — ensure registry consistency with data/behavior-inventory.json
  diff: 'semantics/diff',
  
  // Media — each in its own semantics/*.js file (media.js grab-bag retired)
  image: 'semantics/img', gallery: 'semantics/gallery', video: 'semantics/video',
  audio: 'semantics/audio', youtube: 'semantics/youtube', vimeo: 'semantics/vimeo',
  figure: 'semantics/figure', ratio: 'semantics/ratio',
  // embed/carousel deliberately NOT carried over — media.js never had a real
  // export for either (confirmed: no `export function embed`/`carousel`
  // anywhere in it), and neither is used anywhere in demos/ or pages/. Dead
  // registry entries pointing at a real-but-non-matching module; removed
  // rather than left dangling once media.js itself is deleted.
  
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
  
  // Form Enhancements (now standalone files)
  form: 'form',
  fieldset: 'fieldset',
  label: 'label',
  help: 'help',
  error: 'error',
  inputgroup: 'inputgroup',
  formrow: 'formrow',
  stepper: 'stepper',
  search: 'search',
  searchfield: 'search',
  password: 'password',
  masked: 'masked',
  counter: 'counter',
  floatinglabel: 'floatinglabel',
  otp: 'otp',
  colorpicker: 'colorpicker',
  tags: 'tags',
  autocomplete: 'autocomplete',
  file: 'file',
  
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
  stagelight: 'stagelight',
  span: 'span',
  control: 'wb-control',
  repeater: 'wb-repeater',
  copy: 'copy',
  // x-copybutton (#291) — overlays a positioned copy button on ANY element;
  // reuses copy.js's core clipboard-write logic (writeToClipboard()).
  copybutton: 'copy',
  // #344: 'move' itself (the <wb-move>/[x-move] container entry point) was
  // missing here entirely -- tag-map.js's elementMap/extensionMap already
  // mapped 'wb-move'/'x-move' to behavior name 'move', but with no key in
  // this table, getBehavior('move') threw "Unknown behavior: move" the
  // moment anything actually used the tag/attribute.
  move: 'move', moveup: 'move', movedown: 'move', moveleft: 'move', moveright: 'move', moveall: 'move',
  release: 'release',
  toggle: 'toggle',
  ripple: 'ripple',
  darkmode: 'darkmode',
  themecontrol: 'themecontrol',
  codecolorcontrol: 'codecolorcontrol',
  codecontrol: 'codecontrol',
  lazy: 'helpers', print: 'helpers', share: 'helpers', fullscreen: 'helpers',
  hotkey: 'helpers', clipboard: 'helpers', scroll: 'helpers', truncate: 'helpers',
  highlight: 'helpers', external: 'helpers', countdown: 'helpers', clock: 'helpers',
  relativetime: 'helpers', offline: 'helpers', visible: 'helpers', debug: 'helpers',
  // Date & time pickers (shims)
  datepicker: 'semantics/datepicker',
  timepicker: 'semantics/timepicker',
  // Modifier: autosize
  autosize: 'autosize'
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

  // Within the cooldown, every caller shares the memoized failure -- no new
  // request, no new log entry. After it expires, fall through to a fresh
  // attempt below.
  const priorFailure = failedModules.get(moduleName);
  if (priorFailure && (Date.now() - priorFailure.at) < MODULE_FAILURE_COOLDOWN_MS) {
    return Promise.reject(priorFailure.error);
  }

  // Return existing promise if already loading
  if (loadingPromises.has(moduleName)) {
    return loadingPromises.get(moduleName);
  }

  // Create loading promise
  const moduleUrl = new URL(`./${moduleName}.js`, import.meta.url);
  const loadPromise = (async () => {
    let lastError;
    for (let attempt = 0; attempt <= moduleImportRetries; attempt++) {
      try {
        const attemptUrl = new URL(moduleUrl.href);
        // Cache-bust whenever this isn't the very first attempt ever made
        // for this module -- an unqualified re-import can resolve straight
        // from the browser's own module map, which remembers the failure
        // forever and never sends a new request. A timestamp (not a small
        // attempt counter) keeps the URL unique across separate post-cooldown
        // retries too, so it can't collide with a query string the browser
        // already has cached as failed.
        if (attempt > 0 || priorFailure) attemptUrl.searchParams.set('wb-retry', String(Date.now()));
        return await import(attemptUrl.href);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  })()
    .then(module => {
      moduleCache.set(moduleName, module);
      loadingPromises.delete(moduleName);
      failedModules.delete(moduleName);
      dlog(`[WB] Loaded module: ${moduleName}.js`);
      return module;
    })
    .catch(error => {
      loadingPromises.delete(moduleName);
      failedModules.set(moduleName, { error, at: Date.now() });
      if (error && typeof error === 'object') error.wbModuleLoadFailure = true;
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

    // Return a safe wrapper that loads on demand and NEVER lets exceptions
    // bubble out of the behavior invocation (prevents page/context crashes).
    return async (element, options) => {
      try {
        const fn = await getBehavior(prop).catch(err => {
          console.warn(`[WB] getBehavior failed for '${prop}':`, err && err.message ? err.message : err);
          return null;
        });
        if (!fn || typeof fn !== 'function') {
          // Behavior missing or invalid — mark element and return noop cleanup
          try { if (element) element.setAttribute('x-error', 'missing-behavior'); } catch (e) { /* best-effort */ }
          return () => {};
        }

        // The element can be removed from the DOM (page nav swaps innerHTML,
        // a demo/playground re-render, etc.) while the above `await
        // getBehavior()` was in flight — most behaviors assume
        // `element.parentNode` is non-null (they wrap the element via
        // `parentNode.insertBefore`), so applying to a detached element
        // throws deep inside the behavior instead of failing cleanly. Same
        // race, same fix, as wb-lazy.js's `inject()` (#297) — this is a
        // SEPARATE lazy-load choke point, not the same code path.
        if (element && !element.isConnected) {
          return () => {};
        }

        // Call the behavior inside a try/catch and handle Promise rejections
        try {
          const result = fn(element, options);
          if (result && typeof result.then === 'function') {
            return await result.catch(err => {
              console.error(`[WB] Behavior '${prop}' threw (async):`, err && err.message ? err.message : err);
              try { if (element) element.setAttribute('x-error', (err && err.message) || 'behavior-async-failed'); } catch (e) { /* best-effort */ }
              return () => {};
            });
          }
          return result;
        } catch (err) {
          console.error(`[WB] Behavior '${prop}' threw (sync):`, err && err.message ? err.message : err);
          try { if (element) element.setAttribute('x-error', (err && err.message) || 'behavior-sync-failed'); } catch (e) { /* best-effort */ }
          return () => {};
        }
      } catch (err) {
        console.error(`[WB] Unexpected error invoking behavior '${String(prop)}':`, err && err.message ? err.message : err);
        try { if (element) element.setAttribute('x-error', 'behavior-invocation-failed'); } catch (e) { /* best-effort */ }
        return () => {};
      }
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
