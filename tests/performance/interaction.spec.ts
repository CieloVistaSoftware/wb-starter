import { test, expect, Page } from '../fixtures/offline';
import { logPerfResult } from './perf-logger';

/**
 * #1433: interaction timings are taken INSIDE the page, from the click to the
 * frame the result is in the DOM.
 *
 * They were Node wall-clock around `click()` plus an `expect(...)` that polls
 * at 100 / 250 / 500 / 1000 ms, so a class flip that took one frame measured
 * 1011 ms -- the poll interval, not the page. And the modal and tab tests
 * looked for a [x-modal] / [x-tabs] on the Behaviors page, which has built its
 * examples on demand since #666, so they timed out instead of measuring.
 * Each test now builds the element it measures.
 */
const NEVER = 5000;

/**
 * Click `trigger` and time, in the page, until `doneSelector` matches. Builds
 * `html` first (scanned by WB) when given. Returns `ms` (NEVER if the result
 * never appeared) and `inClickMs`, the part spent inside click() itself (#961):
 * a result that is there when click() returns cost exactly that; one that is
 * not was waiting for a later frame. A failure says which.
 */
async function timeInteraction(page: Page, { html, trigger, doneSelector }: { html?: string; trigger: string; doneSelector: string }) {
  return page.evaluate(async ({ html, trigger, doneSelector, never }) => {
    if (html) {
      const host = document.createElement('div');
      host.id = 'perf-host';
      host.innerHTML = html;
      document.body.append(host);
      await (window as any).WB.scan(host, { eager: true });
    }
    const el = document.querySelector(trigger) as HTMLElement | null;
    if (!el) throw new Error(`trigger not found: ${trigger}`);
    return new Promise<{ ms: number; inClickMs: number }>((resolve) => {
      const t0 = performance.now();
      let inClickMs = 0;
      const check = () => {
        const elapsed = performance.now() - t0;
        if (document.querySelector(doneSelector)) return resolve({ ms: elapsed, inClickMs });
        if (elapsed > never) return resolve({ ms: never, inClickMs });
        requestAnimationFrame(check);
      };
      el.click();
      inClickMs = performance.now() - t0;
      check();
    });
  }, { html, trigger, doneSelector, never: NEVER });
}

/**
 * #961: time the interaction on a page that has finished building, not on one
 * still booting.
 *
 * This waited only for `window.WB`, which main.js publishes before site.init()
 * has run, so the click was timed during the page's first layouts. On a fresh
 * Windows runner the first layouts are where the renderer looks up fonts for
 * the first time, and that lookup BLOCKS: the renderer asks the browser process
 * to match a font family (FontCache::FallbackFontForCharacter ->
 * FontDataManager::onMatchFamilyStyle -> FontDataServiceImpl::MatchFamilyName)
 * and waits. A CDP trace of the job's first page on CI read Layout 233ms of
 * wall time against 34ms of thread time, the font match 61ms wall / 0ms thread,
 * while a JS calibration loop ran at its normal speed: the CPU was free, the
 * thread was waiting. It happens once per runner (every later page in the job
 * clicked in 2.5-5.5ms).
 *
 * When the click came first, showModal()'s forced style and layout was the
 * layout that waited: 232.7ms wall / 16.6ms thread in the CI diagnostic, and
 * 508ms (PR #1693) and 675ms (PR #1704) in the two failures, both the first
 * test of their job, both after a 1.4-2.2s wait for `window.WB` (a wait that
 * polls on frames; 30-100ms on a normal run, 2.8s on the diagnostic's cold
 * page). So the test measured the runner's first font lookup, not the modal.
 *
 * On a settled page the lookup has already happened in the page's own load,
 * and the click measures the modal: on the same cold first page, 15ms wall /
 * 14.9ms thread. The waits are the page's own signals, in the order the page
 * reaches them: the site shell published `window.WBSite` (boot done), the
 * Behaviors list selected its first row (#771, the last step of the page's own
 * build) and is not `aria-busy` (the list's "final" mark, where the page sets
 * one), every behavior that selection injected called back (`WB.settled()`),
 * and two frames have rendered, so a style recalculation the build left pending
 * is paid by the page and not by the click being timed.
 */
async function settledBehaviorsPage(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => 'WBSite' in window, undefined, { timeout: 20000 });
  await page.waitForFunction(
    () => {
      const list = document.getElementById('behaviors-search-results');
      return Boolean(list && list.getAttribute('aria-busy') !== 'true'
        && list.querySelector('.behaviors-search-results__row[aria-current="true"]'));
    },
    undefined,
    { timeout: 20000 },
  );
  await page.evaluate(async () => {
    await (window as any).WB.settled();
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}

test.describe('Interaction Performance', () => {
  test.beforeEach(async ({ page }) => {
    await settledBehaviorsPage(page);
  });

  test('Modal should open in under 200ms', async ({ page }) => {
    const { ms, inClickMs } = await timeInteraction(page, {
      html: '<button x-modal modal-title="Perf" modal-content="Opened.">Open</button>',
      trigger: '#perf-host [x-modal]',
      doneSelector: 'dialog[open]',
    });
    logPerfResult({ category: 'interaction', name: 'Modal Open', value: ms, unit: 'ms', threshold: 200 });
    expect(ms, `click to open dialog, measured in the page (${Math.round(inClickMs)}ms of it inside click())`).toBeLessThan(200);
  });

  test('Tab switch should render in under 100ms', async ({ page }) => {
    const { ms, inClickMs } = await timeInteraction(page, {
      html: '<div x-tabs active-tab="0"><section title="One">First</section><section title="Two">Second</section></div>',
      trigger: '#perf-host .x-tabs__tab:nth-of-type(2)',
      doneSelector: '#perf-host .x-tabs__tab:nth-of-type(2).x-tabs__tab--active',
    });
    logPerfResult({ category: 'interaction', name: 'Tab Switch', value: ms, unit: 'ms', threshold: 100 });
    expect(ms, `click to active tab, measured in the page (${Math.round(inClickMs)}ms of it inside click())`).toBeLessThan(100);
  });

  test('Nav toggle should collapse in under 100ms', async ({ page }) => {
    await page.waitForFunction(() => Boolean((window as any).WBSite?.currentPage));
    const { ms, inClickMs } = await timeInteraction(page, { trigger: '.nav__toggle', doneSelector: '.site__nav.x-sidebar--collapsed' });
    logPerfResult({ category: 'interaction', name: 'Nav Toggle', value: ms, unit: 'ms', threshold: 100 });
    expect(ms, `click to collapsed nav, measured in the page (${Math.round(inClickMs)}ms of it inside click())`).toBeLessThan(100);
  });
});
