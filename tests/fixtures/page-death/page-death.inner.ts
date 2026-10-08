/**
 * Deliberate failures for page-death-diagnostics-name-the-cause.spec.ts (#961).
 * Each test leaves a page.evaluate promise with no resolver, forces garbage
 * collection, and so fails with "Promise was collected" -- the real browser
 * error, through Playwright's real rewrite. What differs is the main world:
 * alive in one, its scripts stopped in the other.
 */
import { test, expect, type Page } from '../offline';

/** The first heartbeat, or (with no heartbeat installed) a page old enough to have had several. */
async function heartbeatStarted(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => /^\d+ \d+$/.test(document.documentElement.getAttribute('data-pw-heartbeat') || '') || performance.now() > 1000), { timeout: 5000 }).toBe(true);
}

/** Await a promise the page dropped, collecting garbage until the browser says so. */
async function awaitOrphanedPromise(page: Page): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  let settled = false;
  const orphan = page.evaluate(() => new Promise(() => { /* resolver dropped */ })).finally(() => { settled = true; });
  orphan.catch(() => {});
  await expect.poll(async () => { await cdp.send('HeapProfiler.collectGarbage'); return settled; }, { timeout: 10_000 }).toBe(true);
  await orphan;
}

test('alive: an orphaned promise in a running page', async ({ page }) => {
  await page.setContent('<p>alive</p>');
  await heartbeatStarted(page);
  await awaitOrphanedPromise(page);
});

test('dead: the main world stops running its own scripts', async ({ page }) => {
  await page.setContent('<p>dead</p>');
  await heartbeatStarted(page);
  const cdp = await page.context().newCDPSession(page);
  // The DOM stays and CDP still evaluates, but the page's own timers never fire again.
  await cdp.send('Emulation.setScriptExecutionDisabled', { value: true });
  await awaitOrphanedPromise(page);
});

test('passes: a passing test carries no diagnostics and no markup change', async ({ page }) => {
  await page.setContent('<p>fine</p>');
  await heartbeatStarted(page);
  expect(await page.locator('p').textContent()).toBe('fine');
});
