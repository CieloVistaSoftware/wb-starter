import type { Page } from '@playwright/test';

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
