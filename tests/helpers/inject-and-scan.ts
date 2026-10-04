import type { Page } from '@playwright/test';
import { waitForWB, wbIdle } from '../base';

/**
 * Load the test harness, inject markup into a fresh container, scan it, and
 * wait until every injection has settled (#983).
 *
 *     await injectAndScan(page, '<button x-ripple>Click</button>');
 *     await injectAndScan(page, html, { containerId: 'darkmode-test-container', scrollIntoView: true });
 *
 * WHAT IT REPLACES: about 40 spec files each carried their own copy of this
 * function, emitted by a generator that has since been deleted. 33 of them
 * ended in a fixed 500ms waitForTimeout, preceded by a local waitForWB()
 * that slept another 100ms. Both were guesses at how long building takes, and
 * a guess is wrong whenever the machine is busier than when it was made (#962).
 * They also carried a dead eager-loading block,
 * `querySelectorAll('.x-ready').forEach(el => el.setAttribute('', ''))`, which
 * matched nothing on freshly injected markup and would have thrown
 * (InvalidCharacterError) if it ever had. It is gone, not ported.
 *
 * THE WAIT, each step a signal rather than a duration:
 *   1. waitForWB() -- the runtime and its behavior registry exist.
 *   2. `await WB.scan(container)` -- returns when the scan has finished
 *      starting and awaiting its injections.
 *   3. wbIdle() -- `WB.settled()`: every injection has called back. It rejects
 *      on timeout, so a hung build fails loudly instead of passing quietly.
 *
 * `x-ready` / settled means SETTLED, not SUCCEEDED: the assertions after this
 * call still do the verifying.
 *
 * OPTIONS cover exactly the variations the old copies had:
 *   containerId    -- the injected container's id (default 'test-container').
 *   scrollIntoView -- scroll the container into view before scanning. wb-lazy's
 *                     scan() is IntersectionObserver-based, so a few specs
 *                     scrolled first; the rest did not (default false).
 */
export const TEST_HARNESS_URL = '/demos/test-harness.html';

export interface InjectAndScanOptions {
  containerId?: string;
  scrollIntoView?: boolean;
}

export async function injectAndScan(
  page: Page,
  html: string,
  options: InjectAndScanOptions = {}
): Promise<void> {
  const containerId = options.containerId ?? 'test-container';

  await page.goto(TEST_HARNESS_URL);
  await waitForWB(page);

  await page.evaluate(({ id, h }) => {
    const container = document.createElement('div');
    container.id = id;
    container.innerHTML = h;
    document.body.appendChild(container);
  }, { id: containerId, h: html });

  if (options.scrollIntoView) {
    await page.locator(`#${containerId}`).scrollIntoViewIfNeeded();
  }

  await page.evaluate(async (id) => {
    await (window as any).WB.scan(document.getElementById(id));
  }, containerId);

  await wbIdle(page);
}
