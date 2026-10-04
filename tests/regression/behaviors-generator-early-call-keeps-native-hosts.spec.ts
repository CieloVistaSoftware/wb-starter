import { test, expect } from '../fixtures/offline';

/**
 * #1153 -- calling the example generator before the tag map loads must not
 * poison it for the rest of the page.
 *
 * pages/behaviors.html builds a behavior -> native-tag index (nativeByBehavior)
 * from nativeMap, which arrives by a dynamic import of tag-map.js. The index
 * used to be built on the FIRST call and kept forever. A call that came before
 * the import resolved indexed the empty placeholder map, so every later example
 * for an auto-injected behavior came out as <details x-details>, <figure
 * x-figure>, <input x-input> -- the markup #1141 forbids. The compliance sweep
 * (no-redundant-x-attribute.spec.ts) waits for the list to be built precisely
 * to avoid this, so it never exercised the race.
 *
 * Here the generator is called at the instant the page assigns it: inside the
 * same synchronous script, before any import can resolve. That is the earliest
 * caller possible. Then, once the page is ready, its examples must be clean.
 */
test('an early generator call does not make later examples carry duplicate x-* attributes', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as any;
    Object.defineProperty(w, '__wbGeneratedExample', {
      configurable: true,
      get() { return undefined; },
      set(fn) {
        // The earliest possible caller: synchronously, as the page assigns it.
        try { w.__early = String(fn('x-details', '', '', '', false)); } catch (e) { w.__earlyError = String(e); }
        Object.defineProperty(w, '__wbGeneratedExample', { value: fn, writable: true, configurable: true });
      },
    });
  });

  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => typeof (window as any).__wbGeneratedExample === 'function', null, { timeout: 30000 });
  await expect(page.locator('#behaviors-search-results > *').first()).toBeAttached({ timeout: 30000 });

  const result = await page.evaluate(() => {
    const w = window as any;
    const gen = w.__wbGeneratedExample;
    return {
      earlyRan: typeof w.__early === 'string' || typeof w.__earlyError === 'string',
      later: ['x-details', 'x-figure', 'x-header', 'x-progress'].map((a) => String(gen(a, '', '', '', false))),
    };
  });

  expect(result.earlyRan, 'precondition: the generator was called before the tag map loaded').toBe(true);
  const offenders = result.later.filter((html) => /<(details|figure|header|progress)\b[^>]*\sx-\1\b/.test(html));
  expect(offenders, 'a native tag carried its own x-* attribute after an early call poisoned the index').toEqual([]);
});
