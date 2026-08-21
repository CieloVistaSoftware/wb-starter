/**
 * #724 / #730 — the page must boot once, and duplicate ids must be loud.
 *
 * John, on a screenshot of the site rendered twice: "why are two things
 * showing?" — two navbars, two sidebars, two heroes. Everything "worked",
 * twice, and every getElementById quietly returned the first of two. The only
 * reason anyone knew was that he looked at the screen.
 *
 * Then: "if all elements on the page have an id then duplicate work would have
 * a run time error." That is what this pins.
 *
 * The mechanism is reproduced here directly rather than described: importing
 * `main.js` under a second URL creates a second MODULE INSTANCE with its own
 * module scope — which is exactly what a stale `?v=<commit>` shell does — and
 * that second instance calls init() again.
 */
import { test, expect, Page } from '@playwright/test';

async function loadSite(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForSelector('#behaviors-search', { timeout: 30000 });
  await page.waitForTimeout(1200);
}

test.describe('#724 — the site boots exactly once', () => {
  test('a fresh load has one shell and no duplicate ids', async ({ page }) => {
    await loadSite(page);

    const state = await page.evaluate(async () => {
      const mod: any = await import('/src/core/duplicate-ids.js');
      return {
        app: document.querySelectorAll('#app').length,
        siteBody: document.querySelectorAll('#siteBody').length,
        main: document.querySelectorAll('#main').length,
        duplicates: mod.findDuplicateIds(),
      };
    });

    expect(state.app, 'one #app').toBe(1);
    expect(state.siteBody, 'one #siteBody').toBe(1);
    expect(state.main, 'one #main').toBe(1);
    expect(state.duplicates, 'a clean page has no duplicate ids').toEqual([]);
  });

  test('a SECOND module instance does not build a second shell', async ({ page }) => {
    await loadSite(page);

    const result = await page.evaluate(async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const warnings: string[] = [];
      const origWarn = console.warn;
      console.warn = (...a: any[]) => { warnings.push(a.join(' ')); origWarn(...a); };

      // A different URL = a different module = its own module scope. This is
      // why the boot flag has to live on window: a module-level `let` would be
      // false in both instances and guard nothing.
      await import('/src/main.js?v=second-instance-probe');
      await sleep(2500);
      console.warn = origWarn;

      const mod: any = await import('/src/core/duplicate-ids.js');
      return {
        app: document.querySelectorAll('#app').length,
        siteBody: document.querySelectorAll('#siteBody').length,
        blocked: warnings.some((w) => w.includes('called twice')),
        duplicates: mod.findDuplicateIds(),
      };
    });

    expect(result.blocked, 'the second boot must be refused, and say so').toBe(true);
    expect(result.app, 'still one #app after a second module instance').toBe(1);
    expect(result.siteBody, 'still one #siteBody').toBe(1);
    expect(result.duplicates, 'and therefore still no duplicate ids').toEqual([]);
  });
});

test.describe('#730 — a duplicate id is a runtime error', () => {
  test('an injected duplicate is detected and reported as an error', async ({ page }) => {
    await loadSite(page);

    const result = await page.evaluate(async () => {
      const mod: any = await import('/src/core/duplicate-ids.js');

      const probe = document.createElement('div');
      probe.id = 'behaviors-live-stage';        // clashes with the real one
      document.body.appendChild(probe);

      const errors: string[] = [];
      const origError = console.error;
      console.error = (...a: any[]) => { errors.push(a.join(' ')); origError(...a); };
      const found = mod.reportDuplicateIds('probe');
      console.error = origError;

      probe.remove();
      const afterRemoval = mod.findDuplicateIds();
      return { found, errors, afterRemoval };
    });

    expect(result.found.length, 'the duplicate must be found').toBe(1);
    expect(result.found[0].id).toBe('behaviors-live-stage');
    expect(result.found[0].count).toBe(2);
    expect(
      result.errors.some((e) => e.includes('DUPLICATE-ID') && e.includes('behaviors-live-stage')),
      'it must be a console.error naming the id — a warning gets scrolled past',
    ).toBe(true);
    expect(result.afterRemoval, 'and clean again once the duplicate is gone').toEqual([]);
  });

  test('the detector never breaks the page', async ({ page }) => {
    await loadSite(page);

    const stillAlive = await page.evaluate(async () => {
      const mod: any = await import('/src/core/duplicate-ids.js');
      // Hand it something hostile; it must swallow, not throw.
      let threw = false;
      try { mod.reportDuplicateIds(undefined as any); } catch { threw = true; }
      return {
        threw,
        searchStillThere: !!document.getElementById('behaviors-search'),
        rows: document.querySelectorAll('.behaviors-search-results__row').length,
      };
    });

    expect(stillAlive.threw, 'the detector must never throw into the page').toBe(false);
    expect(stillAlive.searchStillThere, 'the page must still be alive after a check').toBe(true);
  });
});
