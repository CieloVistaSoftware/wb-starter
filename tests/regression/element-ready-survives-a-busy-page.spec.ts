import { test, expect, type Page } from '../fixtures/offline';
import { elementReady, buildInView } from '../base';

/**
 * #1818: the nightly of 2026-10-10 failed stagelight-spotlight-stays-in-its-
 * demo-box on demos/playground.html with "locator.evaluate: Execution context
 * was destroyed, most likely because of a navigation" -- from elementReady(),
 * on a page that never navigated. The browser's own error underneath was
 * "Runtime.callFunctionOn: Promise was collected", 10 ms AFTER the element
 * became ready (measured with a probe in the helper: the awaited promise had
 * already resolved).
 *
 * Mechanism: the inspector holds the promise an evaluate awaits only weakly,
 * and for a by-value evaluate that is Playwright's async wrapper, which nothing
 * references once it has fulfilled. A page that allocates in microtasks right
 * then -- what a page does when the thing just built kicks off more building --
 * lets a scavenge collect it before the inspector's then-callback runs.
 *
 * This page reproduces exactly that, with no WB and no load: the element is
 * marked ready, and the page immediately churns microtasks that allocate. An
 * awaited-promise elementReady() failed this most of the time; the helpers must
 * now come back clean every time.
 */

const ROUNDS = 6;

/** A host that becomes x-ready after `ms` (long enough for the helper to be waiting), then churns. */
async function readyThenChurn(page: Page, id: string, ms: number): Promise<void> {
  await page.evaluate(({ id, ms }) => {
    const el = document.createElement('div');
    el.id = id;
    el.textContent = id;
    document.body.append(el);
    setTimeout(() => {
      // The page's own reaction to the element becoming ready: a burst of
      // allocating microtasks. Registered now, after the helper started
      // watching, so it runs after the helper's own observer has resolved --
      // i.e. while the helper's evaluate is being answered.
      new MutationObserver(() => {
        for (let k = 0; k < 20000; k++) queueMicrotask(() => { void new Array(64).fill(k); });
      }).observe(el, { attributes: true });
      el.setAttribute('x-ready', '');
    }, ms);
  }, { id, ms });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/fixtures/blank.html');
});

test('elementReady() survives a page that is busy the moment the element is ready (#1818)', async ({ page }) => {
  const failures: string[] = [];
  for (let i = 0; i < ROUNDS; i++) {
    await readyThenChurn(page, `host-${i}`, 300);
    await elementReady(page.locator(`#host-${i}`), 10000).catch((e: Error) => { failures.push(`round ${i}: ${e.message.split('\n')[0]}`); });
  }
  expect(failures, failures.join('\n')).toEqual([]);
});

test('buildInView() survives the same busy page (#1818)', async ({ page }) => {
  const failures: string[] = [];
  for (let i = 0; i < ROUNDS; i++) {
    await readyThenChurn(page, `view-${i}`, 300);
    await buildInView(page.locator(`#view-${i}`), 10000).catch((e: Error) => { failures.push(`round ${i}: ${e.message.split('\n')[0]}`); });
  }
  expect(failures, failures.join('\n')).toEqual([]);
});

test('elementReady() still names the element when it never becomes ready', async ({ page }) => {
  await page.evaluate(() => { const el = document.createElement('section'); el.id = 'never'; document.body.append(el); });
  const err = await elementReady(page.locator('#never'), 300).then(() => null, (e: Error) => e.message);
  expect(err).toContain('<section id="never">');
  expect(err).toContain('never became x-ready within 300ms');
});
