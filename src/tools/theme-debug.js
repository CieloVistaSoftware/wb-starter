/*
 * theme-debug.js — non-invasive debugging helper for theme / FOUC issues
 * Usage (manual): paste into the console *before* the page does heavy runtime work,
 * or add as a DevTools Snippet and run, or load via <script src="/src/tools/theme-debug.js" defer></script> in a local debug build.
 *
 * This script does NOT change CSS. It instruments only and exposes a report at
 * `window.__wbThemeDebug.getReport()` and a short human-friendly `run()` helper.
 */
(function () {
  if (typeof window === 'undefined') return;
  if (window.__wbThemeDebug) return; // idempotent

  const writes = [];
  const reports = [];
  const start = Date.now();

  function captureStack() {
    try {
      const err = new Error();
      if (!err.stack) return null;
      // strip this function + helper frames
      return err.stack.split('\n').slice(2, 8).join('\n');
    } catch (e) {
      return null;
    }
  }

  // Patch setAttribute to capture explicit writes to data-theme
  const origSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    try {
      if (String(name) === 'data-theme') {
        writes.push({
          when: Date.now() - start,
          via: 'setAttribute',
          value: String(value),
          stack: captureStack(),
          element: this.tagName.toLowerCase()
        });
      }
    } catch (e) {}
    return origSetAttribute.apply(this, arguments);
  };

  // Proxy dataset to capture dataset.theme = '...' assignments
  const origDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'dataset');
  if (origDescriptor && typeof origDescriptor.get === 'function') {
    Object.defineProperty(HTMLElement.prototype, 'dataset', {
      get() {
        const ds = origDescriptor.get.call(this);
        return new Proxy(ds, {
          set(target, prop, val) {
            try {
              if (String(prop) === 'theme') {
                writes.push({
                  when: Date.now() - start,
                  via: 'dataset',
                  value: String(val),
                  stack: captureStack(),
                  element: this.tagName ? this.tagName.toLowerCase() : null
                });
              }
            } catch (e) {}
            target[prop] = val;
            return true;
          }
        });
      }
    });
  }

  // MutationObserver to record attribute changes (catch anything else)
  const mo = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.type === 'attributes' && m.attributeName === 'data-theme') {
        reports.push({
          when: Date.now() - start,
          old: m.oldValue,
          current: document.documentElement.getAttribute('data-theme'),
          snapshot: document.documentElement.getAttribute('data-theme'),
          node: 'html',
          stack: captureStack()
        });
      }
    }
  });
  try { mo.observe(document.documentElement, { attributes: true, attributeOldValue: true }); } catch (e) {}

  // Helper that checks stylesheet loading status and computed tokens
  function collectState() {
    const links = Array.from(document.querySelectorAll('link[rel~="stylesheet"]')).map(l => {
      let ok = null;
      try {
        ok = !!(l.sheet && l.sheet.cssRules && l.sheet.cssRules.length >= 0);
      } catch (err) {
        // cross-origin or not-yet-loaded
        ok = false;
      }
      return { href: l.getAttribute('href'), rel: l.getAttribute('rel'), loaded: ok };
    });

    const computed = (k) => {
      try { return getComputedStyle(document.documentElement).getPropertyValue(k).trim(); } catch (e) { return null; }
    };

    return {
      timestamp: Date.now(),
      initialDataTheme: document.documentElement.getAttribute('data-theme'),
      computedBg: computed('--bg-color'),
      colorScheme: computed('color-scheme') || null,
      links,
      localStorage: (function () {
        try { return { 'wb-theme': localStorage.getItem('wb-theme'), theme: localStorage.getItem('theme') }; } catch (e) { return { error: 'localStorage-unavailable' }; }
      })(),
      scripts: Array.from(document.scripts).map(s => ({ src: s.src || null, inline: !s.src, textSnippet: s.innerText && s.innerText.slice(0, 120) }))
    };
  }

  function prettyReport() {
    const state = collectState();
    return {
      summary: `data-theme="${state.initialDataTheme}" computed --bg-color: ${state.computedBg} color-scheme:${state.colorScheme}`,
      state,
      writes: writes.slice(),
      attributeReports: reports.slice()
    };
  }

  // Public API
  window.__wbThemeDebug = {
    run() {
      const r = prettyReport();
      console.group('WB Theme Debug — quick report');
      console.info('Summary:', r.summary);
      console.table(r.state.links);
      console.log('localStorage snapshot:', r.state.localStorage);
      if (r.writes.length) console.table(r.writes);
      if (r.attributeReports.length) console.table(r.attributeReports);
      console.groupEnd();
      return r;
    },
    getReport: () => prettyReport(),
    _internal: { writes, reports, collectState }
  };

  // Auto-run if called before first paint (useful when pasted in console)
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(() => window.__wbThemeDebug && window.__wbThemeDebug.run(), 20));
    } else {
      setTimeout(() => window.__wbThemeDebug && window.__wbThemeDebug.run(), 0);
    }
  } catch (e) {}
})();