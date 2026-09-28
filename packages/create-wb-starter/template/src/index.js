// Main entry point for site logic
import WB from './core/wb-lazy.js';
import { NotesModal } from './core/notes-modal.js';

// Expose WB globally for debugging
window.WB = WB;

// Error handler logic
(function() {
  window.__WB_INITIALIZED__ = false;
  function logError(error, context) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'UNCAUGHT_ERROR',
      context: context,
      message: error.message || String(error),
      stack: error.stack,
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    try {
      const logs = JSON.parse(localStorage.getItem('wb_error_logs') || '[]');
      logs.push(logEntry);
      if (logs.length > 100) logs.shift();
      localStorage.setItem('wb_error_logs', JSON.stringify(logs));
      console.log('[ErrorHandler] Error logged to database:', logEntry);
    } catch (e) {
      console.error('[ErrorHandler] Failed to log:', e);
    }
  }
  function showError(message) {
    const loadingEl = document.querySelector('.site__loading');
    if (loadingEl) {
      const text = loadingEl.querySelector('p');
      // #779: the spinner is hidden and the message styled by
      // .site__loading.loading--error rules in site.css (added below), not by
      // style.display and style="" attributes.
      if (text) {
        text.innerHTML = `
          <span class="site__loading-icon">❌</span><br>
          <strong class="site__loading-title">Error loading</strong><br>
          <small class="site__loading-message">${message}</small><br>
          <small class="site__loading-note">This has been logged to our database.</small>
        `;
      }
      loadingEl.classList.add('loading--error');
    }
  }
  window.onerror = function(message, source, lineno, colno, error) {
    console.error('[GlobalError]', message, source, lineno);
    logError({ message, filename: source, lineno, colno, stack: error?.stack }, 'window.onerror');
    if (!window.__WB_INITIALIZED__) {
      showError(message);
    }
    return false;
  };
  window.onunhandledrejection = function(event) {
    console.error('[UnhandledRejection]', event.reason);
    logError({ message: String(event.reason), stack: event.reason?.stack }, 'unhandledrejection');
    if (!window.__WB_INITIALIZED__) {
      showError(String(event.reason));
    }
  };
  window.addEventListener('error', function(event) {
    if (event.target && (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
      const src = event.target.src || event.target.href;
      console.error('[ResourceError] Failed to load:', src);
      logError({ message: `Failed to load resource: ${src}` }, 'resource_error');
      if (!window.__WB_INITIALIZED__) {
        showError(`Failed to load: ${src}`);
      }
    }
  }, true);
})();

// Site boot logic (moved from index.html)
import WBSite from './core/site-engine.js';
const site = new WBSite();
site.init().then((initialized) => {
  window.__WB_INITIALIZED__ = true;
  // init() resolves false on standalone demo pages (demos/*.html load this
  // module directly and have no #app container), where it deliberately skips
  // loading config/site.json and rendering the shell. navigateTo() needs both,
  // so calling it unconditionally here threw "Cannot read properties of null
  // (reading 'navigationMenu')" on every load of those pages (#511).
  if (initialized) {
    site.navigateTo(site.currentPage);
  }
});
window.WBSite = site;
