/**
 * x-checkbox — every option on the behaviors page must LOOK like its option.
 *
 * John, on the size=lg row: "why aren't the variants working?" The state was
 * right (host classes, input.checked) but nothing showed it:
 *   - input.css sized `.x-checkbox` to 1.2em. That class is also the
 *     <div x-checkbox> host, so the host was 19px wide and the label wrapped
 *     one word per line, overlapping the box.
 *   - checkbox.css had no :indeterminate rule, so indeterminate was a blank box.
 * And: "why are there 2 x-checkbox groups with 10?" The semantic row
 * (input[type="checkbox"]) was relabelled to x-checkbox because the example
 * writes <div x-checkbox>, duplicating the attribute row.
 */
import { test, expect, Page } from '../fixtures/offline';

test.describe.configure({ timeout: 120_000 });

async function openGroup(page: Page) {
  await page.goto('/?page=behaviors');
  const rows = page.locator('.behaviors-search-results__row[data-browse-token="x-checkbox"]');
  await expect(rows.first()).toBeAttached({ timeout: 30_000 });
  // The catalogue fetch relabels (and now drops) rows after the first render.
  await page.waitForFunction(() => {
    const ds = [...document.querySelectorAll('#behaviors-search-results details')];
    return ds.filter((d) => /^x-checkbox \(/.test(d.getAttribute('summary') || '')).length === 1;
  }, null, { timeout: 30_000 });
  await page.locator('#behaviors-search-results details', { has: rows.first() }).locator(':scope > summary').click();
  return rows;
}

async function pick(page: Page, rows: ReturnType<Page['locator']>, variant: string) {
  // Enum options are data-variant="lg"; boolean ones are data-prop="indeterminate".
  await rows.and(page.locator(`[data-variant="${variant}"], [data-boolean][data-prop="${variant}"]`)).first().click();
  const host = page.locator(`#behaviors-live-example [x-checkbox]`).first();
  await expect(host.locator('.x-checkbox__box')).toBeVisible();
  return host;
}

test('x-checkbox is listed once', async ({ page }) => {
  await openGroup(page);
  const summaries = await page.$$eval('#behaviors-search-results details',
    (ds) => ds.map((d) => d.getAttribute('summary') || '').filter((s) => /^x-checkbox \(/.test(s)));
  expect(summaries).toHaveLength(1);
});

test('x-checkbox options render as themselves', async ({ page }) => {
  const rows = await openGroup(page);

  const measure = (host: ReturnType<Page['locator']>) => host.evaluate((h) => {
    const box = h.querySelector('.x-checkbox__box') as HTMLElement;
    const label = h.querySelector('.x-checkbox__label') as HTMLElement;
    const check = h.querySelector('.x-checkbox__check') as HTMLElement;
    return {
      box: box.getBoundingClientRect().width,
      bg: getComputedStyle(box).backgroundColor,
      mark: getComputedStyle(check).opacity,
      labelH: label.getBoundingClientRect().height,
      lineH: parseFloat(getComputedStyle(label).lineHeight) || parseFloat(getComputedStyle(label).fontSize) * 1.6,
    };
  });

  const lg = await measure(await pick(page, rows, 'lg'));
  expect(lg.box, 'size=lg box').toBe(22);
  expect(lg.labelH, 'label stays on one line').toBeLessThanOrEqual(lg.lineH + 1);

  const sm = await measure(await pick(page, rows, 'sm'));
  expect(sm.box, 'size=sm box').toBe(14);

  const primary = await measure(await pick(page, rows, 'primary'));
  const success = await measure(await pick(page, rows, 'success'));
  expect(success.bg, 'success is not primary-coloured').not.toBe(primary.bg);

  // Polled: the box and mark fade in over a short transition.
  const indHost = await pick(page, rows, 'indeterminate');
  await expect.poll(async () => (await measure(indHost)).bg, 'indeterminate is filled, not a blank box')
    .not.toBe('rgb(255, 255, 255)');
  await expect.poll(async () => (await measure(indHost)).mark, 'indeterminate shows its dash').toBe('1');
});
