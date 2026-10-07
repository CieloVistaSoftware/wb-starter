import { test, expect } from '../fixtures/offline';

/**
 * #1488: showDoc() awaited the doc fetch, then wrote into `liveDocBody` -- the
 * shared variable, which a newer selection had already pointed at ITS panel.
 * Pick a behavior whose doc is slow, pick another before it arrives, and the
 * first doc landed under the second behavior's name. Found as a CI flake in
 * behavior-doc-coverage's slow-404 self-test, which read the auto-picked first
 * row's late doc as its own.
 *
 * Here x-tooltip's doc is held until x-toast has been picked and shown, then
 * answers with a marker. The marker must never appear in the panel.
 */
test.use({ serviceWorkers: 'block' }); // #1349: this spec holds a request with page.route

const MARKER = 'STALE-DOC-MARKER-1488';

test('a slow doc never lands under a behavior picked after it (#1488)', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/?page=behaviors');
  await page.waitForSelector('#behaviors-search', { timeout: 30000 });
  await page.fill('#behaviors-search', 'x-');
  await page.waitForFunction(() => document.querySelectorAll('.behaviors-search-results__row').length > 50, null, { timeout: 30000 });

  // The slow doc is held until the test opens the gate (#1516), so the second
  // pick lands while it is in flight by construction, not by a 2s guess.
  let openGate!: () => void;
  const gate = new Promise<void>((r) => { openGate = r; });
  let released = false;
  await page.route('**/docs/behaviors/tooltip.md*', async (route) => {
    await gate;
    released = true;
    await route.fulfill({ status: 200, contentType: 'text/markdown', body: `# ${MARKER}\n\nThis is the slow doc.` });
  });

  const pick = (token: string) => page.evaluate((t) => {
    const row = document.querySelector(`.behaviors-search-results__row[data-browse-token="${t}"]`) as HTMLElement | null;
    row?.click();
    return !!row;
  }, token);

  const slowFetch = page.waitForRequest('**/docs/behaviors/tooltip.md*', { timeout: 10_000 });
  expect(await pick('x-tooltip'), 'x-tooltip has a row').toBe(true);
  await slowFetch; // the slow fetch is in flight and held
  expect(await pick('x-toast'), 'x-toast has a row').toBe(true);
  // x-toast's own doc has landed before the stale one is let go.
  await expect(page.locator('#behaviors-live-doc-body')).toContainText(/toast/i, { timeout: 10_000 });
  openGate();

  // Let the slow doc arrive, then give its (stale) render every chance to land.
  await expect.poll(() => released, { timeout: 10_000 }).toBe(true);
  await page.evaluate(() => (window as any).WB?.settled?.({ timeout: 10_000 })).catch(() => {});

  const body = page.locator('#behaviors-live-doc-body');
  await expect(body, 'the panel shows x-toast, not nothing').not.toHaveText('');
  await expect(body, 'x-tooltip\'s late doc landed under x-toast').not.toContainText(MARKER);
});
