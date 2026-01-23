/**
 * WB Framework - Application Bootstrap
 * Main entry point for the site
 * @module main
 */

// Global debug flag - set to true to see all logs
window.WB_DEBUG = false;

// Extend Window interface to include WB
/**
 * @typedef {import('./core/wb.js').default} WB
 * @typedef {import('./core/site-engine.js').default} WBSite
 */

/**
 * @type {Window & { WB?: WB, WBSite?: WBSite, WB_DEBUG?: boolean }}
 */
const _window = window;

import WB from './core/wb-lazy.js';
import WBSiteClass from './core/site-engine.js';

/**
 * Initialize the WB Framework application
 * @returns {Promise<void>}
 */
async function init() {
  console.log('[main] init() starting');
  if (_window.WB_DEBUG) console.log('🚀 WB Framework starting...');

  try {
    // Expose WB globally
    _window.WB = WB;

    // Boot the site
    /** @type {WBSite} */
    const site = new WBSiteClass();
    if (_window.WB_DEBUG) console.log('WBSite instance created');

    await site.init();
    if (_window.WB_DEBUG) console.log('site.init() complete');

    await site.navigateTo(site.currentPage);
    if (_window.WB_DEBUG) console.log('Navigation complete');

    // Expose for debugging
    _window.WBSite = site;

    if (_window.WB_DEBUG) console.log('✅ WB Framework ready');
  } catch (error) {
    console.error('❌ Site initialization failed:', error);
    console.error('Stack:', error.stack);

    const app = document.getElementById('app');
    const template = document.getElementById('error-template');

    if (app && template) {
      app.innerHTML = template.innerHTML;

      // Show the actual error
      const errorDiv = document.createElement('pre');
      errorDiv.style.cssText =
        'margin: 1rem; padding: 1rem; background: #1e1e1e; color: #f87171; border-radius: 8px; overflow: auto; font-size: 12px;';
      errorDiv.textContent = error.stack || error.message || String(error);
      app.appendChild(errorDiv);
    } else {
      // Fallback if app or template is missing
      alert(
        'Site initialization failed:\n' +
          (error.stack || error.message || String(error))
      );
    }
  }
}

// Ensure DOM is loaded before initializing
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
