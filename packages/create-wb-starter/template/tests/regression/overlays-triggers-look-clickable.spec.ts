import { test, expect } from '@playwright/test';

/**
 * demos/site/overlays.html: <wb-dialog> triggers already had a real
 * button-like appearance (background/border/padding/radius/pointer cursor
 * via .wb-dialog-trigger, dialog.css), but <wb-drawer> and <wb-dropdown>
 * triggers had NONE of that -- confirmed live: transparent background, no
 * border, zero padding, and not even `cursor: pointer`. Two separate root
 * causes:
 *
 * - overlay.js drawer(): unconditionally adds .wb-drawer-trigger, but that
 *   class (layout.css/site.css) only ever set `visibility: visible`
 *   (undoing a base rule meant for schema-built panels, not styling a
 *   trigger). Added real button styling in drawer.css.
 * - dropdown.js dropdown(): only builds a styled .wb-dropdown__trigger
 *   button when the host has a `label` attribute or real <a>/<button>/<div>
 *   children. The bare-text-content usage on this page
 *   (<wb-dropdown position="...">position=bottom-start</wb-dropdown>) hit
 *   neither branch, so no trigger button was ever built and the host's own
 *   text stayed completely unstyled (even though clicking it does work --
 *   clickHandler already special-cases `e.target === element`). Added a
 *   `.wb-dropdown-trigger` class + matching CSS for this host-is-trigger case.
 */

async function ready(page) {
  await page.goto('/demos/site/overlays.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WB, { timeout: 20000 });
}

async function assertLooksClickable(locator) {
  await expect(locator).toBeVisible();
  // The trigger CLASS (.wb-dialog-trigger/.wb-drawer-trigger/
  // .wb-dropdown-trigger) is applied by the behavior's own async/lazy
  // injection (wb-lazy.js's IntersectionObserver-driven scan), not
  // synchronously with the element becoming visible in the DOM -- reading
  // computed style right after toBeVisible() can race that injection
  // (confirmed live: cursor read back as 'auto' on a fresh page load).
  // Poll until the styling has actually landed.
  await expect
    .poll(() => locator.evaluate((el) => getComputedStyle(el).cursor), { timeout: 10000 })
    .toBe('pointer');

  const style = await locator.evaluate((el) => {
    const s = getComputedStyle(el);
    return { cursor: s.cursor, bg: s.backgroundColor, border: s.borderWidth, padding: s.paddingTop, radius: s.borderRadius };
  });
  expect(style.bg, 'background must not be transparent').not.toBe('rgba(0, 0, 0, 0)');
  expect(parseFloat(style.border), 'must have a real border').toBeGreaterThan(0);
  expect(parseFloat(style.padding), 'must have real padding').toBeGreaterThan(0);
  expect(parseFloat(style.radius), 'must have rounded corners like a button').toBeGreaterThan(0);
}

test.describe('demos/site/overlays.html: every clickable trigger looks like a button', () => {
  test('dialog trigger looks clickable', async ({ page }) => {
    await ready(page);
    await assertLooksClickable(page.locator('wb-dialog').first());
  });

  test('drawer trigger looks clickable', async ({ page }) => {
    await ready(page);
    await assertLooksClickable(page.locator('wb-drawer').first());
  });

  test('dropdown trigger (bare text content, no label) looks clickable', async ({ page }) => {
    await ready(page);
    const dropdown = page.locator('wb-dropdown').first();
    await assertLooksClickable(dropdown);

    // Still functionally clickable after the style-only fix.
    await dropdown.click();
    await expect(dropdown.locator('.wb-dropdown__menu')).toBeVisible();
  });
});
