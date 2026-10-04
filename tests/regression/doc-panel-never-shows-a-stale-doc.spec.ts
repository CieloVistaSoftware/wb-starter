import { test, expect } from '../fixtures/offline';

/**
 * #1488: showDoc() awaited the doc fetch, then wrote into `liveDocBody` -- the
 * shared variable, which a newer selection had already pointed at ITS panel.
 * Pick a behavior whose doc is slow, pick another before it arrives, and the
 * first doc landed under the second behavior's name. Found as a CI flake in
 * behavior-doc-coverage's slow-404 self-test, which read the auto-picked first
 * row's late doc as its own.
 *
 * Here x-tooltip's doc is held 2s and answers with a marker; x-toast is picked
 * during the hold. The marker must never appear in the panel.
 */
test.use({ serviceWorkers: 'block' }); // #1349: this spec holds a request with page.route

const MARKER = 'STALE-DOC-MARKER-1488';

test('a slow doc never lands under a behavior picked after it (#1488)', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/?page=behaviors');
  await page.waitForSelector('#behaviors-search', { timeout: 30000 });
  await page.fill('#behaviors-search', 'x-');
  await page.waitForFunction(() => document.querySelectorAll('.behaviors-search-results__row').length > 50, null, { timeout: 30000 });

  let released = false;
  await page.route('**/docs/behaviors/tooltip.md*', async (route) => {
    await new Promise((r) => setTimeout(r, 2000));
    released = true;
    await route.fulfill({ status: 200, contentType: 'text/markdown', body: `# ${MARKER}\n\nThis is the slow doc.` });
  });

  const pick = (token: string) => page.evaluate((t) => {
    const row = document.querySelector(`.behaviors-search-results__row[data-browse-token="${t}"]`) as HTMLElement | null;
    row?.click();
    return !!row;
  }, token);

  expect(await pick('x-tooltip'), 'x-tooltip has a row').toBe(true);
  await page.waitForTimeout(100); // within the 2s hold: the slow fetch is in flight
  expect(await pick('x-toast'), 'x-toast has a row').toBe(true);

  // Let the slow doc arrive, then give its (stale) render every chance to land.
  await expect.poll(() => released, { timeout: 10_000 }).toBe(true);
  await page.evaluate(() => (window as any).WB?.settled?.({ timeout: 10_000 })).catch(() => {});

  const body = page.locator('#behaviors-live-doc-body');
  await expect(body, 'the panel shows x-toast, not nothing').not.toHaveText('');
  await expect(body, 'x-tooltip\'s late doc landed under x-toast').not.toContainText(MARKER);
});
