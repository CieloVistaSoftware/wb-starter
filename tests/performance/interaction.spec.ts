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
 * `html` first (scanned by WB) when given. Returns ms, or NEVER if the result
 * never appeared.
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
    return new Promise<number>((resolve) => {
      const t0 = performance.now();
      const check = () => {
        const elapsed = performance.now() - t0;
        if (document.querySelector(doneSelector)) return resolve(elapsed);
        if (elapsed > never) return resolve(never);
        requestAnimationFrame(check);
      };
      el.click();
      check();
    });
  }, { html, trigger, doneSelector, never: NEVER });
}

test.describe('Interaction Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=behaviors');
    await page.waitForFunction(() => Boolean((window as any).WB));
  });

  test('Modal should open in under 200ms', async ({ page }) => {
    const ms = await timeInteraction(page, {
      html: '<button x-modal modal-title="Perf" modal-content="Opened.">Open</button>',
      trigger: '#perf-host [x-modal]',
      doneSelector: 'dialog[open]',
    });
    logPerfResult({ category: 'interaction', name: 'Modal Open', value: ms, unit: 'ms', threshold: 200 });
    expect(ms, 'click to open dialog, measured in the page').toBeLessThan(200);
  });

  test('Tab switch should render in under 100ms', async ({ page }) => {
    const ms = await timeInteraction(page, {
      html: '<div x-tabs active-tab="0"><section title="One">First</section><section title="Two">Second</section></div>',
      trigger: '#perf-host .x-tabs__tab:nth-of-type(2)',
      doneSelector: '#perf-host .x-tabs__tab:nth-of-type(2).x-tabs__tab--active',
    });
    logPerfResult({ category: 'interaction', name: 'Tab Switch', value: ms, unit: 'ms', threshold: 100 });
    expect(ms, 'click to active tab, measured in the page').toBeLessThan(100);
  });

  test('Nav toggle should collapse in under 100ms', async ({ page }) => {
    await page.waitForFunction(() => Boolean((window as any).WBSite?.currentPage));
    const ms = await timeInteraction(page, { trigger: '.nav__toggle', doneSelector: '.site__nav.x-sidebar--collapsed' });
    logPerfResult({ category: 'interaction', name: 'Nav Toggle', value: ms, unit: 'ms', threshold: 100 });
    expect(ms, 'click to collapsed nav, measured in the page').toBeLessThan(100);
  });
});
