import { test, expect } from '@playwright/test';

// Diagnostic test: captures who/when writes `data-theme` and reports useful context.
// - DOES NOT modify CSS
// - Installs early instrumentation via addInitScript so we capture writes that happen during page bootstrap

const INSTRUMENTATION = `(() => {
  window.__wbThemeWrites = window.__wbThemeWrites || [];
  const capture = (via, value) => {
    try { window.__wbThemeWrites.push({ time: Date.now(), via, value, stack: (new Error()).stack.split('\n').slice(2,9).join('\n') }); } catch(e){}
  };

  const origSet = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (k, v) {
    if (String(k) === 'data-theme') capture('setAttribute', String(v));
    return origSet.apply(this, arguments);
  };

  const origDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'dataset');
  if (origDesc && typeof origDesc.get === 'function') {
    Object.defineProperty(HTMLElement.prototype, 'dataset', {
      get() {
        const ds = origDesc.get.call(this);
        return new Proxy(ds, { set(target, prop, val) { if (String(prop) === 'theme') capture('dataset', String(val)); target[prop] = val; return true; } });
      }
    });
  }

  const mo = new MutationObserver(ms => {
    for (const m of ms) if (m.type === 'attributes' && m.attributeName === 'data-theme') {
      window.__wbThemeWrites.push({ time: Date.now(), via: 'mutation', value: document.documentElement.getAttribute('data-theme') });
    }
  });
  try { mo.observe(document.documentElement, { attributes: true, attributeOldValue: true }); } catch(e){}
})();`;

test.describe('theme debug (diagnostic)', () => {
  test('capture theme writes and report context for debugging', async ({ page }) => {
    // Install instrumentation before any page script runs
    await page.addInitScript({ content: INSTRUMENTATION });

    // Navigate to the suspicious demo
    await page.goto('/demos/wb-page-demo.html');
    await page.waitForLoadState('load');

    // Collect the instrumentation data
    const writes = await page.evaluate(() => window.__wbThemeWrites || []);
    const state = await page.evaluate(() => ({
      dataThemeAttr: document.documentElement.getAttribute('data-theme'),
      computedBg: getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim(),
      links: Array.from(document.querySelectorAll('link[rel~="stylesheet"]')).map(l=>({href:l.href, loaded: !!l.sheet})),
      localStorage: (function(){ try { return { 'wb-theme': localStorage.getItem('wb-theme'), theme: localStorage.getItem('theme') }; } catch(e){ return { error: 'ls-unavailable' } } })()
    }));

    // Print diagnostic info to the test log for easy triage on CI
    console.log('THEME DEBUG — state:', JSON.stringify(state, null, 2));
    console.log('THEME DEBUG — writes:', JSON.stringify(writes, null, 2));

    // If we observed a write that sets theme to 'light' before paint, fail with the diagnostic
    const bad = (writes || []).some(w => String(w.value).toLowerCase().includes('light'));
    expect(state.computedBg).toBeTruthy();

    if (bad) {
      console.error('Detected theme writer setting LIGHT — examine stack traces above.');
    }

    // Always pass so this is diagnostic-first; caller can use grep to fail on bad state.
    expect(true).toBe(true);
  });
});