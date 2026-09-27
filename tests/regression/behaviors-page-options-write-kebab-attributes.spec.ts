/**
 * An option row on the behaviors page must write the attribute a reader
 * would type -- kebab-case -- and replace the example's own value, not sit
 * beside it.
 *
 * John: "imagePosition=left / imagePosition=right -- these do not work
 * correctly." withOption() wrote the schema's camelCase name
 * (imagePosition="right"); HTML lowercases it to `imageposition`, and the
 * example's own image-position="start" was still there and won. Its cleanup
 * regexes were built as '\s' + name in plain strings -- "s", not whitespace --
 * so they never matched. The option audit found 25 rows dead the same way
 * (x-input inputType, x-switch labelPosition, x-textarea showCount, ...).
 */
import { test, expect, Page } from '../fixtures/offline';

test.describe.configure({ timeout: 120_000 });

async function openGroup(page: Page, token: string) {
  const rows = page.locator(`.behaviors-search-results__row[data-browse-token="${token}"]`);
  await expect(rows.first()).toBeAttached({ timeout: 30_000 });
  const group = page.locator('#behaviors-search-results details', { has: rows.first() });
  if (await group.count() && !(await group.first().evaluate((d) => (d as HTMLDetailsElement).open))) {
    await group.first().locator(':scope > summary').click();
  }
  return rows;
}

/** Click the row for prop=value and return the example markup it produced. */
async function pick(page: Page, token: string, prop: string, value: string) {
  const rows = await openGroup(page, token);
  const before = await page.evaluate(() => document.getElementById('behaviors-live-example')?.innerHTML ?? '');
  await rows.and(page.locator(`[data-prop="${prop}"][data-variant="${value}"]`)).first().click();
  await page.waitForFunction((prev) => {
    const ex = document.getElementById('behaviors-live-example');
    return !!ex && ex.children.length > 0 && ex.innerHTML !== prev;
  }, before, { timeout: 20_000 });
  return (await page.locator('#behaviors-live-code').textContent()) ?? '';
}

test.beforeEach(async ({ page }) => { await page.goto('/?page=behaviors'); });

for (const side of ['left', 'right']) {
  test(`x-cardhorizontal imagePosition=${side} puts the image on the ${side}`, async ({ page }) => {
    const code = await pick(page, 'x-cardhorizontal', 'imagePosition', side);
    expect(code, 'kebab-case attribute, written once').toMatch(new RegExp(`image-position="${side}"`));
    expect(code.match(/\simage-?position\s*=/gi) ?? [], 'no second, stale spelling').toHaveLength(1);

    const card = page.locator('#behaviors-live-example [x-cardhorizontal]');
    const img = await card.locator('img').boundingBox();
    const title = await card.locator('h1, h2, h3, h4').first().boundingBox();
    if (side === 'left') expect(img!.x + img!.width).toBeLessThanOrEqual(title!.x + 1);
    else expect(title!.x + title!.width).toBeLessThanOrEqual(img!.x + 1);
  });
}

// Every camelCase option the audit found dead: each must land as kebab-case.
const CAMEL = [
  ['x-input', 'inputType', 'input-type'],
  ['x-switch', 'labelPosition', 'label-position'],
  ['x-textarea', 'showCount', 'show-count'],
  ['x-progress', 'showValue', 'show-value'],
] as const;
for (const [token, prop, attr] of CAMEL) {
  test(`${token} ${prop} rows are written as ${attr}`, async ({ page }) => {
    const rows = await openGroup(page, token);
    const row = rows.and(page.locator(`[data-prop="${prop}"]`)).first();
    await expect(row, `${token} must offer a ${prop} row`).toBeAttached();
    const value = (await row.getAttribute('data-variant'))!;
    const code = await pick(page, token, prop, value);
    expect(code).toMatch(new RegExp(`\\s${attr}(="[^"]*")?[\\s>]`));
    expect(code, 'the camelCase spelling must not be written').not.toMatch(new RegExp(`\\s${prop}[=\\s>]`));
  });
}
