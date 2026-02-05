import { test, expect } from '@playwright/test';

// Ensures wb-page-demo.html paints dark on first paint (no FOUC / no early 'light')
// - Installs an init script to capture the very-first computed --bg-color and any
//   writes to data-theme that occur during bootstrap.
// - This test is deliberately strict: the initial computed token must indicate
//   the dark token (repo canonical) and no script may set `data-theme` to
//   'light' before that first-computed snapshot.

const INIT = `(() => {
  if (window.__wbFirstPaint) return;
  const start = performance.now();
  const writes = [];
  const captureStack = () => { try { return (new Error()).stack.split('\n').slice(2,8).join('\n'); } catch(e){ return null; } };
  const origSet = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(k, v) {
    try { if (String(k) === 'data-theme') writes.push({ when: performance.now(), via: 'setAttribute', value: String(v), stack: captureStack() }); } catch(e){}
    return origSet.apply(this, arguments);
  };
  const od = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'dataset');
  if (od && typeof od.get === 'function') {
    Object.defineProperty(HTMLElement.prototype, 'dataset', {
      get() {
        const ds = od.get.call(this);
        return new Proxy(ds, { set(target, prop, val) { try { if (String(prop) === 'theme') writes.push({ when: performance.now(), via: 'dataset', value: String(val), stack: captureStack() }); } catch(e){} target[prop] = val; return true; } });
      }
    });
  }
  try {
    const computedBg = (function(){ try { return getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim(); } catch(e) { return null; } })();
    const initial = {
      navStart: (performance.timing && performance.timing.navigationStart) || Date.now(),
      snapshotTime: performance.now(),
      computedBg,
      writesSnapshot: writes.slice()
    };
    window.__wbFirstPaint = initial;
  } catch(e) {
    window.__wbFirstPaint = { error: String(e) };
  }
})();`;

test.describe('wb-page — first paint (no FOUC)', () => {
  test('wb-page-demo paints dark on first computed style and no early light writes', async ({ page }) => {
    // Install instrumentation as early as possible
    await page.addInitScript({ content: INIT });

    // Simulate persisted 'light' to ensure CSS-first still wins for first-paint
    await page.addInitScript(() => { try { localStorage.setItem('wb-theme', 'light'); } catch(e){} });

    // Navigate and wait for load
    await page.goto('/demos/wb-page-demo.html', { waitUntil: 'load' });

    // Grab the captured first-paint snapshot
    const snap = await page.evaluate(() => window.__wbFirstPaint || null);
    expect(snap).not.toBeNull();

    // 1) computed token must indicate dark (repository dark token uses 10% lightness)
    // The runtime now provides a deterministic JS fallback for first-paint when
    // stylesheets are delayed — ensure the first snapshot yields a dark token.
    expect(snap.computedBg).toBeTruthy();
    expect(/10%/.test(snap.computedBg) || /hsl\(\s*220[, ]+25%[, ]+10%\)/i.test(snap.computedBg)).toBeTruthy();

    // 2) ensure no write set 'light' prior to the snapshot
    const writesBefore = (snap.writesSnapshot || []).filter(w => /light/i.test(String(w.value)) && w.when <= snap.snapshotTime);
    expect(writesBefore.length).toBe(0);

    // 3) ensure the runtime fallback is removed once canonical CSS applies
    const afterLoadBg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim());
    expect(afterLoadBg).toContain('10%');

    // 3) ensure rendered document does not have data-theme='light'
    const htmlAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(htmlAttr === null || htmlAttr === 'dark').toBeTruthy();

    // cleanup persisted preference used for test
    await page.evaluate(() => { try { localStorage.removeItem('wb-theme'); } catch(e){} });
  });
});
