/**
 * Feature Detection
 * =================
 * Modern feature detection for progressive enhancement.
 * Use this instead of browser detection (UA sniffing).
 * 
 * Usage:
 *   import { features, supports, detectAll } from './features.js';
 *   
 *   if (features.resizeObserver) {
 *     // Use ResizeObserver
 *   }
 *   
 *   if (supports.css('container-type', 'inline-size')) {
 *     // Use container queries
 *   }
 * 
 * @version 1.0.0
 */

/**
 * Detected browser features (computed once on load)
 */
export const features = {
  // Observers
  resizeObserver: typeof ResizeObserver !== 'undefined',
  intersectionObserver: typeof IntersectionObserver !== 'undefined',
  mutationObserver: typeof MutationObserver !== 'undefined',
  performanceObserver: typeof PerformanceObserver !== 'undefined',
  
  // Modern APIs
  customElements: 'customElements' in window,
  shadowDOM: 'attachShadow' in Element.prototype,
  templates: 'content' in document.createElement('template'),
  slots: 'assignedSlot' in document.createElement('span'),
  
  // Storage
  localStorage: (() => {
    try {
      localStorage.setItem('__test', '1');
      localStorage.removeItem('__test');
      return true;
    } catch { return false; }
  })(),
  sessionStorage: (() => {
    try {
      sessionStorage.setItem('__test', '1');
      sessionStorage.removeItem('__test');
      return true;
    } catch { return false; }
  })(),
  indexedDB: typeof indexedDB !== 'undefined',
  
  // Media
  webp: false, // Set async below
  avif: false, // Set async below
  
  // Input
  touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  pointer: 'PointerEvent' in window,
  hover: window.matchMedia?.('(hover: hover)').matches ?? true,
  
  // Network
  serviceWorker: 'serviceWorker' in navigator,
  fetch: typeof fetch !== 'undefined',
  streams: typeof ReadableStream !== 'undefined',
  
  // Performance
  requestIdleCallback: typeof requestIdleCallback !== 'undefined',
  scheduler: 'scheduler' in window,
  
  // View
  viewTransitions: 'startViewTransition' in document,
  scrollTimeline: typeof ScrollTimeline !== 'undefined',
  popover: 'popover' in HTMLElement.prototype,
  dialog: typeof HTMLDialogElement !== 'undefined',
  
  // Clipboard
  clipboard: 'clipboard' in navigator,
  clipboardWrite: 'clipboard' in navigator && 'write' in navigator.clipboard,
  
  // Other
  webGL: (() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch { return false; }
  })(),
  webGL2: (() => {
    try {
      return !!document.createElement('canvas').getContext('webgl2');
    } catch { return false; }
  })(),
  webWorker: typeof Worker !== 'undefined',
  sharedWorker: typeof SharedWorker !== 'undefined',
  webSocket: typeof WebSocket !== 'undefined',
  
  // File
  fileReader: typeof FileReader !== 'undefined',
  fileSystemAccess: 'showOpenFilePicker' in window,
  
  // Sensors
  geolocation: 'geolocation' in navigator,
  deviceOrientation: 'DeviceOrientationEvent' in window,
  
  // Fullscreen
  fullscreen: document.fullscreenEnabled || document.webkitFullscreenEnabled || false
};

// Async image format detection
(async () => {
  // WebP detection
  const webpTest = new Image();
  webpTest.src = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
  webpTest.onload = () => { features.webp = webpTest.width === 1; };
  webpTest.onerror = () => { features.webp = false; };
  
  // AVIF detection  
  const avifTest = new Image();
  avifTest.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgABpAQ0AIQywgAAAAI+P/+Xz6kIA==';
  avifTest.onload = () => { features.avif = avifTest.width === 2; };
  avifTest.onerror = () => { features.avif = false; };
})();

/**
 * CSS Feature Detection
 */
export const supports = {
  /**
   * Check CSS property/value support
   * @param {string} property - CSS property
   * @param {string} value - CSS value
   * @returns {boolean}
   */
  css(property, value) {
    if (typeof CSS !== 'undefined' && CSS.supports) {
      return CSS.supports(property, value);
    }
    // Fallback
    const el = document.createElement('div');
    el.style[property] = value;
    return el.style[property] === value;
  },
  
  /**
   * Check @supports rule
   * @param {string} condition - Full @supports condition string
   * @returns {boolean}
   */
  cssRule(condition) {
    if (typeof CSS !== 'undefined' && CSS.supports) {
      return CSS.supports(condition);
    }
    return false;
  }
};

/**
 * Common CSS feature checks
 */
export const cssFeatures = {
  grid: supports.css('display', 'grid'),
  subgrid: supports.css('grid-template-columns', 'subgrid'),
  flexGap: supports.css('gap', '1px'),
  containerQueries: supports.css('container-type', 'inline-size'),
  hasSelector: supports.cssRule('selector(:has(*))'),
  layerRule: supports.cssRule('@layer test'),
  nestingSelector: supports.css('selector(&)') || supports.cssRule('selector(&)'),
  colorMix: supports.css('color', 'color-mix(in srgb, red, blue)'),
  oklch: supports.css('color', 'oklch(50% 0.2 240)'),
  aspectRatio: supports.css('aspect-ratio', '1'),
  scrollSnapStop: supports.css('scroll-snap-stop', 'always'),
  overscrollBehavior: supports.css('overscroll-behavior', 'contain'),
  textWrap: supports.css('text-wrap', 'balance'),
  viewTransitions: supports.cssRule('@view-transition'),
  anchorPositioning: supports.css('anchor-name', '--test'),
  startingStyle: supports.cssRule('@starting-style')
};

/**
 * Environment/context detection
 */
export const environment = {
  // Platform
  isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
  isAndroid: /Android/.test(navigator.userAgent),
  isMac: /Mac/.test(navigator.platform),
  isWindows: /Win/.test(navigator.platform),
  
  // Context
  isSecureContext: window.isSecureContext,
  isStandalone: window.matchMedia('(display-mode: standalone)').matches,
  isIframe: window !== window.top,
  
  // Preferences
  prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  prefersHighContrast: window.matchMedia('(prefers-contrast: more)').matches,
  
  // Connection (if available)
  get connectionType() {
    return navigator.connection?.effectiveType || 'unknown';
  },
  get saveData() {
    return navigator.connection?.saveData || false;
  }
};

/**
 * Detect all features and return summary
 * @returns {{ features: object, css: object, environment: object }}
 */
export function detectAll() {
  return {
    features: { ...features },
    css: { ...cssFeatures },
    environment: { ...environment }
  };
}

/**
 * Log feature detection results to console (for debugging)
 */
export function logFeatures() {
  console.group('🔍 Feature Detection');
  
  console.group('Browser Features');
  Object.entries(features).forEach(([key, value]) => {
    console.log(`${value ? '✅' : '❌'} ${key}`);
  });
  console.groupEnd();
  
  console.group('CSS Features');
  Object.entries(cssFeatures).forEach(([key, value]) => {
    console.log(`${value ? '✅' : '❌'} ${key}`);
  });
  console.groupEnd();
  
  console.group('Environment');
  Object.entries(environment).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });
  console.groupEnd();
  
  console.groupEnd();
}

export default { features, supports, cssFeatures, environment, detectAll, logFeatures };
