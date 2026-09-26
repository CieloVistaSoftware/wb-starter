import { expect, type Page } from '@playwright/test';

/**
 * Bring one behavior's demo into the DOM on /?page=behaviors.
 *
 * That page used to render every demo inline. It is a searchable BROWSER now:
 * nothing exists until a behavior is searched for and selected. Specs written
 * against the old page just `goto()` and wait for `[x-accordion]`, which never
 * arrives -- they burn their timeout in setup and never reach the assertions
 * they exist to make (#910). A harness that cannot start reports the same red
 * as a real defect, which is how these clusters stayed opaque.
 *
 * Eight specs had each grown their own copy of this. This is the shared one;
 * the copies should collapse into it as they are touched.
 */
export async function openBehaviorsPage(page: Page): Promise<void> {
  await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
  await page.waitForFunction(() => (window as any).WBSite?.currentPage, { timeout: 20000 });
}

/**
 * Search for `token` (e.g. 'x-accordion') and select its first result.
 * Returns false when the behavior has no row, so a caller can skip rather than
 * fail on a behavior the browser genuinely does not list.
 */
export async function revealBehavior(page: Page, token: string): Promise<boolean> {
  await openBehaviorsPage(page);
  await page.fill('#behaviors-search', token);

  const row = `.behaviors-search-results__row[data-browse-token="${token}"]`;
  const found = await page.locator(row).first()
    .waitFor({ state: 'attached', timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  if (!found) return false;

  await page.locator(row).first().click();
  // The stage renders asynchronously after selection.
  await page.waitForTimeout(400);
  return true;
}

/** revealBehavior, then wait for the behavior's own element to exist on the stage. */
export async function revealAndWaitFor(page: Page, token: string, selector = ''): Promise<boolean> {
  if (!(await revealBehavior(page, token))) return false;
  const sel = selector || `[${token}]`;
  return page.waitForSelector(sel, { state: 'attached', timeout: 10000 })
    .then(() => true)
    .catch(() => false);
}

/**
 * Load the page, pick `token` out of the browse list, and wait until ITS example
 * has been injected and scanned. Throws (via expect) if the behavior has no row,
 * so a caller can never go vacuous by measuring nothing.
 *
 * The same barrier as show() in tests/behaviors/remaining-coverage.spec.ts:
 * renderSource() highlights `#behaviors-live-code pre code` only after the stage
 * scan has resolved, so `.hljs` on a freshly built <code>, with the example
 * markup changed from what was there before the click (#771 preselects a row on
 * load), strictly follows behavior attachment. #995 collapses behaviors with
 * several options into a <details> group; it is opened by its summary the way a
 * reader does, or click() waits for a row that is never visible.
 */
export async function showBehavior(page: Page, token: string): Promise<void> {
  await page.goto('/?page=behaviors');
  await pickBehavior(page, token);
}

/** showBehavior() on a page that is already loaded: pick the row, wait for its render. */
export async function pickBehavior(page: Page, token: string): Promise<void> {
  // The list fills from two fetches; the second rebuilds it, so wait for the
  // full list rather than the first handful of rows.
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 100,
    null,
    { timeout: 30000 },
  );
  const rows = page.locator(`.behaviors-search-results__row[data-browse-token="${token}"]`);
  await expect(rows.first(), `${token} must appear in the behaviors list`).toBeAttached();
  const group = page.locator('#behaviors-search-results details', { has: rows.first() });
  if (await group.count() && !(await group.first().evaluate((d) => (d as HTMLDetailsElement).open))) {
    await group.first().locator(':scope > summary').click();
  }
  await expect(rows.first(), `${token}'s row must be visible to be picked`).toBeVisible();
  // #771 preselects the first row on load. Clicking the row that is already
  // shown re-renders identical markup, which the "markup changed" barrier below
  // would wait on forever -- so an already-rendered selection is simply done.
  const alreadyShown = await rows.first().evaluate((row) =>
    row.getAttribute('aria-current') === 'true'
    && !!document.querySelector('#behaviors-live-code pre code.hljs')
    && (document.getElementById('behaviors-live-example')?.children.length ?? 0) > 0);
  if (alreadyShown) return;
  const before = await page.evaluate(
    () => document.getElementById('behaviors-live-example')?.innerHTML ?? '',
  );
  await rows.first().click();
  await page.waitForFunction(
    (prev) => {
      const code = document.querySelector('#behaviors-live-code pre code');
      const example = document.getElementById('behaviors-live-example');
      return !!code && code.classList.contains('hljs')
        && !!example && example.children.length > 0
        && example.innerHTML !== prev;
    },
    before,
    { timeout: 20000 },
  );
  // The render barrier above can be met by a render that is then replaced:
  // measured on x-dropdown under 4 workers, 2 runs in 4 found the host
  // un-upgraded (raw <button>s, no .x-dropdown__menu) right after it, and
  // upgraded ~1s later. So also wait for the per-element completion signal
  // (#970: x-ready is stamped once an element has no injections in flight)
  // on every host of THIS behavior in the example.
  if (/^x-[a-z0-9-]+$/.test(token)) {
    await page.waitForFunction(
      (t) => [...document.querySelectorAll(`#behaviors-live-example [${t}]`)]
        .every((el) => el.hasAttribute('x-ready')),
      token,
      { timeout: 20000 },
    );
  }
}
