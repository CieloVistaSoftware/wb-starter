/**
 * REGRESSION (#592): wb-table's `selectable` row-click handler in
 * src/wb-viewmodels/semantics/table.js unconditionally did
 * `tableRows.forEach(r => r.classList.remove('active')); tr.classList.add('active')`
 * on every click, with zero check for a held Ctrl/Cmd modifier. The demo
 * hint text (demos/autoinject.html, "Table (Multi-Select)" section) reads
 * "Click rows to select. Hold Ctrl/Cmd to multi-select." but the behavior
 * never implemented it -- clicking a second row always deselected the
 * first instead of adding to the selection.
 *
 * Fixed to only clear other rows' `active` class when the click event does
 * NOT have ctrlKey/metaKey held; when a modifier IS held, it toggles just
 * the clicked row's own `active` class instead.
 *
 * Uses the isolated test-harness.html fixture (same pattern as
 * tests/behaviors/table-bare-attributes.spec.ts) rather than
 * demos/autoinject.html directly -- per tests/behaviors/autoinject.spec.ts's
 * #290 note, that page's generated element IDs drift whenever its content
 * changes, which would make an ID-coupled regression test brittle. The
 * live "Table (Multi-Select)" section is covered by manual verification.
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  // NOTE: unlike tests/behaviors/table-bare-attributes.spec.ts (which this
  // setup() was based on), we do NOT wait on window.WBSite.currentPage --
  // demos/test-harness.html only initializes WB (via wb-lazy.js), it never
  // loads src/core/site-engine.js, so window.WBSite is never defined on
  // this page at all (confirmed live: undefined even after full load).
  // That wait was always doomed on this fixture; see the #592 fix commit
  // for detail (also affects the pre-existing table-bare-attributes spec,
  // filed separately).
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'table-test-area';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(400);
}

const SELECTABLE_TABLE = `
  <table id="sel-table" x-behavior="table" selectable="multi">
    <thead><tr><th>Name</th><th>Role</th></tr></thead>
    <tbody>
      <tr id="row-alice"><td>Alice</td><td>Developer</td></tr>
      <tr id="row-bob"><td>Bob</td><td>Designer</td></tr>
      <tr id="row-charlie"><td>Charlie</td><td>Manager</td></tr>
    </tbody>
  </table>`;

test.describe('<table selectable> Ctrl/Cmd multi-select (#592)', () => {
  test('plain click selects only one row at a time (single-select still works)', async ({ page }) => {
    await setup(page, SELECTABLE_TABLE);

    await page.locator('#row-alice').click();
    await expect(page.locator('#row-alice')).toHaveClass(/active/);
    await expect(page.locator('#row-bob')).not.toHaveClass(/active/);

    await page.locator('#row-bob').click();
    await expect(page.locator('#row-bob')).toHaveClass(/active/);
    await expect(page.locator('#row-alice')).not.toHaveClass(/active/);
  });

  test('Ctrl-click a second row adds it to the selection instead of replacing it', async ({ page }) => {
    await setup(page, SELECTABLE_TABLE);

    await page.locator('#row-alice').click();
    await expect(page.locator('#row-alice')).toHaveClass(/active/);

    await page.locator('#row-bob').click({ modifiers: ['Control'] });

    await expect(page.locator('#row-alice')).toHaveClass(/active/);
    await expect(page.locator('#row-bob')).toHaveClass(/active/);
  });

  test('Ctrl-click a third row extends the selection to all three', async ({ page }) => {
    await setup(page, SELECTABLE_TABLE);

    await page.locator('#row-alice').click();
    await page.locator('#row-bob').click({ modifiers: ['Control'] });
    await page.locator('#row-charlie').click({ modifiers: ['Control'] });

    await expect(page.locator('#row-alice')).toHaveClass(/active/);
    await expect(page.locator('#row-bob')).toHaveClass(/active/);
    await expect(page.locator('#row-charlie')).toHaveClass(/active/);
  });

  test('Ctrl-click an already-selected row toggles it off without affecting the others', async ({ page }) => {
    await setup(page, SELECTABLE_TABLE);

    await page.locator('#row-alice').click();
    await page.locator('#row-bob').click({ modifiers: ['Control'] });
    await expect(page.locator('#row-alice')).toHaveClass(/active/);
    await expect(page.locator('#row-bob')).toHaveClass(/active/);

    await page.locator('#row-bob').click({ modifiers: ['Control'] });

    await expect(page.locator('#row-alice')).toHaveClass(/active/);
    await expect(page.locator('#row-bob')).not.toHaveClass(/active/);
  });

  test('a plain click after a multi-select collapses selection back to just that row', async ({ page }) => {
    await setup(page, SELECTABLE_TABLE);

    await page.locator('#row-alice').click();
    await page.locator('#row-bob').click({ modifiers: ['Control'] });
    await expect(page.locator('#row-alice')).toHaveClass(/active/);
    await expect(page.locator('#row-bob')).toHaveClass(/active/);

    await page.locator('#row-charlie').click();

    await expect(page.locator('#row-charlie')).toHaveClass(/active/);
    await expect(page.locator('#row-alice')).not.toHaveClass(/active/);
    await expect(page.locator('#row-bob')).not.toHaveClass(/active/);
  });
});
