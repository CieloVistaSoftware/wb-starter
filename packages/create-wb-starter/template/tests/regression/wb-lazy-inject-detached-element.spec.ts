/**
 * WB.inject() must not crash when its target element is removed from the DOM
 * while the behavior module's dynamic import is still in flight (SPA page
 * navigation swapping innerHTML, a demo re-rendering, etc.) — most behaviors
 * assume a live, attached element (`element.parentNode.insertBefore(...)` as
 * their first setup step), so applying to a detached element used to throw
 * deep inside whichever behavior happened to be loading (search.js, pre.js,
 * code.js, ...) rather than failing cleanly. (#297)
 *
 * Root-cause fix already landed in 49e347a: src/core/wb-lazy.js's inject()
 * checks element.isConnected right after the async getBehavior() import
 * resolves and bails out before calling the behavior function. This test
 * reproduces the race deterministically by delaying the network response for
 * the behavior's module file, removing the element while that fetch is
 * in-flight, and asserting no page error is thrown.
 *
 * Must run against a page that actually boots via wb-lazy.js (the
 * dynamic-import, lazy-loading implementation). The main site
 * (site-engine.js) imports WB from core/wb.js instead — a separate, eager
 * implementation with no per-call dynamic import, so WB.inject() there
 * resolves in ~1ms regardless of network delay and never exercises this
 * race. Every demos/*.html page imports wb-lazy.js directly; this test
 * only needs window.WB.inject to exist and doesn't touch any of the
 * page's actual content, so any of them works (demos/kitchen-sink.html,
 * the original target, was deleted as part of the demos/ consolidation).
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.WB_BASE || 'http://localhost:3000';

test('WB.inject() does not crash when its element is removed mid-import', async ({ page }) => {
  // The crash is caught internally by inject()'s own try/catch (which logs
  // it via Events.error() and marks x-error="true") rather than escaping as
  // an uncaught exception — so page.on('pageerror') never fires either way.
  // The real signal is the console.error Events.error() emits, plus the
  // x-error attribute inject() sets on the element in its catch block.
  const consoleErrs: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text()); });

  // Delay the 'search' behavior module's fetch so there's a real window
  // where the target element can be removed while the import is pending.
  await page.route('**/wb-viewmodels/search.js', async (route) => {
    await new Promise((r) => setTimeout(r, 500));
    await route.continue();
  });

  await page.goto(BASE + '/demos/site/forms.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!(window as any).WB?.inject, { timeout: 20000 });

  const result = await page.evaluate(async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const injectPromise = (window as any).WB.inject(el, 'search');
    // Remove the element while the delayed module fetch is still pending.
    el.remove();

    const cleanup = await injectPromise;
    return { cleanup, stillConnected: el.isConnected, errAttr: el.getAttribute('x-error') };
  });

  expect(result.cleanup, 'inject() should resolve without throwing for a detached element').toBeFalsy();
  expect(result.stillConnected).toBe(false);
  expect(result.errAttr, 'element should NOT be marked x-error — bailing on isConnected is not a real error').toBeNull();
  expect(
    consoleErrs.some((e) => e.includes("Cannot read properties of null") || e.includes('insertBefore')),
    `should never reach search.js's insertBefore call on a detached element — saw: ${JSON.stringify(consoleErrs)}`
  ).toBe(false);
});
