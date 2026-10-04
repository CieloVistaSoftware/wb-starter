/**
 * THE GENERATED EXAMPLE DOES NOT DEPEND ON WHEN IT WAS ASKED FOR (#1153)
 * ======================================================================
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
 * This is therefore an ORDERING test, not a content test. Content is
 * tests/compliance/no-redundant-x-attribute.spec.ts's job, and that sweep only
 * ever passed because it waits for the rendered list -- an unrelated proxy for
 * the same import -- before calling the generator. The wait hid the defect,
 * which is why #753's sweep was filed as flaky. So this test deliberately does
 * NOT wait for the list: it calls the generator at the first instant the page
 * offers it, from inside the page, and requires that answer to equal the one
 * given later, once the list has rendered and the map is certainly in.
 *
 * Against the unfixed page the early answer is `<details x-details>` while the
 * late answer is `<details>`, so the comparison fails. No value a lookup
 * against an unloaded map could return would pass it -- which is the point:
 * the fix is that the entry point does not exist until the map does.
 */

import { test, expect } from '../fixtures/offline';

/** The opening tag of a generated example, e.g. `<details x-details>`. */
const firstTag = (html: string): string => (html.match(/<[^>]*>/) ?? [html])[0];

/**
 * The one decision nativeMap drives: which tag hosts the example, and whether
 * it also carries the behavior's own `x-` attribute. Compared instead of the
 * whole string because other parts of the markup legitimately depend on data
 * that arrives later still -- the schema index seeds `src`, `value` and
 * friends, so x-avatar is `<div x-avatar>` early and `<div x-avatar src="…">`
 * once the index is in. That is a different dependency and a different
 * question; this test would only become noise by failing on it.
 */
function hostDecision(behavior: string, html: string): string {
  const open = firstTag(html);
  const tag = (open.match(/^<([a-zA-Z][\w-]*)/) ?? ['', '?'])[1].toLowerCase();
  const carriesOwnAttr = new RegExp(`\\sx-${behavior}(?=[\\s/>=]|$)`).test(open);
  return carriesOwnAttr ? `<${tag} x-${behavior}>` : `<${tag}>`;
}

test.describe('generated examples do not depend on call order (#1153)', () => {
  test('the generator, called the instant the page offers it, already knows nativeMap', async ({ page }) => {
    test.setTimeout(90_000);

    // Installed BEFORE any page script runs, so the capture happens in the
    // page's own event loop at the first moment the generator is reachable.
    // Driving this from the test process instead would measure a round trip,
    // not the race: by the time a waitForFunction result crosses back, the
    // import has long since resolved and the defect is invisible. That is how
    // this shipped.
    //
    // The wait condition here is exactly the one the old compliance sweep
    // used -- the generator plus a populated behavior registry, and nothing
    // about the tag map. That condition is what made the sweep report
    // `<figure x-figure>` on some runs and pass on others.
    await page.addInitScript(() => {
      (window as any).__wb1153 = null;
      const started = Date.now();
      const poll = () => {
        const gen = (window as any).__wbGeneratedExample;
        const behaviors = Object.keys((window as any).WB?.behaviors ?? {});
        if (typeof gen === 'function' && behaviors.length > 0) {
          const early: Record<string, string> = {};
          for (const name of behaviors) {
            try { early[name] = String(gen('x-' + name, '', '', '', false)); } catch { /* a throw is a different defect */ }
          }
          (window as any).__wb1153 = {
            early,
            // Evidence that this really is the EARLY call. The browse list
            // renders from the same import, several fetches further down the
            // chain, so zero rows means the map had only just landed when
            // this answer was given.
            rowsWhenCaptured: document.querySelectorAll('[data-browse-token]').length,
            readyPromiseType: typeof (window as any).__wbBehaviorsReady,
          };
          return;
        }
        if (Date.now() - started > 45000) { (window as any).__wb1153 = { timedOut: true }; return; }
        setTimeout(poll, 0);
      };
      poll();
    });

    await page.goto('/?page=behaviors');
    await page.waitForFunction(() => (window as any).__wb1153 !== null, null, { timeout: 60000 });

    const captured = await page.evaluate(() => (window as any).__wb1153);
    expect(captured.timedOut, 'the example generator was never published').toBeFalsy();
    expect(Object.keys(captured.early).length,
      'no examples captured — the comparison below would pass vacuously')
      .toBeGreaterThan(0);
    expect(captured.rowsWhenCaptured,
      'the capture happened after the browse list had rendered, so it did not exercise the early call at all')
      .toBe(0);
    // The page also keeps the promise form of the same guarantee, for a caller
    // that would rather await than poll. Asserted so it cannot be dropped
    // silently, leaving polling as the only option again.
    expect(captured.readyPromiseType, 'window.__wbBehaviorsReady is gone').toBe('object');

    // Now the map is certainly loaded: the list renders from that same import.
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
      .filter((name) => late[name] !== undefined
        && hostDecision(name, late[name]) !== hostDecision(name, captured.early[name]))
      .map((name) => `x-${name}: early -> ${hostDecision(name, captured.early[name])}`
        + `   late -> ${hostDecision(name, late[name])}`);

    expect(drifted,
      'these examples were generated from an unloaded tag map, so the generator was reachable before its dependency:\n  '
      + drifted.join('\n  '))
      .toEqual([]);
  });
});
