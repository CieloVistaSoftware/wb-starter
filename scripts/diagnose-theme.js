#!/usr/bin/env node
import playwright from 'playwright';

(async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  const events = [];
  cdp.on('Runtime.executionContextDestroyed', ev => events.push({ t: Date.now(), ev: 'executionContextDestroyed', detail: ev }));
  cdp.on('Runtime.executionContextCreated', ev => events.push({ t: Date.now(), ev: 'executionContextCreated', detail: ev }));
  cdp.on('Page.frameNavigated', ev => events.push({ t: Date.now(), ev: 'frameNavigated', detail: ev }));

  await page.addInitScript(() => {
    window.__diagInit = { t: Date.now(), snap: (function(){ try { return getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim(); } catch(e){ return null; } })() };
  });

  // also install an instrumentation that captures immediate writes
  await page.addInitScript(() => {
    if (window.__diagWrites) return;
    window.__diagWrites = [];
    const orig = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(k,v){ if(String(k)==='data-theme') window.__diagWrites.push({ when: Date.now(), via: 'setAttribute', value: String(v) }); return orig.apply(this, arguments); };
    const od = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'dataset');
    if (od && typeof od.get === 'function') {
      Object.defineProperty(HTMLElement.prototype, 'dataset', {
        get() { const ds = od.get.call(this); return new Proxy(ds, { set(target, prop, val) { if(String(prop)==='theme') window.__diagWrites.push({ when: Date.now(), via: 'dataset', value: String(val) }); target[prop]=val; return true; } }); }
      });
    }
  });

  page.on('console', m => events.push({ t: Date.now(), ev: 'console', text: m.text() }));
  page.on('framenavigated', f => events.push({ t: Date.now(), ev: 'framenavigated', url: f.url() }));

  try {
    await page.goto('http://localhost:3000/demos/wb-page-demo.html', { waitUntil: 'load', timeout: 10000 });
  } catch (e) {
    events.push({ t: Date.now(), ev: 'gotoError', detail: String(e) });
  }

  // collect snapshot
  const snap = await page.evaluate(() => ({ init: window.__diagInit || null, writes: window.__diagWrites || [], dataTheme: document.documentElement.getAttribute('data-theme'), computedBg: (function(){ try { return getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim(); } catch(e){ return null; } })() }));

  console.log('DIAG EVENTS:', JSON.stringify(events, null, 2));
  console.log('DIAG SNAPSHOT:', JSON.stringify(snap, null, 2));

  await browser.close();
  process.exit(0);
})();