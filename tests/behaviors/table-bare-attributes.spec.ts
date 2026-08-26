/**
 * table.js's striped/hover only checked data-striped/dataset.hover, not
 * the bare striped/hover attributes every demo actually uses (the same
 * bare-attribute-fallback gap found repeatedly this session). Fixed in
 * src/wb-viewmodels/semantics/table.js.
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  // #735: NOT WBSite. This page is a standalone harness, not an SPA route, so
  // window.WBSite is never created here -- the wait burned its full timeout and
  // failed before a single assertion ran. WB.behaviors is the readiness signal
  // that applies, and this setup scans the DOM itself below.
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'table-test-area';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(400);
}

test.describe('<table> bare striped/hover attributes', () => {
  test('bare striped attribute adds x-table--striped', async ({ page }) => {
    await setup(page, '<table id="t1" x-behavior="table" striped><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>');
    await expect(page.locator('#t1')).toHaveClass(/x-table--striped/);
  });

  test('without a striped attribute, x-table--striped is not added', async ({ page }) => {
    await setup(page, '<table id="t2" x-behavior="table"><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>');
    await expect(page.locator('#t2')).not.toHaveClass(/x-table--striped/);
  });

  test('bare hover="false" disables hover (was checking dataset.hover, which bare attributes never populate)', async ({ page }) => {
    await setup(page, '<table id="t3" x-behavior="table" hover="false"><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>');
    await expect(page.locator('#t3')).not.toHaveClass(/x-table--hover/);
  });
});
