import { test, expect } from '@playwright/test';

/**
 * §19: interactive triggers must actually work. Clicking a dialog/modal trigger
 * must OPEN a dialog. Covers both dialog trigger styles:
 *  - autoinject.html: a native <button onclick> that calls a <dialog>.showModal()
 *  - behaviors.html: a <div x-modal modal-title="…"> trigger (fixed for #251)
 */
test.describe('dialog triggers open a dialog on click (§19)', () => {
  test('autoinject "Open Dialog" opens the dialog', async ({ page }) => {
    await page.goto('/demos/autoinject.html', { waitUntil: 'domcontentloaded' });
    const btn = page.locator('button', { hasText: 'Open Dialog' }).first();
    await expect(btn).toBeVisible({ timeout: 15000 });
    await btn.click();
    await expect(page.locator('#demo-dialog')).toHaveJSProperty('open', true);
  });

  // #251 recurrence: dialog.js's TRIGGER mode (modal-title/modal-content) only
  // ever runs if WB actually invokes the `dialog` behavior on the element —
  // tag-map.js never mapped `[x-modal]` to it, so the fix silently never fired.
  // <div x-demo> fetches+renders its live example asynchronously (#269), so the
  // trigger can be visible in the DOM before WB has actually scanned/enhanced
  // it — wait for `showModal` to exist (the behavior has run), not just for
  // visibility, before clicking.
  //
  // #305: two real bugs found investigating this test's timeout, both in
  // src/core/wb.js (the runtime this SPA route actually uses):
  //  1. processSchema() unconditionally rebuilt this element's children per
  //     dialog.schema.json's $view — meant for the actual dialog box, not a
  //     trigger — wiping the "Open Modal" label text before dialog.js's
  //     TRIGGER mode ever ran. Fixed: processSchema now skips <div x-modal>
  //     elements with modal-title/modal-content (trigger mode).
  //  2. scan()'s wb-* handling ONLY ran schema processing — for tags schema-
  //     builder.js's own detectSchema() deliberately excludes (x-modal,
  //     x-stack, x-grid, x-accordion — "owned by custom elements /
  //     behaviors / CSS", #174), nothing ever invoked their REAL behavior.
  //     dialog() was never called at all for a trigger-mode <div x-modal>,
  //     regardless of hydration speed or scroll position — confirmed by
  //     waiting a full 150s in isolation (no parallel load) with zero
  //     effect. Fixed: scan() now also resolves every wb-* tag through
  //     tag-map.js's getElementBehavior() and invokes it directly —
  //     WB.inject()'s own idempotency guards make this a safe no-op for
  //     tags a schema already enhanced.
  //
  test('content demo modal trigger opens a dialog', async ({ page }) => {
    await page.goto('/demos/site/content.html', { waitUntil: 'domcontentloaded' });
    const trigger = page.locator('#open-dialog-btn');
    await expect(trigger).toBeVisible({ timeout: 15000 });
    await trigger.click();
    await expect(page.locator('#demo-dialog')).toHaveJSProperty('open', true);
  });
});
