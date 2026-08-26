import { test, expect } from '@playwright/test';

/**
 * demos/site/overlays.html: <dialog> triggers already had a real
 * button-like appearance (background/border/padding/radius/pointer cursor
 * via .x-dialog-trigger, dialog.css), but <div x-drawer> and <div x-dropdown>
 * triggers had NONE of that -- confirmed live: transparent background, no
 * border, zero padding, and not even `cursor: pointer`. Two separate root
 * causes:
 *
 * - overlay.js drawer(): unconditionally adds .x-drawer-trigger, but that
 *   class (layout.css/site.css) only ever set `visibility: visible`
 *   (undoing a base rule meant for schema-built panels, not styling a
 *   trigger). Added real button styling in drawer.css.
 * - dropdown.js dropdown(): only builds a styled .x-dropdown__trigger
 *   button when the host has a `label` attribute or real <a>/<button>/<div>
 *   children. The bare-text-content usage on this page
 *   (<div x-dropdown position="...">position=bottom-start</div>) hit
 *   neither branch, so no trigger button was ever built and the host's own
 *   text stayed completely unstyled (even though clicking it does work --
 *   clickHandler already special-cases `e.target === element`). Added a
 *   `.x-dropdown-trigger` class + matching CSS for this host-is-trigger case.
 */

async function ready(page) {
  await page.goto('/demos/site/overlays.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WB, { timeout: 20000 });
}

async function assertLooksClickable(locator) {
  await expect(locator).toBeVisible();
  // The trigger CLASS (.x-dialog-trigger/.x-drawer-trigger/
  // .x-dropdown-trigger) is applied by the behavior's own async/lazy
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

    // #872: this located `.x-dialog`, which is the wrong element and produced
    // a failure that named nothing. `.x-dialog` is the popped-open dialog BOX;
    // a <dialog> without [open] is display:none by the UA stylesheet, so that
    // locator can never be visible before a click and the test failed with
    // "unexpected value: hidden" -- a symptom, not a cause. The trigger is
    // whatever carries `.x-dialog-trigger`, the class dialog.css gives the
    // button-like padding/border/radius/cursor to.
    //
    // Asserting its PRESENCE first, in the body, is the point: it is currently
    // 0 on this page. dialog.js's `if (element.tagName === 'DIALOG')` branch
    // adds `.x-dialog` + `.x-modal` and RETURNS, shadowing the
    // `element.classList.add('x-dialog-trigger')` below it, so no <dialog> on
    // demos/site/overlays.html ever becomes its own trigger -- despite
    // dialog.css:31 stating in a comment that it does. All 14 dialogs on the
    // page render nothing at all. Product defect, tracked on #872; the test
    // stays red and now says why.
    const trigger = page.locator('.x-dialog-trigger').first();
    await expect(
      trigger,
      'dialog.js must mark a pre-click <dialog> as its own trigger (.x-dialog-trigger); '
      + 'without it, the trigger styling in dialog.css matches nothing and the dialog is invisible',
    ).toBeAttached();

    await assertLooksClickable(trigger);
  });

  test('drawer trigger looks clickable', async ({ page }) => {
    await ready(page);
    const drawer = page.locator('[x-drawer]').first();

    // The root cause was a class that existed but styled nothing: overlay.js's
    // drawer() adds `.x-drawer-trigger` unconditionally, while layout.css /
    // site.css only ever set `visibility: visible` on it. Pin the class
    // separately from the appearance so a regression says WHICH half broke --
    // a missing class and a missing stylesheet rule produce the identical
    // "transparent, no border" symptom otherwise.
    await expect(
      drawer,
      'overlay.js drawer() must mark the host as the trigger for drawer.css to reach it',
    ).toHaveClass(/x-drawer-trigger/);

    await assertLooksClickable(drawer);
  });

  test('dropdown trigger (bare text content, no label) looks clickable', async ({ page }) => {
    await ready(page);
    const dropdown = page.locator('[x-dropdown]').first();
    await assertLooksClickable(dropdown);

    // Still functionally clickable after the style-only fix.
    await dropdown.click();
    await expect(dropdown.locator('.x-dropdown__menu')).toBeVisible();
  });
});
