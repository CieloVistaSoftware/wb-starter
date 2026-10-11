import { test, expect } from '../fixtures/offline';

/**
 * #1847 -- the click-variant x-dropdown on the Behaviors page reported
 * `index: -1` for option 0, once, on a Windows CI runner.
 *
 * WHAT HAPPENED (read from that run's trace, job 114373856339): the test
 * clicked the row 196ms BEFORE wb-lazy.js had loaded -- its "[WB-lazy] debug
 * tracing" line is logged at +196ms. The Behaviors page runs inside the site
 * shell, whose runtime is wb.js, and imports wb-lazy.js for its live stage.
 * Each runtime kept its OWN record of what it had applied. So:
 *
 *   1. the row's markup lands in the stage; wb.js's MutationObserver injects
 *      dropdown -- recorded in wb.js's map;
 *   2. wb-lazy.js finishes loading, and the stage's eager WB.scan injects
 *      dropdown into the same element -- wb-lazy's map has never heard of it;
 *   3. dropdown() runs a second time. It treats the first run's trigger
 *      <button> and menu <div> as authored child items and moves them into a
 *      NEW menu. The first run's click listener is still on the host, closed
 *      over the OLD menu, and it fires first: the first item in the new menu
 *      is the old trigger, which is not in the old menu, so indexOf is -1.
 *
 * Locally the row click always came after wb-lazy.js had loaded, and once it
 * has, wb.js's observer calls the lazy runtime's inject (wb-lazy copies its
 * methods onto window.WB), so both paths hit one map and it never showed.
 *
 * Held three ways, each of which fails on the code before the fix:
 *   - the CI interleaving itself, made certain by holding wb-lazy.js back
 *     until wb.js has built the dropdown;
 *   - the two runtimes share one record: neither re-applies what the other did;
 *   - dropdown() called twice on one host builds one dropdown, not two.
 *
 * See it by hand: Open ?page=behaviors on a cold cache with the network
 * throttled, type "dropdown" and click the trigger=click row at once, then
 * pick the first option. Before: wb:dropdown:select fired twice, the first
 * with index -1 and value "Menu ▼". Now: once, index 0, the option's text.
 */

test.describe('#1847 — one dropdown per host, whichever runtime gets there first', () => {
  // page.route() holds wb-lazy.js back; sw.js would answer that fetch itself
  // and the hold would never apply (#1349).
  test.use({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });

  test('Behaviors stage: a row rendered before wb-lazy.js loads still reports index 0 for option 0', async ({ page }) => {
    test.setTimeout(60_000);
    // Hold wb-lazy.js until wb.js has built the dropdown: the order CI hit.
    let release!: () => void;
    const released = new Promise<void>((r) => { release = r; });
    await page.route('**/src/core/wb-lazy.js*', async (route) => {
      await released;
      await route.fallback();
    });

    await page.goto('/?page=behaviors');
    await page.waitForSelector('#behaviors-search', { timeout: 30_000 });
    await page.fill('#behaviors-search', 'dropdown');
    await page.waitForFunction(
      () => [...document.querySelectorAll('.behaviors-search-results__row')]
        .some((r) => r.getAttribute('data-browse-token') === 'x-dropdown'
                  && r.getAttribute('data-variant') === 'click'),
      null,
      { timeout: 30_000 },
    );
    const lazyLoadedEarly = await page.evaluate(() => {
      const row = [...document.querySelectorAll('.behaviors-search-results__row')]
        .find((r) => r.getAttribute('data-browse-token') === 'x-dropdown'
                  && r.getAttribute('data-variant') === 'click') as HTMLElement;
      row.click();
      return performance.getEntriesByType('resource').some((e) => /\/src\/core\/wb-lazy\.js/.test(e.name));
    });
    expect(lazyLoadedEarly, 'wb-lazy.js must still be held back, or this is not the CI order').toBe(false);

    // wb.js's own observer builds it while wb-lazy.js is held.
    await page.waitForFunction(
      () => !!document.querySelector('#behaviors-live-stage .x-dropdown .x-dropdown__menu'),
      null,
      { timeout: 30_000 },
    );
    release();
    // The newest render clears aria-busy once its eager scan has run.
    await page.waitForFunction(() => {
      const live = document.getElementById('behaviors-live');
      return !!live && !live.hasAttribute('aria-busy')
        && performance.getEntriesByType('resource').some((e) => /\/src\/core\/wb-lazy\.js/.test(e.name));
    }, null, { timeout: 30_000 });
    await page.evaluate(() => (window as any).WB.settled({ timeout: 15_000 }));

    const result = await page.evaluate(async () => {
      const until = async (ok: () => boolean, ms = 5000) => {
        const end = performance.now() + ms;
        while (!ok() && performance.now() < end) await new Promise((r) => requestAnimationFrame(r));
      };
      const root = document.querySelector('#behaviors-live-stage .x-dropdown') as HTMLElement;
      const triggers = root.querySelectorAll('.x-dropdown__trigger').length;
      const menus = root.querySelectorAll('.x-dropdown__menu').length;
      const menu = root.querySelector('.x-dropdown__menu') as HTMLElement;
      (root.querySelector('.x-dropdown__trigger') as HTMLElement).click();
      await until(() => getComputedStyle(menu).display !== 'none');
      const events: any[] = [];
      const record = (e: any) => events.push(e.detail);
      root.addEventListener('wb:dropdown:select', record);
      const first = menu.querySelector('.x-dropdown__item') as HTMLElement;
      const text = (first.textContent || '').trim();
      first.click();
      root.removeEventListener('wb:dropdown:select', record);
      return { triggers, menus, text, events };
    });

    expect(result.triggers, 'one trigger -- a second dropdown() run builds another').toBe(1);
    expect(result.menus, 'one menu -- a second dropdown() run nests the first inside a new one').toBe(1);
    expect(result.events.map((d) => d.index), 'option 0 fires one select, reporting index 0').toEqual([0]);
    expect(result.events[0].value, 'and it names the option clicked').toBe(result.text);
  });

  for (const first of ['wb.js', 'wb-lazy.js'] as const) {
    test(`the runtimes share one record: ${first} injects, the other does not inject again`, async ({ page }) => {
      await page.goto('/index.html');
      await page.waitForFunction(() => typeof (window as any).WB?.inject === 'function', null, { timeout: 30_000 });
      const ranAgain = await page.evaluate(async (firstRuntime) => {
        // wb.js's inject, saved before wb-lazy.js copies its own over window.WB.
        const eager = (window as any).WB;
        const eagerInject = eager.inject;
        const lazy = (await import('/src/core/wb-lazy.js' as string)).default;
        const host = document.createElement('div');
        document.body.appendChild(host);
        const el = document.createElement('div');
        el.id = `dd1847-${firstRuntime}`;
        el.setAttribute('label', 'Pick');
        el.innerHTML = '<a href="#a">Alpha</a><a href="#b">Beta</a>';
        host.appendChild(el);
        const [one, two] = firstRuntime === 'wb.js'
          ? [(n: string) => eagerInject.call(eager, el, n), (n: string) => lazy.inject(el, n)]
          : [(n: string) => lazy.inject(el, n), (n: string) => eagerInject.call(eager, el, n)];
        const firstCleanup = await one('dropdown');
        const secondCleanup = await two('dropdown');
        const out = {
          firstApplied: typeof firstCleanup === 'function',
          secondReturned: secondCleanup === null ? 'null' : typeof secondCleanup,
          menus: el.querySelectorAll('.x-dropdown__menu').length,
        };
        host.remove();
        return out;
      }, first);
      expect(ranAgain.firstApplied, 'control: the first runtime must apply it at all').toBe(true);
      expect(ranAgain.secondReturned, 'the second runtime must see it as already applied (inject returns null)').toBe('null');
      expect(ranAgain.menus).toBe(1);
    });
  }

  test('dropdown() called twice on one host builds one dropdown and fires one select with the right index', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForFunction(() => typeof (window as any).WB?.inject === 'function', null, { timeout: 30_000 });
    const result = await page.evaluate(async () => {
      const { dropdown } = await import('/src/wb-viewmodels/dropdown.js' as string);
      const el = document.createElement('div');
      el.setAttribute('x-ignore', '');
      el.setAttribute('label', 'Pick');
      el.innerHTML = '<a href="#a">Alpha</a><a href="#b">Beta</a><a href="#c">Gamma</a>';
      document.body.appendChild(el);
      const cleanupA = dropdown(el);
      dropdown(el);
      const events: any[] = [];
      el.addEventListener('wb:dropdown:select', (e: any) => events.push(e.detail));
      (el.querySelector('.x-dropdown__trigger') as HTMLElement).click();
      const items = [...el.querySelectorAll('.x-dropdown__menu .x-dropdown__item')] as HTMLElement[];
      items[1].click();
      const out = {
        triggers: el.querySelectorAll('.x-dropdown__trigger').length,
        menus: el.querySelectorAll('.x-dropdown__menu').length,
        itemTexts: items.map((i) => (i.textContent || '').trim()),
        events,
      };
      // Torn down, it can be built again: the guard must not outlive the instance.
      cleanupA();
      el.innerHTML = '<a href="#a">Alpha</a><a href="#b">Beta</a>';
      dropdown(el);
      const rebuilt = el.querySelectorAll('.x-dropdown__menu .x-dropdown__item').length;
      el.remove();
      return { ...out, rebuilt };
    });
    expect(result.triggers).toBe(1);
    expect(result.menus).toBe(1);
    expect(result.itemTexts, 'the menu holds the authored options and nothing else').toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(result.events.map((d) => [d.index, d.value]), 'one select, for option 1').toEqual([[1, 'Beta']]);
    expect(result.rebuilt, 'after cleanup a fresh dropdown() builds again').toBe(2);
  });
});
