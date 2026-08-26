import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#374 / BUG-2026-07-27-001, general mechanism): <div x-demo> blocks
 * past EAGER_BUILD_COUNT (x-demo.js) build lazily via IntersectionObserver,
 * well after the page's one-time eager WB.scan(document.body) already ran.
 * demo.js used to only re-scan its own source-code <pre> panel, never the
 * real children it moves into .x-demo__grid -- so ANY interactive element
 * inside a lazy-built demo block never got its behavior attached at all,
 * regardless of which specific behavior it used.
 *
 * The original #374 report/fix is covered end-to-end (real page, real
 * scroll, real IntersectionObserver) by tests/regression/lightbox-data-src.spec.ts,
 * tied to the lightbox demo specifically. A synthetic full-page fixture
 * attempting to reproduce the SAME off-screen/lazy timing generically (any
 * x-* behavior, not just lightbox) turned out unreliable to construct --
 * WB.init({autoInject:true})'s own immediate scan injects x-* attributes
 * before the x-demo lazy build completes regardless of geometric position
 * in a minimal fixture, unlike observed real-page behavior, and chasing that
 * discrepancy further wasn't worth it here.
 *
 * This test instead directly and deterministically exercises the actual
 * code contract that was the fix: demo() (src/wb-viewmodels/demo.js) must
 * call window.WB.scan() on the newly-built .x-demo__grid -- but ONLY when
 * options.isLazy is true. Calling it unconditionally (the pre-fix
 * regression, minus the isLazy gate) would reintroduce the double-injection
 * listener-loss race documented inline in demo.js for the EAGER path, which
 * is why this asserts the gate both ways: scan happens when isLazy, and does
 * NOT happen when it isn't (or is omitted, matching the eager call sites).
 */
test.describe('demo() scans its grid only on the lazy build path (#374)', () => {
  test('isLazy:true scans the built grid', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const { demo } = await import('/src/wb-viewmodels/demo.js');
      const scanCalls: Element[] = [];
      (window as any).WB = { scan: (el: Element) => { scanCalls.push(el); } };

      // A plain div, NOT document.createElement('x-demo') -- appending a
      // real <div x-demo> triggers its own connectedCallback automatically,
      // which races this test's manual demo() call and trips the
      // _demoInitialized guard before it ever runs. demo() itself doesn't
      // care about tag name, only .innerHTML/.children/._rawSource.
      const el = document.createElement('div');
      el.innerHTML = '<button x-ripple>Test</button>';
      el.setAttribute('columns', '1');
      document.body.appendChild(el);
      (el as any)._rawSource = el.innerHTML;

      await demo(el, { isLazy: true });

      const grid = el.querySelector('.x-demo__grid');
      return { scannedGrid: scanCalls.includes(grid as Element), gridExists: !!grid };
    });

    expect(result.gridExists, 'demo() must still build the .x-demo__grid').toBe(true);
    expect(result.scannedGrid, 'WB.scan must be called with the grid it just built, on the lazy path').toBe(true);
  });

  test('isLazy omitted (the eager call-site shape) does NOT scan the grid', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const { demo } = await import('/src/wb-viewmodels/demo.js');
      const scanCalls: Element[] = [];
      (window as any).WB = { scan: (el: Element) => { scanCalls.push(el); } };

      // A plain div, NOT document.createElement('x-demo') -- appending a
      // real <div x-demo> triggers its own connectedCallback automatically,
      // which races this test's manual demo() call and trips the
      // _demoInitialized guard before it ever runs. demo() itself doesn't
      // care about tag name, only .innerHTML/.children/._rawSource.
      const el = document.createElement('div');
      el.innerHTML = '<button x-ripple>Test</button>';
      el.setAttribute('columns', '1');
      document.body.appendChild(el);
      (el as any)._rawSource = el.innerHTML;

      // No isLazy at all -- matches x-demo.js's EAGER connectedCallback
      // call site, which relies on the concurrent global WB.scan(main) pass
      // to cover the grid instead (scanning it here too would race that
      // pass -- see demo.js's own comment on the listener-loss regression
      // this caused before).
      await demo(el, {});

      const grid = el.querySelector('.x-demo__grid');
      return { scannedGrid: scanCalls.includes(grid as Element) };
    });

    expect(result.scannedGrid, 'WB.scan must NOT be called with the grid on the eager-shaped path -- that would race the global scan (see demo.js comment)').toBe(false);
  });
});
