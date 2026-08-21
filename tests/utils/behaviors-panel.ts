/**
 * behaviors-panel.ts (#727)
 *
 * Drives the behaviors showcase the way a reader does: search a token, pick a
 * variant row, read what renders in the live panel.
 *
 * Before #664 the page hosted every example as a `<wb-demo>` section, and specs
 * scanned the page for them. Those sections are gone, so five variant specs
 * were scanning for elements that no longer exist — and one of them,
 * `button-size-variant-classes`, located buttons by `hasText: 'Primary'`, which
 * now matches the browse-list ROWS (whose variant column reads "primary").
 * Identical by design, so it "measured" three identical backgrounds. A test
 * pointing at the wrong elements is worse than one that fails outright.
 *
 * Everything here reads from inside `#behaviors-live-example` for that reason —
 * the rendered example, never a list row.
 */
import { expect, Page, Locator } from '@playwright/test';

export const EXAMPLE_ROOT = '#behaviors-live-example';

/** Load the showcase and filter the list to one behavior. */
export async function openBehaviorsPanel(page: Page, token: string): Promise<void> {
  await page.goto('/?page=behaviors');
  await page.waitForSelector('#behaviors-search', { timeout: 30000 });
  await page.fill('#behaviors-search', token);
  await page.waitForFunction(
    (t) => [...document.querySelectorAll('.behaviors-search-results__row')]
      .some((r) => r.getAttribute('data-browse-token') === t),
    token,
    { timeout: 30000 },
  );
}

/** Every variant this behavior offers, in list order. */
export async function variantsOf(page: Page, token: string): Promise<string[]> {
  return page.evaluate((t) =>
    [...document.querySelectorAll('.behaviors-search-results__row')]
      .filter((r) => r.getAttribute('data-browse-token') === t)
      .map((r) => r.getAttribute('data-variant') || ''),
    token,
  );
}

/**
 * Render one variant and wait for it to appear in the panel.
 * Throws if that behavior has no such variant row, rather than silently
 * measuring whatever happened to be on screen.
 */
export async function renderVariant(page: Page, token: string, variant: string): Promise<void> {
  // Wait for THIS row, not just any row for the token: openBehaviorsPanel
  // returns as soon as one match exists, and the list is still filling in.
  // Without this the first variant asked for could be missing purely because it
  // had not rendered yet -- which read as "no such variant" and was wrong.
  await page.waitForFunction(
    ({ t, v }) => [...document.querySelectorAll('.behaviors-search-results__row')]
      .some((r) => r.getAttribute('data-browse-token') === t
                && r.getAttribute('data-variant') === v),
    { t: token, v: variant },
    { timeout: 15000 },
  ).catch(() => { /* fall through to the explicit assertion below */ });

  const picked = await page.evaluate(({ t, v }) => {
    const row = [...document.querySelectorAll('.behaviors-search-results__row')]
      .find((r) => r.getAttribute('data-browse-token') === t
                && r.getAttribute('data-variant') === v) as HTMLElement | undefined;
    if (!row) return false;
    row.click();
    return true;
  }, { t: token, v: variant });

  expect(picked, `no ${token} row with variant "${variant}" in the browse list`).toBe(true);
  await page.waitForFunction(
    (sel) => !!document.querySelector(`${sel} > *`),
    EXAMPLE_ROOT,
    { timeout: 10000 },
  );
  await page.waitForTimeout(250);
}

/** The rendered example's root element — never a list row. */
export function example(page: Page): Locator {
  return page.locator(`${EXAMPLE_ROOT} > *`).first();
}

/** A computed style of the rendered example. */
export async function exampleStyle(page: Page, prop: string): Promise<string> {
  return example(page).evaluate(
    (el, p) => getComputedStyle(el).getPropertyValue(p),
    prop,
  );
}

/** Render each variant in turn and collect one computed value from each. */
export async function styleAcrossVariants(
  page: Page,
  token: string,
  variants: string[],
  prop: string,
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const v of variants) {
    await renderVariant(page, token, v);
    out[v] = await exampleStyle(page, prop);
  }
  return out;
}
