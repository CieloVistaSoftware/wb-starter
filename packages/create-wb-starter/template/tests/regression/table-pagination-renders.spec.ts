import { test, expect, type Page } from '@playwright/test';

/**
 * #669 — <table paginated> must actually paginate.
 *
 * John: "<table paginated ...> where is the pagniation". There was none.
 * table.schema.json declared `paginated` and `pageSize`; table.js read neither,
 * so the attribute rendered every row and no controls — the third property he
 * personally hit after `audio showDisplay` and `button fullWidth`.
 *
 * Two more name mismatches went with it: the schema publishes `hoverable` and
 * `filterable` while the behavior only ever read `hover` and `searchable`, so
 * the DOCUMENTED spellings did nothing.
 *
 * Every assertion here is about RENDERED GEOMETRY, following the invisible-EQ
 * lesson: a pager that exists in the DOM at 0x0 is not pagination.
 */

const FIXTURE = '/tests/fixtures/blank.html';

function rowsAttr(n: number) {
  const rows = Array.from({ length: n }, (_, i) => [`row-${i + 1}`, String(i + 1)]);
  return JSON.stringify(rows).replace(/"/g, '&quot;');
}

async function render(page: Page, markup: string) {
  await page.goto(FIXTURE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async (html) => {
    const host = document.createElement('div');
    host.id = 'harness';
    host.style.cssText = 'width: 720px;';
    document.body.appendChild(host);
    host.innerHTML = html;
    const mod: any = await import('/src/core/wb-lazy.js');
    const WB = mod.default || mod.WB;
    await WB.scan(host, { eager: true });
  }, markup);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
}

/** Rows with real height — hidden rows measure 0 and must not count. */
function visibleRowCount(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('#harness tbody tr')]
      .filter((tr) => tr.getBoundingClientRect().height > 0).length
  );
}

async function box(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  }, selector);
}

test.describe('table: paginated actually paginates (#669)', () => {
  test('the pager renders with real size, not 0x0', async ({ page }) => {
    await render(page, `<table paginated page-size="5" headers="Name,N" rows="${rowsAttr(12)}"></table>`);

    const pager = await box(page, '.x-table__pager');
    expect(pager, 'a paginated table should render pager controls').not.toBeNull();
    expect(pager!.w, 'the pager should have real width').toBeGreaterThan(0);
    expect(pager!.h, 'the pager should have real height').toBeGreaterThan(0);
  });

  test('only one page of rows is visible at a time', async ({ page }) => {
    await render(page, `<table paginated page-size="5" headers="Name,N" rows="${rowsAttr(12)}"></table>`);

    const total = await page.evaluate(() => document.querySelectorAll('#harness tbody tr').length);
    expect(total, 'every row should still exist in the DOM').toBe(12);
    expect(await visibleRowCount(page), 'only pageSize rows should be visible').toBe(5);
  });

  test('Next and Previous move through the pages', async ({ page }) => {
    await render(page, `<table paginated page-size="5" headers="Name,N" rows="${rowsAttr(12)}"></table>`);
    const status = () => page.textContent('.x-table__pager-status');
    const firstVisible = () => page.evaluate(() =>
      [...document.querySelectorAll('#harness tbody tr')]
        .find((tr) => tr.getBoundingClientRect().height > 0)?.querySelector('td')?.textContent ?? null
    );

    expect(await status()).toContain('Page 1 of 3');
    expect(await firstVisible()).toBe('row-1');

    await page.click('.x-table__pager-btn:last-of-type');
    expect(await status()).toContain('Page 2 of 3');
    expect(await firstVisible()).toBe('row-6');

    await page.click('.x-table__pager-btn:first-of-type');
    expect(await status()).toContain('Page 1 of 3');
    expect(await firstVisible()).toBe('row-1');
  });

  test('the final page holds the remainder, and Next is disabled there', async ({ page }) => {
    await render(page, `<table paginated page-size="5" headers="Name,N" rows="${rowsAttr(12)}"></table>`);
    await page.click('.x-table__pager-btn:last-of-type');
    await page.click('.x-table__pager-btn:last-of-type');

    expect(await visibleRowCount(page), '12 rows at 5/page leaves 2 on page 3').toBe(2);
    expect(await page.isDisabled('.x-table__pager-btn:last-of-type'), 'Next should be disabled on the last page').toBe(true);
    expect(await page.isDisabled('.x-table__pager-btn:first-of-type'), 'Previous should be live').toBe(false);
  });

  test('Previous is disabled on the first page', async ({ page }) => {
    await render(page, `<table paginated page-size="5" headers="Name,N" rows="${rowsAttr(12)}"></table>`);
    expect(await page.isDisabled('.x-table__pager-btn:first-of-type')).toBe(true);
  });

  test('pageSize defaults to 10 when unspecified', async ({ page }) => {
    await render(page, `<table paginated headers="Name,N" rows="${rowsAttr(12)}"></table>`);
    expect(await visibleRowCount(page), 'the schema default is 10').toBe(10);
    expect(await page.textContent('.x-table__pager-status')).toContain('Page 1 of 2');
  });

  test('no pager at all without the attribute', async ({ page }) => {
    await render(page, `<table headers="Name,N" rows="${rowsAttr(12)}"></table>`);
    expect(await box(page, '.x-table__pager'), 'pagination is opt-in').toBeNull();
    expect(await visibleRowCount(page), 'every row shows when unpaginated').toBe(12);
  });

  test('paginated="false" is off, matching the bare-boolean convention', async ({ page }) => {
    await render(page, `<table paginated="false" headers="Name,N" rows="${rowsAttr(12)}"></table>`);
    expect(await box(page, '.x-table__pager')).toBeNull();
    expect(await visibleRowCount(page)).toBe(12);
  });

  test('the schema spellings hoverable and filterable are honoured', async ({ page }) => {
    // Both were declared in the schema and read under a different name.
    await render(page, `<table hoverable filterable headers="Name,N" rows="${rowsAttr(4)}"></table>`);

    const hasHover = await page.evaluate(() =>
      !!document.querySelector('#harness .x-table--hover, #harness table.x-table--hover')
    );
    expect(hasHover, 'hoverable is the documented spelling of hover').toBe(true);

    const search = await box(page, '.x-table__search');
    expect(search, 'filterable is the documented spelling of searchable').not.toBeNull();
    expect(search!.h, 'and its input must actually render').toBeGreaterThan(0);
  });
});
