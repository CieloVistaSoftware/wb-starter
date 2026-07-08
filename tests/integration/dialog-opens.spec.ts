import { test, expect } from '@playwright/test';

/**
 * §19: interactive triggers must actually work. Clicking a dialog/modal trigger
 * must OPEN a dialog. Covers both dialog trigger styles:
 *  - autoinject.html: a native <button onclick> that calls a <dialog>.showModal()
 *  - components.html: a <wb-modal modal-title="…"> trigger (fixed for #251)
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
  // tag-map.js never mapped `wb-modal` to it, so the fix silently never fired.
  // <wb-demo> fetches+renders its live example asynchronously (#269), so the
  // trigger can be visible in the DOM before WB has actually scanned/enhanced
  // it — wait for `showModal` to exist (the behavior has run), not just for
  // visibility, before clicking.
  test('behaviors page <wb-modal> "Open Modal" trigger opens a dialog', async ({ page }) => {
    // The behaviors page's <wb-demo> hydration is a documented slow/flaky path
    // under parallel test load (#269) — give this one extra headroom rather
    // than let an unrelated perf issue mask the actual assertion.
    test.setTimeout(90000);
    // domcontentloaded fires before the SPA's own client-side page fetch (which
    // loads pages/behaviors.html and its <wb-demo> blocks) has even started.
    await page.goto('/?page=behaviors', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => {
      const el = [...document.querySelectorAll('wb-modal')].find((e) => e.textContent?.includes('Open Modal'));
      return el && typeof el.showModal === 'function';
    }, { timeout: 60000 });
    const trigger = page.locator('wb-modal', { hasText: 'Open Modal' }).first();
    await trigger.click();
    await expect(page.locator('dialog[open]')).toHaveCount(1);
  });
});
