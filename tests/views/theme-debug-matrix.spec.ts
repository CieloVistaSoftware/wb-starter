import { test, expect } from '@playwright/test';

const DEMOS = [
  '/demos/wb-page-demo.html',
  '/demos/kitchen-sink.html',
  '/demos/stage-light.html',
  '/demos/behaviors.html',
  '/demos/card.html',
  '/demos/code.html',
  '/demos/frameworks.html',
  '/demos/semantics-theme.html',
  '/demos/semantics-forms.html',
  '/demos/layout-test.html'
];

const INSTRUMENT = `(() => {
  // lightweight instrumentation (idempotent)
  if (window.__wbThemeDebugMatrix) return;
  window.__wbThemeDebugMatrix = { writes: [], reports: [] };
  const push = (obj) => window.__wbThemeDebugMatrix.writes.push(obj);
  const origSet = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (k, v) {
    if (String(k) === 'data-theme') push({ via: 'setAttribute', value: String(v), stack: (new Error()).stack });
    return origSet.apply(this, arguments);
  };
  const od = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'dataset');
  if (od && typeof od.get === 'function') {
    Object.defineProperty(HTMLElement.prototype, 'dataset', {
      get() {
        const ds = od.get.call(this);
        return new Proxy(ds, { set(target, prop, val) { if (String(prop) === 'theme') push({ via: 'dataset', value: String(val), stack: (new Error()).stack }); target[prop] = val; return true; } });
      }
    });
  }
  const mo = new MutationObserver(ms => { for (const m of ms) if (m.type === 'attributes' && m.attributeName === 'data-theme') window.__wbThemeDebugMatrix.reports.push({ when: Date.now(), old: m.oldValue, now: document.documentElement.getAttribute('data-theme') }); });
  try { mo.observe(document.documentElement, { attributes: true, attributeOldValue: true }); } catch(e){}
  window.__wbThemeDebugMatrix.collect = () => ({
    dataTheme: document.documentElement.getAttribute('data-theme'),
    computedBg: (() => { try { return getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim(); } catch(e){ return null; } })(),
    colorScheme: (() => { try { return getComputedStyle(document.documentElement).getPropertyValue('color-scheme').trim(); } catch(e){ return null; } })(),
    links: Array.from(document.querySelectorAll('link[rel~="stylesheet"]')).map(l=>({ href: l.getAttribute('href'), loaded: !!l.sheet })),
    localStorage: (function(){ try { return { 'wb-theme': localStorage.getItem('wb-theme'), theme: localStorage.getItem('theme') }; } catch(e) { return { error: 'ls-unavailable' }; } })(),
    writes: window.__wbThemeDebugMatrix.writes.slice(),
    attrReports: window.__wbThemeDebugMatrix.reports.slice()
  });
})();`;

test.describe('theme-debug matrix (top demos)', () => {
  for (const path of DEMOS) {
    test(path, async ({ page }) => {
      await page.addInitScript({ content: INSTRUMENT });
      await page.goto(path, { waitUntil: 'load' });

      const state = await page.evaluate(() => {
        if (window.__wbThemeDebugMatrix && typeof window.__wbThemeDebugMatrix.collect === 'function') {
          return window.__wbThemeDebugMatrix.collect();
        }
        return null;
      });

      // Print structured diagnostics to the test log
      console.log('THEME MATRIX —', path, JSON.stringify(state, null, 2));

      // Heuristics for problems
      const problems = [];
      if (!state) problems.push('no-instrumentation');
      else {
        if (!state.computedBg) problems.push('computed-bg-missing');
        if (!state.links || !state.links.some(l => /site\.css$/.test(l.href) && l.loaded)) problems.push('site-css-missing-or-not-loaded');
        const wroteLight = (state.writes || []).some(w => String(w.value).toLowerCase().includes('light'));
        if (wroteLight) problems.push('script-wrote-light');
        if (state.localStorage && (state.localStorage['wb-theme'] === 'light' || state.localStorage['theme'] === 'light')) problems.push('persisted-light');
      }

      if (problems.length) {
        console.error('THEME MATRIX — PROBLEMS for', path, problems.join(', '));
      } else {
        console.log('THEME MATRIX — OK for', path);
      }

      // Always pass the test (diagnostic only)
      expect(true).toBe(true);
    });
  }
});
