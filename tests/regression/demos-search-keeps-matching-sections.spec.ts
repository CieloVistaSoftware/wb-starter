import { test, expect } from '../fixtures/offline';

/**
 * Searching the Demos page keeps the sections whose cards match (#857).
 *
 * The 4.0.0 prefix rename turned the section check's tag selector `wb-card-link`
 * into `x-card-link`, a tag that no longer exists (cards are
 * `<div x-cardlink>`). So `section.querySelectorAll('x-card-link')` found
 * nothing, every section counted as having no visible card, and the first
 * keystroke hid every section -- the matching cards included. Clearing the
 * box did not bring them back.
 */
test.describe('Demos search (#857)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=demos');
    await expect(page.locator('#demos-search')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.demos-category').first()).toBeVisible();
  });

  test('a query keeps the section of the card it matches', async ({ page }) => {
    const total = await page.locator('.demos-category').count();
    expect(total, 'the page has demo sections').toBeGreaterThan(1);
    await page.locator('#demos-search').fill('card behaviors');
    // Sections are collapsed <details>; what search controls is `hidden`.
    const section = page.locator('.demos-category[category="Card Behaviors"]');
    await expect(section).toBeVisible();
    await expect(section.locator('[x-cardlink]').first()).toHaveJSProperty('hidden', false);
    // Poll, never a one-shot count (#961). The checks above were already true
    // before the filter ran, so they waited for nothing; and fill() can land
    // before the page's script attaches its input listener, in which case the
    // filter only runs when the search-index fetch re-fires the event. Read
    // once, the count caught that window under load: 11 of 11 sections.
    const shown = () => page.locator('.demos-category:not([hidden])').count();
    await expect.poll(shown, { message: 'sections with no match are hidden', timeout: 10_000 }).toBeLessThan(total);
    expect(await shown(), 'sections left showing for "card behaviors"').toBeGreaterThanOrEqual(1);
  });

  test('clearing the search shows every section again', async ({ page }) => {
    const total = await page.locator('.demos-category').count();
    await page.locator('#demos-search').fill('card behaviors');
    await page.locator('#demos-search').fill('');
    await expect(page.locator('.demos-category:not([hidden])')).toHaveCount(total);
  });
});
