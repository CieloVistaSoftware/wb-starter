/**
 * #433: `searchable` was computed by table.js but nothing ever created the
 * search input -- table.js only ever looked for an existing `.x-table__search`
 * element that neither table.schema.json's $view nor any native-<table>
 * markup ever actually provided. Confirmed live (docs/behaviors/
 * table.md's "Searchable" example rendered no search box at all). Fixed in
 * src/wb-viewmodels/semantics/table.js: when `searchable` is set and no
 * `.x-table__search` input exists, one is created and inserted directly
 * above the table (as a previous sibling for a real `<table>`, since an
 * `<input>` isn't valid `<table>` content; as a first child otherwise).
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  // Not window.WBSite -- test-harness.html only ever imports wb-lazy.js
  // (confirmed via git log --follow, no site-engine.js import has ever
  // existed on this page), so window.WBSite is never defined here and that
  // wait timed out every run (the identical wait copy-pasted into
  // table-bare-attributes.spec.ts's setup() has the same pre-existing bug --
  // tracked separately under #354's broader "240 failures in the behaviors
  // project" umbrella; out of scope to fix that shared file here).
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'table-test-area';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(400);
}

test.describe('<table searchable> creates and wires a real search input (#433)', () => {
  test('searchable renders a .x-table__search input (none existed before)', async ({ page }) => {
    await setup(
      page,
      '<table id="t1" x-behavior="table" searchable>' +
        '<thead><tr><th>Name</th><th>Role</th></tr></thead>' +
        '<tbody><tr><td>Alice</td><td>Admin</td></tr><tr><td>Bob</td><td>User</td></tr></tbody>' +
        '</table>'
    );
    await expect(page.locator('#table-test-area .x-table__search')).toHaveCount(1);
    await expect(page.locator('#table-test-area .x-table__search')).toHaveAttribute('type', 'search');
  });

  test('without searchable, no search input is created', async ({ page }) => {
    await setup(
      page,
      '<table id="t2" x-behavior="table">' +
        '<thead><tr><th>Name</th></tr></thead><tbody><tr><td>Alice</td></tr></tbody>' +
        '</table>'
    );
    await expect(page.locator('#table-test-area .x-table__search')).toHaveCount(0);
  });

  test('typing in the search input actually filters rows (effect-based, not presence-based)', async ({ page }) => {
    await setup(
      page,
      '<table id="t3" x-behavior="table" searchable>' +
        '<thead><tr><th>Name</th><th>Role</th></tr></thead>' +
        '<tbody>' +
        '<tr><td>Alice Chen</td><td>Admin</td></tr>' +
        '<tr><td>Bob Webb</td><td>User</td></tr>' +
        '<tr><td>Priya Patel</td><td>Editor</td></tr>' +
        '</tbody></table>'
    );
    const rows = page.locator('#t3 tbody tr');
    await expect(rows).toHaveCount(3);

    const search = page.locator('#table-test-area .x-table__search');
    await search.fill('chen');

    const visibleRows = page.locator('#t3 tbody tr:visible');
    await expect(visibleRows).toHaveCount(1);
    await expect(visibleRows.first()).toContainText('Alice Chen');
  });

  test('the search input is inserted directly before the table, not inside its content model', async ({ page }) => {
    await setup(
      page,
      '<table id="t4" x-behavior="table" searchable>' +
        '<thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>'
    );
    const table = page.locator('#t4');
    const search = page.locator('#table-test-area .x-table__search');
    // The <input> must be a sibling BEFORE the real <table> (never a child --
    // <input> is not valid <table> content and browsers would misplace it).
    const relation = await page.evaluate(() => {
      const t = document.getElementById('t4')!;
      const input = document.querySelector('.x-table__search')!;
      return {
        inputIsTableChild: t.contains(input),
        inputIsPrevSibling: t.previousElementSibling === input
      };
    });
    expect(relation.inputIsTableChild).toBe(false);
    expect(relation.inputIsPrevSibling).toBe(true);
    await expect(table).toBeVisible();
    await expect(search).toBeVisible();
  });
});
