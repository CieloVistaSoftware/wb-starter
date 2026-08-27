import { test, expect } from '@playwright/test';

/**
 * #585: table.md's x-table examples rendered 0 rows. Root cause was in
 * src/wb-viewmodels/semantics/table.js -- schema-builder.js's
 * processSchema() unconditionally wipes a schema-built element's original
 * content before rebuilding table.schema.json's $view (an empty
 * <thead>/<tbody> pair, since the schema declares no row-building logic),
 * and nothing ever populated real rows into that empty pair. Fixed by
 * having table.js read the documented headers/rows or data/columns
 * attributes (see docs/behaviors/semantics/table.md's "Authoring note")
 * and build real <tr>/<th>/<td> rows at render time via
 * populateTableRows().
 *
 * This test loads table.md live via doc-viewer (the exact page John
 * reported the bug on) and asserts every visible <table> example
 * renders at least 5 real data rows in its <tbody> -- table.md's
 * documented per-example requirement (see #585's consolidated
 * requirements list), and specifically NOT the 0-rows regression.
 */
test.describe('table.md: every x-table example renders real rows (#585)', () => {
  test('docs/behaviors/semantics/table.md: no x-table example has 0 rows', async ({ page }) => {
    await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/behaviors/semantics/table.md'), {
      waitUntil: 'domcontentloaded',
    });

    const tables = page.locator('x-table');
    await expect(tables.first()).toBeVisible({ timeout: 20000 });

    const count = await tables.count();
    expect(count, 'table.md should render at least one <table>').toBeGreaterThan(0);

    const zeroRowTables: string[] = [];
    const underFiveRowTables: string[] = [];

    for (let i = 0; i < count; i++) {
      const table = tables.nth(i);
      if (!(await table.isVisible())) continue; // collapsed <details> sections aren't in view

      const rowCount = await table.locator('tbody tr').count();
      const headers = await table.getAttribute('headers');

      if (rowCount === 0) {
        zeroRowTables.push(`x-table[${i}] headers="${headers}"`);
      } else if (rowCount < 5) {
        underFiveRowTables.push(`x-table[${i}] headers="${headers}" (${rowCount} rows)`);
      }
    }

    expect(zeroRowTables, `these x-table examples rendered 0 rows (the #585 regression):\n${zeroRowTables.join('\n')}`).toEqual([]);
    expect(underFiveRowTables, `table.md requires every example to render at least 5 rows:\n${underFiveRowTables.join('\n')}`).toEqual([]);
  });
});
