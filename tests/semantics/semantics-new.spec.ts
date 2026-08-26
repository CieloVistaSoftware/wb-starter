import { test, expect } from '@playwright/test';

/**
 * Timeline behavior (#820).
 *
 * This file used to cover six "new semantic behaviors" and all eight of its
 * tests failed on a clean checkout. The reasons were not what the failures
 * looked like:
 *
 *   - Five of the six tags — x-list, x-desclist, x-empty, x-stat,
 *     x-json — are registered in NO map, and their modules are imported by
 *     nothing. The failures read as "the behavior didn't run"; nothing was
 *     ever going to run. That dead code is #827, and it is a product
 *     decision (register them, or delete them) rather than something to
 *     paper over here.
 *
 *   - The harness could not work either: `page.setContent()` runs against
 *     about:blank, so its root-absolute `<script src="/src/index.js">` had
 *     nothing to resolve against and WB never initialised (#735, #691). The
 *     fixtures were also malformed — `<div ...></ul>`.
 *
 * Timeline is the one behavior here that is genuinely registered
 * (`[x-timeline]` in elementMap, `x-timeline` in extensionMap), so it is what
 * this file now covers — against measured behaviour rather than assumed
 * naming. The two original timeline assertions were both wrong about names
 * while the feature itself worked:
 *
 *   '.x-timeline__item'  — the rendered class is `x-timeline-item`, single
 *                           hyphen, not BEM double-underscore.
 *
 * The #448 assertion that lived here is gone with the component tags: it
 * checked that a <div x-timeline> host did not also carry a `[x-timeline]` class.
 * On a <div x-timeline> host the behavior adds that class unconditionally
 * (timeline.js:10), so the assertion inverted the moment the tag did — caught
 * because the component migration rewrote the host out from under it.
 */

/** Render markup into a page that has WB loaded, then upgrade it. */
async function render(page: import('@playwright/test').Page, markup: string) {
  await page.goto('/demos/autoinject.html');
  await page.waitForFunction(() => !!(window as any).WB);
  await page.evaluate((html) => { document.body.innerHTML = html; }, markup);
  await page.evaluate(async () => { await (window as any).WB.scan(document.body); });
  await page.waitForSelector('.x-timeline-item', { timeout: 5000 });
}

test.describe('Timeline behavior', () => {
  test('renders one entry per item', async ({ page }) => {
    await render(page, '<div x-timeline id="t" items="Step 1, Step 2"></div>');

    const items = page.locator('#t .x-timeline-item');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toHaveText('Step 1');
    await expect(items.nth(1)).toHaveText('Step 2');
  });

  test('parses the items attribute onto the element', async ({ page }) => {
    await render(page, '<div x-timeline id="t" items="Step 1, Step 2"></div>');

    // The behavior exposes the parsed list for template binding, and trims
    // each entry — "Step 1, Step 2" must not yield " Step 2".
    const items = await page.evaluate(() => (document.getElementById('t') as any).items);
    expect(items).toEqual(['Step 1', 'Step 2']);
  });

  test('ignores empty entries from a trailing or doubled comma', async ({ page }) => {
    await render(page, '<div x-timeline id="t" items="Step 1,, Step 2,"></div>');

    const items = await page.evaluate(() => (document.getElementById('t') as any).items);
    expect(items).toEqual(['Step 1', 'Step 2']);
    await expect(page.locator('#t .x-timeline-item')).toHaveCount(2);
  });

});
