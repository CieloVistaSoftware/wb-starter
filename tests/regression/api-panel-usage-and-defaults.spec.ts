import { test, expect } from '../fixtures/offline';

/**
 * The API panel's usage snippet puts a decorator on the element it decorates,
 * and an array default reads as an array.
 *
 * John, 2026-10-16, on x-autocomplete's API panel: the usage read
 * `<div x-autocomplete items="">...</div>` ("WHAT HAPPENS WHEN THERE IS TEXT
 * HERE?"), and the DEFAULT cell held a code block whose "JAVASCRIPT" label
 * stood letter by letter in the narrow column ("IMPROPER FORMAT").
 * String([]) is "", so `items: { default: [] }` became items="" and an empty
 * <code>, which the code behavior built into a block. And x-autocomplete is a
 * decorator on <input>, a void element, so a <div> with content was wrong twice.
 */
test('x-autocomplete API: usage is an <input> with items=\'[]\', and the default reads []', async ({ page }) => {
  await page.goto('/?page=behaviors');
  await expect(page.locator('.behaviors-live__body')).toBeVisible({ timeout: 20000 });
  await page.evaluate(() => {
    const row = [...document.querySelectorAll('.behaviors-search-results__row')].find((r) => /x-autocompl/.test(r.textContent || ''));
    (row as HTMLElement).click();
  });
  await page.locator('#behaviors-live-api > summary').click();
  const body = page.locator('#behaviors-live-api-body');
  await expect(body.locator('.behaviors-live__api-default').first()).toBeVisible({ timeout: 15000 });

  const m = await body.evaluate((b) => {
    const cell = b.querySelector('.behaviors-live__api-default')!;
    return {
      usage: (b.querySelector('pre')?.textContent || '').trim(),
      dflt: cell.textContent!.trim(),
      blockInCell: !!cell.querySelector('pre, .x-pre__wrapper, .x-pre__language'),
    };
  });
  expect(m.usage, 'a decorator goes on its curated host, a void <input>').toMatch(/^<input x-autocomplete/);
  expect(m.usage, 'a void element has no body').not.toContain('...');
  expect(m.usage, 'an array default is written as JSON').toContain("items='[]'");
  expect(m.dflt, 'the DEFAULT column shows the array').toBe('[]');
  expect(m.blockInCell, 'the DEFAULT cell holds inline code, not a code block').toBe(false);
});
