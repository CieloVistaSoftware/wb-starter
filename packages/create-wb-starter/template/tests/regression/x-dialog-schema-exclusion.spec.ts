import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#387 audit, docs/audits/HOST-CHILD-DISPATCH-AUDIT.md):
 * dialog.js (src/wb-viewmodels/semantics/dialog.js) already builds a real
 * native <dialog> + showModal() on trigger -- created fresh via
 * document.createElement('dialog') and appended to document.body, never
 * written into the <dialog> host's own innerHTML. dialog.schema.json's
 * $view (div/header/h2/button/main/footer built straight into the host) is
 * stale and mismatches what dialog.js actually delivers -- it was only ever
 * inert because wb-lazy.js (every standalone demo page) has zero schema
 * support. On the main SPA engine (wb.js, which DOES run schema-builder),
 * nothing previously stopped schema from writing that stale div-based
 * chrome into a live <dialog> host. x-dialog was added to
 * schema-builder.js's SCHEMA_EXCLUDED_TAGS (and the matching per-tag guard
 * in wb.js's processSchema()) to close this off.
 *
 * This does NOT resolve the separate, still-tracked
 * tests/regression/semantic-element-fidelity.spec.ts KNOWN_VIOLATIONS entry
 * for dialog (whether dialog.js should eagerly deliver a real <dialog> tag
 * on connect instead of lazily on click) -- that stays a deliberate
 * maintainer-decision-pending question, untouched here.
 */
test.describe('x-dialog is excluded from schema $view building (#387)', () => {
  test('/?page=forms: schema does not write div/header/h2/main/footer chrome into a live <dialog> host', async ({ page }) => {
    await page.goto('/?page=forms');
    await page.waitForTimeout(1500);

    const hasSchema = await page.evaluate(() => !!(window as any).WB?.schema);
    expect(hasSchema, 'main SPA must expose WB.schema for this test to be meaningful').toBe(true);

    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = 'x-dialog-387-test';
      container.innerHTML = '<dialog id="dlg-387" title="Test Dialog">Open the dialog</dialog>';
      document.body.appendChild(container);
    });
    await page.evaluate(() =>
      (window as any).WB.scan(document.getElementById('x-dialog-387-test'), { eager: true })
    );
    // Give any async schema fetch/build a chance to run (it must NOT, but
    // wait long enough that a regression would actually show up here).
    await page.waitForTimeout(500);

    const host = page.locator('#dlg-387');
    // Confirms dialog.js's own trigger-mode behavior still ran (unaffected
    // by the schema exclusion).
    await expect(host).toHaveClass(/x-dialog-trigger/);
    await expect(host).toHaveClass(/x-modal/);

    // Confirms schema did NOT write its stale $view chrome into the host --
    // none of dialog.schema.json's $view tags should appear as direct
    // children of the live <dialog>.
    const builtSchemaChrome = await host.evaluate((el) =>
      !!el.querySelector(':scope > header, :scope > h2, :scope > main, :scope > footer')
    );
    expect(builtSchemaChrome, 'schema must not build $view chrome into a live <dialog> host').toBe(false);

    // The host's original text content must survive untouched (proves
    // nothing overwrote element.innerHTML).
    await expect(host).toContainText('Open the dialog');

    // Clicking the host must still open a REAL native <dialog> with
    // showModal() -- dialog.js's own behavior, independent of schema.
    await host.click();
    const dlg = page.locator('dialog[open]');
    await expect(dlg).toHaveCount(1);
    await expect(dlg.locator('.x-dialog__title')).toHaveText('Test Dialog');
  });
});
