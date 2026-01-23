/**
 * WB Bootstrap - Single Entry Point Initialization
 * =================================================
 * Eliminates boilerplate by providing one-line initialization for
 * WB behaviors, WB Views, and required stylesheets.
 * 
 * Usage (Auto-Init - Recommended):
 *   <script type="module" src="/src/core/wb-bootstrap.js"></script>
 * 
 * Usage (With Options via data attributes):
 *   <script type="module" src="/src/core/wb-bootstrap.js"
 *           debug
 *           registry="/src/wb-views/partials-registry.json">
 *   </script>
 * 
 * Usage (Manual):
 *   import { bootstrap } from "/src/core/wb-bootstrap.js";
 *   await bootstrap({ debug: true, registry: '/path/to/registry.json' });
 * 
 * @version 1.1.0
 * @license MIT
 */

import WB from "./wb-lazy.js";
import { initViews } from "./wb-views.js";

/**
 * Resolve a path relative to the bootstrap script location
 * @param {string} relativePath - Path relative to src/core/
 * @returns {string} Resolved path
 */
function resolveFromScript(relativePath) {
    const script = document.currentScript || document.querySelector('script[src*="wb-bootstrap"]');
    if (!script?.src) return relativePath;
    
    const scriptUrl = new URL(script.src);
    const baseUrl = new URL('./', scriptUrl);
    return new URL(relativePath, baseUrl).pathname;
}

/**
 * Inject CSS stylesheet into document head
 * @param {string} href - Path to CSS file
 * @returns {Promise<void>} Resolves when CSS is loaded
 */
function injectCSS(href) {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        const existing = document.querySelector(`link[href="${href}"]`);
        if (existing) {
            resolve();
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
        
        // Insert at beginning of head for proper cascade
        const firstLink = document.head.querySelector('link[rel="stylesheet"]');
        if (firstLink) {
            document.head.insertBefore(link, firstLink);
        } else {
            document.head.appendChild(link);
        }
    });
}

/**
 * Default configuration
 */
const defaults = {
    debug: false,
    scan: true,
    observe: true,
    autoInject: false,
    registry: '/src/wb-views/partials-registry.json',         // Path to views registry JSON
    preload: [],            // Behaviors to preload
    theme: null,            // Theme name
    css: true,              // true = auto-load site.css, string/array = custom paths, false = none
    cssBase: '../styles/'   // Base path for CSS (relative to src/core/)
};

/**
 * Bootstrap the WB Behaviors
 * @param {Object} options - Configuration options
 * @returns {Promise<{WB: Object, Views: Object}>} Initialized modules
 */
export async function bootstrap(options = {}) {
    const config = { ...defaults, ...options };
    
    try {
        // 1. Inject CSS first (before any rendering)
        if (config.css !== false) {
            const cssPaths = [];
            
            if (config.css === true) {
                // Default: load site.css (which imports themes.css)
                cssPaths.push(resolveFromScript(`${config.cssBase}site.css`));
            } else if (typeof config.css === 'string') {
                cssPaths.push(config.css);
            } else if (Array.isArray(config.css)) {
                cssPaths.push(...config.css);
            }
            
            await Promise.all(cssPaths.map(href => injectCSS(href)));
            
            if (config.debug) {
                console.log('[WB Bootstrap] 🎨 CSS loaded:', cssPaths);
            }
        }

        // 2. Initialize WB core
        await WB.init({
            scan: config.scan,
            observe: config.observe,
            debug: config.debug,
            autoInject: config.autoInject,
            theme: config.theme,
            preload: config.preload
        });

        // 3. Initialize Views if registry provided or DOM templates exist
        if (config.registry || document.querySelector('template[wb-view]')) {
            await initViews({
                registry: config.registry
            });
        }

        if (config.debug) {
            console.log('[WB Bootstrap] ✅ Framework ready', config);
        }

        return { WB, initViews };

    } catch (error) {
        console.error('[WB Bootstrap] ❌ Initialization failed:', error);
        throw error;
    }
}

/**
 * Parse configuration from script tag data attributes
 * @returns {Object} Parsed options
 */
function parseScriptOptions() {
    const script = document.currentScript;
    if (!script) return {};

    const options = {};

    // Boolean flags (presence = true)
    if (script.hasAttribute('data-debug')) options.debug = true;
    if (script.hasAttribute('data-auto-inject')) options.autoInject = true;
    if (script.hasAttribute('data-no-scan')) options.scan = false;
    if (script.hasAttribute('data-no-observe')) options.observe = false;
    if (script.hasAttribute('data-no-css')) options.css = false;

    // String values
    if (script.dataset.registry) options.registry = script.dataset.registry;
    if (script.dataset.theme) options.theme = script.dataset.theme;
    if (script.dataset.cssBase) options.cssBase = script.dataset.cssBase;

    // CSS can be a single path or comma-separated list
    if (script.dataset.css) {
        const cssPaths = script.dataset.css.split(',').map(s => s.trim());
        options.css = cssPaths.length === 1 ? cssPaths[0] : cssPaths;
    }

    // Array values (comma-separated)
    if (script.dataset.preload) {
        options.preload = script.dataset.preload.split(',').map(s => s.trim());
    }

    return options;
}

/**
 * Auto-initialize when script loads
 * Respects no-auto-init attribute to disable
 */
const script = document.currentScript;
const noAutoInit = script?.hasAttribute('data-no-auto-init');

if (!noAutoInit) {
    const options = parseScriptOptions();
    
    // Wait for DOM if needed
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => bootstrap(options));
    } else {
        bootstrap(options);
    }
}

// Export for manual usage
export { WB, initViews };
export default bootstrap;
