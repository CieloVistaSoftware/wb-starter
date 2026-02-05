import { test, expect } from '@playwright/test';

// Diagnostic: capture navigations, script resources and first writes during page load.
// Purpose: identify any navigation or synchronous script that destroys the initial
// execution context before our init-script instrumentation can run.

const INIT = `(() => {
  if (window.__wbLoadTimeline) return;
  window.__wbLoadTimeline = { writes: [], snapshots: [], navs: [] };
  const captureStack = () => { try { return (new Error()).stack.split('\n').slice(2,8).join('\n'); } catch(e){ return null; } };
  const origSet = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(k, v) {
    try { if (String(k) === 'data-theme') window.__wbLoadTimeline.writes.push({ when: performance.now(), via: 'setAttribute', value: String(v), stack: captureStack() }); } catch(e){}
    return origSet.apply(this, arguments);
  };
  const od = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'dataset');
  if (od && typeof od.get === 'function') {
    Object.defineProperty(HTMLElement.prototype, 'dataset', {
      get() {
        const ds = od.get.call(this);
        return new Proxy(ds, { set(target, prop, val) { try { if (String(prop) === 'theme') window.__wbLoadTimeline.writes.push({ when: performance.now(), via: 'dataset', value: String(val), stack: captureStack() }); } catch(e){} target[prop] = val; return true; } });
      }
    });
  }
  // Snapshot immediate computed token if available
  try { window.__wbLoadTimeline.snap0 = getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim(); } catch(e) { window.__wbLoadTimeline.snap0 = null; }
})();`;

test('wb-page load timeline (diagnostic)', async ({ page }) => {
  const navs = [];
  page.on('framenavigated', frame => navs.push({ url: frame.url(), time: Date.now() }));
  page.on('request', req => {
    if (req.resourceType() === 'document' || req.resourceType() === 'script') {
      console.log('REQ', req.method(), req.resourceType(), req.url());
    }
  });

  await page.addInitScript({ content: INIT });

  await page.goto('/demos/wb-page-demo.html', { waitUntil: 'load' });

  const report = await page.evaluate(() => {
    try {
      const scripts = Array.from(document.scripts).map(s => ({ src: s.src || null, inline: !s.src, textSnippet: s.innerText && s.innerText.slice(0,120) }));
      const perfScripts = (performance.getEntriesByType('resource') || []).filter(r => /\.js$/i.test(r.name)).map(r => ({ name: r.name, start: r.startTime, duration: r.duration }));
      return { navs: window.__wbLoadTimeline && window.__wbLoadTimeline.navs || null, writes: window.__wbLoadTimeline && window.__wbLoadTimeline.writes || [], snap0: window.__wbLoadTimeline && window.__wbLoadTimeline.snap0, scripts, perfScripts };
    } catch (e) { return { error: String(e) }; }
  });

  console.log('LOAD TIMELINE REPORT:', JSON.stringify({ navs, report }, null, 2));

  // Assertions: at minimum snap0 should exist (we captured an early computed token)
  expect(report).toBeTruthy();
  expect(report.snap0).toBeTruthy();
  // No early writes setting 'light'
  const earlyLight = (report.writes || []).some(w => /light/i.test(String(w.value)));
  expect(earlyLight).toBe(false);
});
