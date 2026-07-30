import { test, expect } from '@playwright/test';

/**
 * demos/site/overlays.html had NO test coverage of its actual functionality
 * before this file -- only tests/compliance/demo-layout-standards.spec.ts
 * (spacing) and a false-positive grep match in
 * tests/regression/generated-demo-instances-not-empty.spec.ts (which
 * actually tests demos/site/interactive.html, not this page) touched it at
 * all. John, live: "it's broken" -- confirmed and root-caused.
 *
 * This page imports wb-lazy.js directly with no schema-builder involvement
 * (no `?page=` SPA route, no x-schema stamping) -- every <wb-dialog>/
 * <wb-drawer>/<wb-dropdown> here exercises the LEGACY, non-schema code path
 * of its behavior function, which is a DIFFERENT path than pages/
 * behaviors.html's schema-processed one (already covered by
 * wb-drawer-trigger-not-op.spec.ts).
 *
 * Root cause found and fixed here: src/core/wb-lazy.js maintained its own
 * SEPARATE tag->behavior table (customElementMappings), independent of
 * src/core/tag-map.js used by the full SPA. That table mapped
 * 'wb-drawer' -> 'drawerLayout' (an unrelated collapsible-sidebar behavior)
 * instead of 'drawer' (the actual trigger+overlay behavior every demo here
 * uses) -- confirmed live via computed classList showing BOTH
 * wb-drawer-trigger AND wb-drawer-layout classes (the array-based mapping
 * table let both entries match and both behaviors ran on the same element).
 * Fixed by removing the stale 'wb-drawer': 'drawerLayout' entry so the tag
 * resolves only via the correct, already-shared tag-map.js mapping.
 */

async function ready(page) {
  await page.goto('/demos/site/overlays.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
  await page.waitForTimeout(1200);
}

test.describe('demos/site/overlays.html: triggers actually open their overlay', () => {
  test.beforeEach(async ({ page }) => {
    await ready(page);
  });

  test('wb-drawer trigger opens a real fixed-position panel, not a collapsible sidebar', async ({ page }) => {
    const trigger = page.locator('wb-drawer').first();
    await expect(trigger).toBeVisible();
    // The bug this guards: the trigger used to carry BOTH the correct
    // wb-drawer-trigger class AND the wrong wb-drawer-layout class.
    await expect(trigger).toHaveClass(/wb-drawer-trigger/);
    await expect(trigger).not.toHaveClass(/wb-drawer-layout/);

    await trigger.click();
    // Legacy (non-schema) drawer() builds a plain fixed-position div, not
    // the schema path's .wb-drawer__panel--open class -- assert via
    // computed position + visibility instead.
    const panels = page.locator('body > div').filter({ hasText: 'Right Drawer' });
    await expect(panels.last()).toBeVisible({ timeout: 10000 });
    const position = await panels.last().evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe('fixed');
  });

  test('wb-dialog trigger opens a real dialog with its own title/content', async ({ page }) => {
    const trigger = page.locator('wb-dialog').first();
    await expect(trigger).toBeVisible();
    await trigger.click();
    const dialog = page.locator('dialog[open]').first();
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog).toContainText('Basic Dialog');
  });

  test('wb-dropdown trigger opens its menu on click', async ({ page }) => {
    const trigger = page.locator('wb-dropdown').first();
    await expect(trigger).toBeVisible();
    await trigger.click();
    // dropdown() builds a .wb-dropdown__menu (or similar) child -- accept any
    // newly-visible descendant popup rather than over-specifying the class.
    const opened = await page.evaluate(() => {
      const dd = document.querySelector('wb-dropdown');
      if (!dd) return false;
      return Array.from(dd.querySelectorAll('*')).some((el) => {
        const cs = getComputedStyle(el);
        return cs.position !== 'static' && cs.display !== 'none' && el.getBoundingClientRect().height > 0;
      }) || document.body.querySelector('[class*="dropdown"][class*="menu"], [class*="dropdown__menu"]') !== null;
    });
    expect(opened, 'expected a dropdown menu/popup to appear after clicking the trigger').toBeTruthy();
  });
});
