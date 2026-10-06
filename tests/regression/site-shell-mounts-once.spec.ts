/**
 * ═══════════════════════════════════════════════════════════════════════════
 * The site shell mounts once (#1340)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John's error viewer showed, twice:
 *
 *   Duplicate element id(s) after boot: #app x2, #error-template x2.
 *   Duplicate element id(s) after navigating to home: #app x2, #error-template x2.
 *
 * `#app` and `#error-template` are index.html's own shell. Both doubled means
 * the WHOLE SHELL mounted a second time -- the #724 failure that #730 built
 * the duplicate-id detector to catch: everything renders twice, everything
 * "works" twice, and every getElementById silently returns the first copy.
 *
 * WHY THIS SPEC EXISTS RATHER THAN A FIX
 *
 * The report had no durable trace. The server that produced it (port 3457, a
 * throwaway another session started) was gone, and data/errors.json held zero
 * duplicate-id entries in the main checkout and in all 26 worktrees. So there
 * was a runtime error a person had seen and nobody could retrieve.
 *
 * An error that exists only on someone's screen cannot be investigated. This
 * turns the observation into something that re-asks the question on every run,
 * at both of the moments the detector itself reports on.
 *
 * It asserts the duplicate-id DETECTOR's own condition, not a hand-rolled
 * count, so the spec and the runtime cannot drift apart: findDuplicateIds is
 * the function main.js and site-engine.js call.
 */
import { test, expect, Page } from '../fixtures/offline';
import { pagePath } from '../helpers/page-path';

/** Ask the page's own detector what it sees. */
async function duplicates(page: Page): Promise<{ id: string; count: number }[]> {
  return page.evaluate(async () => {
    const mod = await import('/src/core/duplicate-ids.js');
    return mod.findDuplicateIds(document);
  });
}

/** Shell ids, named so a failure says which part doubled. */
const SHELL = ['app', 'error-template'];

async function shellCounts(page: Page, ids: string[]): Promise<Record<string, number>> {
  return page.evaluate(
    (names) => Object.fromEntries(
      names.map((n) => [n, document.querySelectorAll(`[id="${n}"]`).length]),
    ),
    ids,
  );
}

test.describe('#1340 the site shell mounts once', () => {
  test('after boot, nothing is duplicated', async ({ page }) => {
    const hints: string[] = [];
    page.on('console', (m) => {
      if (/Duplicate element id/i.test(m.text())) hints.push(m.text());
    });

    await page.goto('/?page=home');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
    // Boot is over when every injection has called back (#1516: not 600ms).
    await page.waitForFunction(() => typeof (window as any).WB?.settled === 'function', null, { timeout: 15000 });
    await page.evaluate(() => (window as any).WB.settled({ timeout: 15000 }));

    const counts = await shellCounts(page, SHELL);
    expect(counts, 'the shell is present exactly once').toEqual({ 'app': 1, 'error-template': 1 });

    const dups = await duplicates(page);
    expect(dups, `the page's own detector found duplicates: ${JSON.stringify(dups)}`).toEqual([]);
    expect(hints, `the runtime reported duplicates:\n${hints.join('\n')}`).toEqual([]);
  });

  test('after an in-page navigation, the shell is still single', async ({ page }) => {
    // The second of John's two reports was "after navigating to home". The SPA
    // swaps main.innerHTML rather than reloading, so a shell that re-mounts
    // does it here -- a goto would hide the bug by rebuilding the document.
    const hints: string[] = [];
    page.on('console', (m) => {
      if (/Duplicate element id/i.test(m.text())) hints.push(m.text());
    });

    await page.goto('/?page=docs');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });

    const home = page.locator(`.nav__item[href="${pagePath('home')}"]`).first();
    await expect(home, 'no nav link to home').toBeVisible({ timeout: 10000 });
    await home.click();
    // The navigation is over once home has rendered and its work settled (#1516: not 1200ms).
    await page.waitForFunction(() => !!document.getElementById('mainPage-home'), null, { timeout: 20000 });
    await page.waitForFunction(() => typeof (window as any).WB?.settled === 'function', null, { timeout: 15000 });
    await page.evaluate(() => (window as any).WB.settled({ timeout: 15000 }));

    const counts = await shellCounts(page, SHELL);
    expect(counts, 'navigating re-mounted part of the shell').toEqual({ 'app': 1, 'error-template': 1 });

    const dups = await duplicates(page);
    expect(dups, `after navigation the detector found: ${JSON.stringify(dups)}`).toEqual([]);
    expect(hints, `the runtime reported duplicates:\n${hints.join('\n')}`).toEqual([]);
  });

  test('the behaviors page does not duplicate its live stage', async ({ page }) => {
    // Not John's signature, but the one the archives actually show: of the
    // duplicate-id reports kept in data/error-log-archive, 44 are
    // "#behaviors-live-stage x2" against 2 of "#app x2, #error-template x2".
    // Whatever doubled the shell was rare; this one was routine.
    const hints: string[] = [];
    page.on('console', (m) => {
      if (/Duplicate element id/i.test(m.text())) hints.push(m.text());
    });

    await page.goto('/?page=behaviors');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
    await page.waitForTimeout(1500);

    const dups = await duplicates(page);
    expect(dups, `the behaviors page duplicated: ${JSON.stringify(dups)}`).toEqual([]);
    expect(hints, `the runtime reported duplicates:\n${hints.join('\n')}`).toEqual([]);
  });

  test('the detector this spec relies on can actually see a duplicate', async ({ page }) => {
    // Without this, the two tests above pass just as well when
    // findDuplicateIds is broken and returns nothing -- the #863 trap. Plant
    // one and require it to be found.
    await page.goto('/?page=home');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });

    const found = await page.evaluate(async () => {
      const probe = document.createElement('div');
      probe.id = 'wb-1340-probe';
      const twin = probe.cloneNode() as HTMLElement;
      document.body.append(probe, twin);
      const mod = await import('/src/core/duplicate-ids.js');
      const hits = mod.findDuplicateIds(document);
      probe.remove();
      twin.remove();
      return hits.filter((h: any) => h.id === 'wb-1340-probe');
    });

    expect(found, 'findDuplicateIds did not report a planted duplicate').toEqual([
      { id: 'wb-1340-probe', count: 2 },
    ]);
  });
});
