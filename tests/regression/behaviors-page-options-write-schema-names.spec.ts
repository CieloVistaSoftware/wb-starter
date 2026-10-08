/**
 * An option row on the behaviors page must write the attribute under the
 * schema's own property name -- camelCase, imagePosition (#1526, #1125) --
 * and replace the example's own value in any spelling, not sit beside it.
 *
 * This spec used to assert the opposite: kebab-case, image-position. The page
 * wrote dashed names because behaviors read only the dashed spelling; #1125
 * made every behavior read both (camelcase-options-read-like-kebab.spec.ts
 * proves it on every host), so the page now teaches the canonical spelling.
 * The history below is why the row must still REPLACE whatever spelling the
 * example already carries.
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
import { openGroup as openGroupAndSettle } from '../helpers/behaviors-page';

test.describe.configure({ timeout: 120_000 });

async function openGroup(page: Page, token: string) {
  const rows = page.locator(`.behaviors-search-results__row[data-browse-token="${token}"]`);
  await expect(rows.first()).toBeAttached({ timeout: 30_000 });
  const group = page.locator('#behaviors-search-results details', { has: rows.first() });
  await openGroupAndSettle(group);
  return rows;
}

/** Click the row for prop=value and return the example markup it produced. */
async function pick(page: Page, token: string, prop: string, value: string) {
  const rows = await openGroup(page, token);
  // The render barrier, not "the example changed": renderSource() builds a NEW
  // code panel per selection and highlights it only after the example has been
  // scanned, so a new code element carrying .hljs is THIS row's code. Reading
  // on the example's first change raced it -- the panel was still empty on
  // Windows CI once #1219 made the scan wait for async behaviors to finish.
  await page.evaluate(() => {
    (window as unknown as { __prevCode?: Element | null }).__prevCode =
      document.querySelector('#behaviors-live-code pre code');
  });
  await rows.and(page.locator(`[data-prop="${prop}"][data-variant="${value}"]`)).first().click();
  await page.waitForFunction(() => {
    const code = document.querySelector('#behaviors-live-code pre code');
    const ex = document.getElementById('behaviors-live-example');
    return !!code && code !== (window as unknown as { __prevCode?: Element | null }).__prevCode
      && code.classList.contains('hljs') && !!ex && ex.children.length > 0;
  }, undefined, { timeout: 20_000 });
  return (await page.locator('#behaviors-live-code').textContent()) ?? '';
}

test.beforeEach(async ({ page }) => { await page.goto('/?page=behaviors'); });

for (const side of ['left', 'right']) {
  test(`x-cardhorizontal imagePosition=${side} puts the image on the ${side}`, async ({ page }) => {
    const code = await pick(page, 'x-cardhorizontal', 'imagePosition', side);
    expect(code, 'the schema name, written once').toMatch(new RegExp(`imagePosition="${side}"`));
    expect(code.match(/\simage-?position\s*=/gi) ?? [], 'no second, stale spelling').toHaveLength(1);

    const card = page.locator('#behaviors-live-example [x-cardhorizontal]');
    const img = await card.locator('img').boundingBox();
    const title = await card.locator('h1, h2, h3, h4').first().boundingBox();
    if (side === 'left') expect(img!.x + img!.width).toBeLessThanOrEqual(title!.x + 1);
    else expect(title!.x + title!.width).toBeLessThanOrEqual(img!.x + 1);
  });
}

// Every camelCase option the audit once found dead: each is written under
// its schema name, never dashed and never squashed to lowercase.
const CAMEL = [
  ['x-input', 'inputType', 'input-type'],
  ['x-switch', 'labelPosition', 'label-position'],
  ['x-textarea', 'showCount', 'show-count'],
  ['x-progress', 'showValue', 'show-value'],
  // #952: the page once wrote these squashed (fullwidth, showplaybutton).
  ['x-button', 'fullWidth', 'full-width'],
  ['x-audio', 'showPlayButton', 'show-play-button'],
] as const;
for (const [token, prop, dashed] of CAMEL) {
  test(`${token} ${prop} rows are written as ${prop}`, async ({ page }) => {
    const rows = await openGroup(page, token);
    const row = rows.and(page.locator(`[data-prop="${prop}"]`)).first();
    await expect(row, `${token} must offer a ${prop} row`).toBeAttached();
    const value = (await row.getAttribute('data-variant'))!;
    const code = await pick(page, token, prop, value);
    // Case-SENSITIVE: the squashed lowercase spelling (fullwidth, #952) must
    // not pass for the camelCase one.
    expect(code).toMatch(new RegExp(`\\s${prop}(="[^"]*")?[\\s>]`));
    expect(code, 'the dashed spelling must not be written').not.toMatch(new RegExp(`\\s${dashed}[=\\s>]`, 'i'));
    expect(code, 'the squashed spelling must not be written').not.toMatch(new RegExp(`\\s${prop.toLowerCase()}[=\\s>]`));
  });
}
