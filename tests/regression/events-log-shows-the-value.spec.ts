import { test, expect } from '../fixtures/offline';

/**
 * The Behaviors page's Events log says WHAT was acted on, not only where.
 *
 * John, 2026-10-16, on x-breadcrumb: "What does user need to know the value of
 * what was selected? Not just the element name?" An entry read
 * `click breadcrumb-separator-span-3` -- an id, with no sign it was
 * "Electronics". Now a click names the clicked text, a change names the value,
 * and a behavior's own declared event (wb:select:change, from the schema index)
 * is logged with its detail.
 */
async function pick(page, rx: string) {
  await page.evaluate((src: string) => {
    const row = [...document.querySelectorAll('.behaviors-search-results__row')].find((r) => new RegExp(src).test(r.textContent || ''));
    (row as HTMLElement).click();
  }, rx);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/?page=behaviors');
  await expect(page.locator('.behaviors-live__body')).toBeVisible({ timeout: 20000 });
});

test('a breadcrumb click logs the item that was clicked', async ({ page }) => {
  await pick(page, 'x-breadcrumb');
  const item = page.locator('#behaviors-live-stage').getByText('Electronics').first();
  await expect(item).toBeVisible({ timeout: 15000 });
  await item.click();
  const entry = page.locator('.behaviors-live__events-item').first();
  await expect(entry.locator('.behaviors-live__events-type')).toHaveText('click');
  await expect(entry.locator('.behaviors-live__events-value')).toHaveText('Electronics');
});

test('a select change logs its value, and the behavior\'s own wb:select:change with its detail', async ({ page }) => {
  await pick(page, '^\\s*select');
  const sel = page.locator('#behaviors-live-stage select').first();
  await expect(sel).toBeVisible({ timeout: 15000 });
  const value = await sel.locator('option').nth(1).getAttribute('value');
  await sel.selectOption(value!);
  const items = page.locator('.behaviors-live__events-item');
  await expect(items.filter({ has: page.locator('.behaviors-live__events-type', { hasText: /^change$/ }) }).first()
    .locator('.behaviors-live__events-value')).toHaveText(value!);
  await expect(items.filter({ has: page.locator('.behaviors-live__events-type', { hasText: 'wb:select:change' }) }).first()
    .locator('.behaviors-live__events-value')).toHaveText(JSON.stringify({ value }));
});
