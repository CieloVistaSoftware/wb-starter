/**
 * wb-starter - Application Bootstrap
 * Main entry point for the site
 * @module main
 */


// Extend Window interface to include WB
/**
 * @typedef {import('./core/wb.js').default} WB
 * @typedef {import('./core/site-engine.js').default} WBSite
 */

/**
 * @type {Window & { WB?: WB, WBSite?: WBSite }}
 */
const _window = window;

import WB from './core/wb.js';
import WBSiteClass from './core/site-engine.js';
import { VERSION } from './core/version.js';
import { traceStatusLabel } from './core/debug-trace.js';

/**
 * Initialize the wb-starter application
 * @returns {Promise<void>}
 */
async function init() {
  // Commit + build time on the very first line — the console log itself is
  // the fastest way to confirm which deploy you're actually looking at,
  // without digging through the header or network tab.
  console.log(`🚀 wb-starter starting... v${VERSION.version} (${VERSION.commit}, built ${VERSION.builtAt})`);
  // Debug it via tracing, not guessing: always show whether [WB.scan]/
  // [WB.observe] trace output is active, right on the 2nd console line, so
  // it's never a guessing game whether logging is on before you go looking
  // for trace output that isn't there. #338: 'wb-debug' can now name a
  // comma-separated set of categories (e.g. 'media,scan') instead of just
  // '1' for everything — see debug-trace.js.
  console.log(`[WB] debug tracing: ${traceStatusLabel()} — localStorage.setItem('wb-debug','1') for everything, or e.g. 'scan,observe' for just those categories, then reload. Or live: wbDebugTrace.set('scan,observe')`);

  try {
    // Expose WB globally
    _window.WB = WB;

    // Boot the site
    /** @type {WBSite} */
    const site = new WBSiteClass();
    console.log('WBSite instance created');

    await site.init();
    console.log('site.init() complete');

    await site.navigateTo(site.currentPage);
    console.log('Navigation complete');

    // Expose for debugging
    _window.WBSite = site;

    console.log('✅ wb-starter ready');
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

// Network-first service worker — required so the installed/standalone PWA
// (manifest.json sets display:standalone) actually checks for fresh code on
// each load instead of relying solely on the OS webview's own cache
// heuristics, which can hold stale assets far longer than a browser tab.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Derive both the script URL and its scope from wherever main.js
    // actually loaded from, rather than hardcoding a path — correct on
    // both local dev (served from origin root) and GitHub Pages (served
    // under /wb-starter/) without an environment check. (#316, #318)
    const swUrl = new URL('../sw.js', import.meta.url);
    navigator.serviceWorker
      .register(swUrl, { scope: new URL('.', swUrl).href })
      .catch((err) =>
        console.warn("[sw] registration failed:", err && err.message),
      );
  });
}
