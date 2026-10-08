/**
 * behaviors-panel.ts (#727)
 *
 * Drives the behaviors showcase the way a reader does: search a token, pick a
 * variant row, read what renders in the live panel.
 *
 * Before #664 the page hosted every example as a `<div x-demo>` section, and specs
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
import { expect, Page, Locator } from '../fixtures/offline';

import { settlePage } from '../base';
export const EXAMPLE_ROOT = '#behaviors-live-example';

// A row is matched by its LABEL as well as its browse token. #764 split every
// behavior with a native host into two forms: the semantic row is labelled by
// the element (`button`) while its data-browse-token stays the x- attribute
// (`x-button`). Matching the token alone meant `openBehaviorsPanel(page,
// 'button')` -- the native <button> this driver's first caller exists to test --
// waited 30s for a row that no longer carries that token.


/** Load the showcase and filter the list to one behavior. */
export async function openBehaviorsPanel(page: Page, token: string): Promise<void> {
  await page.goto('/?page=behaviors');
  await page.waitForSelector('#behaviors-search', { timeout: 30000 });
  await page.fill('#behaviors-search', token);
  await page.waitForFunction(
    (t) => [...document.querySelectorAll('.behaviors-search-results__row')]
      .some((r) => (r.getAttribute('data-label') === t || r.getAttribute('data-browse-token') === t)),
    token,
    { timeout: 30000 },
  );
}

/** Every variant this behavior offers, in list order. */
export async function variantsOf(page: Page, token: string): Promise<string[]> {
  return page.evaluate((t) =>
    [...document.querySelectorAll('.behaviors-search-results__row')]
      .filter((r) => (r.getAttribute('data-label') === t || r.getAttribute('data-browse-token') === t))
      .map((r) => r.getAttribute('data-variant') || ''),
    token,
  );
}

/**
 * Render one variant and wait for it to appear in the panel.
 * Throws if that behavior has no such variant row, rather than silently
 * measuring whatever happened to be on screen.
 */
// `variant` is null for a behavior with a single, variant-less row (x-accordion,
// x-timeline): its row carries no data-variant at all, and getAttribute() reads
// that as null, so null is what matches it.
export async function renderVariant(page: Page, token: string, variant: string | null): Promise<void> {
  // Wait for THIS row, not just any row for the token: openBehaviorsPanel
  // returns as soon as one match exists, and the list is still filling in.
  // Without this the first variant asked for could be missing purely because it
  // had not rendered yet -- which read as "no such variant" and was wrong.
  await page.waitForFunction(
    ({ t, v }) => [...document.querySelectorAll('.behaviors-search-results__row')]
      .some((r) => (r.getAttribute('data-label') === t || r.getAttribute('data-browse-token') === t)
                && r.getAttribute('data-variant') === v),
    { t: token, v: variant },
    { timeout: 15000 },
  ).catch(() => { /* fall through to the explicit assertion below */ });

  const picked = await page.evaluate(({ t, v, root }) => {
    const row = [...document.querySelectorAll('.behaviors-search-results__row')]
      .find((r) => (r.getAttribute('data-label') === t || r.getAttribute('data-browse-token') === t)
                && r.getAttribute('data-variant') === v) as HTMLElement | undefined;
    if (!row) return false;
    // #1457: mark what is showing now, so the wait below cannot be satisfied
    // by the previous variant's example while the new one is still coming.
    (window as any).__rvPrevious = new Set(document.querySelectorAll(`${root} > *`));
    row.click();
    return true;
  }, { t: token, v: variant, root: EXAMPLE_ROOT });

  expect(picked, `no ${token} row with variant "${variant}" in the browse list`).toBe(true);
  // #1457: wait for the example to be APPLIED, not merely present. This used
  // to wait for "any child" and then sleep 250ms; on a starved CI runner the
  // sleep ran out first and the variant specs measured raw, unstyled markup
  // (x-alert info/success/warning read as one bare <div>). The root carries
  // x-ready once WB has applied its behavior; WB.settled() then covers the
  // work that application started (#962).
  await page.waitForFunction(
    (sel) => {
      const previous: Set<Element> = (window as any).__rvPrevious || new Set();
      const el = document.querySelector(`${sel} > *`);
      return !!el && !previous.has(el) && el.hasAttribute('x-ready');
    },
    EXAMPLE_ROOT,
    { timeout: 15000 },
  );
  await settlePage(page, { timeout: 15000 });
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
