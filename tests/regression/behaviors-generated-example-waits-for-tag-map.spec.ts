/**
 * THE GENERATED EXAMPLE DOES NOT DEPEND ON WHEN IT WAS ASKED FOR (#1153, #1337)
 * =============================================================================
 *
 * pages/behaviors.html builds a behavior's example markup from tag-map's
 * `nativeMap`, which says which semantic tag already IS which behavior:
 * `<details>` is the details behavior, `<figure>` is figure, `<article>` is a
 * card. A behavior with a native host is demonstrated by writing that tag and
 * nothing else; writing the attribute as well -- `<details x-details>` -- is
 * the duplication #1141 forbids, and #746 showed the redundant form can
 * SUPPRESS the behavior outright.
 *
 * `nativeMap` arrives by a dynamic `import()`, so at the earliest it is one
 * microtask AFTER the page's inline script finishes evaluating. The generator
 * used to be published on `window` during that evaluation, so "the function
 * exists" did not imply "its map is loaded" -- and the behavior->host index it
 * consults was built lazily by whichever caller came first, from the empty
 * placeholder map. An empty map answers "no behavior has a native host", so
 * every native example took the attribute branch.
 *
 * #1337: the second dependency. seedAttributes() fills in `src=` (and
 * friends) from data/schema-index.json, two fetches after the tag map. With
 * the generator published on the tag map alone, x-avatar was `<div x-avatar>`
 * early and `<div x-avatar src="…">` late -- 5 of 212 behaviors. The page now
 * publishes once both are in, so the comparison below is the WHOLE markup,
 * not just the host decision.
 *
 * This is an ORDERING test, not a content test. Content is
 * tests/compliance/no-redundant-x-attribute.spec.ts's job, and that sweep only
 * ever passed because it waits for the rendered list -- an unrelated proxy for
 * the same import -- before calling the generator. The wait hid the defect.
 * So this test deliberately does NOT wait: it calls the generator inside the
 * page's own assignment of it -- the earliest caller there can be -- and
 * requires that answer to equal the one given later, once the list has
 * rendered and everything is certainly in.
 */

import { test, expect } from '../fixtures/offline';

test.describe('generated examples do not depend on call order (#1153, #1337)', () => {
  test('the generator, called the instant the page offers it, gives its final answer', async ({ page }) => {
    test.setTimeout(90_000);

    // Installed BEFORE any page script runs. The trap fires synchronously as
    // the page assigns window.__wbGeneratedExample, so the capture happens in
    // the page's own event loop at the first moment the generator exists.
    // Driving this from the test process instead would measure a round trip,
    // not the race: by the time a waitForFunction result crosses back, every
    // fetch has long since resolved and the defect is invisible. That is how
    // #1153 shipped.
    await page.addInitScript(() => {
      const w = window as any;
      w.__wb1153 = null;
      Object.defineProperty(w, '__wbGeneratedExample', {
        configurable: true,
        get() { return undefined; },
        set(gen) {
          Object.defineProperty(w, '__wbGeneratedExample', { value: gen, writable: true, configurable: true });
          const behaviors = Object.keys(w.WB?.behaviors ?? {});
          const early: Record<string, string> = {};
          for (const name of behaviors) {
            try { early[name] = String(gen('x-' + name, '', '', '', false)); } catch { /* a throw is a different defect */ }
          }
          w.__wb1153 = { early, readyPromiseType: typeof w.__wbBehaviorsReady };
        },
      });
    });

    await page.goto('/?page=behaviors');
    await page.waitForFunction(() => (window as any).__wb1153 !== null, null, { timeout: 60000 });

    const captured = await page.evaluate(() => (window as any).__wb1153);
    expect(Object.keys(captured.early).length,
      'no examples captured — the comparison below would pass vacuously')
      .toBeGreaterThan(0);
    // The page also keeps the promise form of the same guarantee, for a caller
    // that would rather await than poll. Asserted so it cannot be dropped
    // silently, leaving polling as the only option again.
    expect(captured.readyPromiseType, 'window.__wbBehaviorsReady is gone').toBe('object');

    // Now everything is certainly loaded: the list renders after the last fetch.
    await expect(page.locator('#behaviors-search-results > *').first()).toBeAttached({ timeout: 30000 });

    const late: Record<string, string> = await page.evaluate((names: string[]) => {
      const gen = (window as any).__wbGeneratedExample;
      const out: Record<string, string> = {};
      for (const name of names) {
        try { out[name] = String(gen('x-' + name, '', '', '', false)); } catch { /* as above */ }
      }
      return out;
    }, Object.keys(captured.early));

    const drifted = Object.keys(captured.early)
      .filter((name) => late[name] !== undefined && late[name] !== captured.early[name])
      .map((name) => `x-${name}:\n    early ${captured.early[name].slice(0, 160)}\n    late  ${late[name].slice(0, 160)}`);

    expect(drifted,
      'the generator was reachable before the data it reads (tag map or schema index):\n  '
      + drifted.join('\n  '))
      .toEqual([]);
  });
});
