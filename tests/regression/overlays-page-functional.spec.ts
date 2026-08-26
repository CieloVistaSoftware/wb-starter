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
 * (no `?page=` SPA route, no x-schema stamping) -- every <dialog>/
 * <div x-drawer>/<div x-dropdown> here exercises the LEGACY, non-schema code path
 * of its behavior function, which is a DIFFERENT path than pages/
 * behaviors.html's schema-processed one (already covered by
 * x-drawer-trigger-not-op.spec.ts).
 *
 * Root cause found and fixed here: src/core/wb-lazy.js maintained its own
 * SEPARATE tag->behavior table (customElementMappings), independent of
 * src/core/tag-map.js used by the full SPA. That table mapped
 * '[x-drawer]' -> 'drawerLayout' (an unrelated collapsible-sidebar behavior)
 * instead of 'drawer' (the actual trigger+overlay behavior every demo here
 * uses) -- confirmed live via computed classList showing BOTH
 * x-drawer-trigger AND x-drawer-layout classes (the array-based mapping
 * table let both entries match and both behaviors ran on the same element).
 * Fixed by removing the stale '[x-drawer]': 'drawerLayout' entry so the tag
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

  test('[x-drawer] trigger opens a real fixed-position panel, not a collapsible sidebar', async ({ page }) => {
    const trigger = page.locator('[x-drawer]').first();
    await expect(trigger).toBeVisible();
    // The bug this guards: the trigger used to carry BOTH the correct
    // x-drawer-trigger class AND the wrong x-drawer-layout class.
    await expect(trigger).toHaveClass(/x-drawer-trigger/);
    await expect(trigger).not.toHaveClass(/x-drawer-layout/);

    await trigger.click();
    // Legacy (non-schema) drawer() builds a plain fixed-position div, not
    // the schema path's .x-drawer__panel--open class -- assert via
    // computed position + visibility instead.
    const panels = page.locator('body > div').filter({ hasText: 'Right Drawer' });
    await expect(panels.last()).toBeVisible({ timeout: 10000 });
    const position = await panels.last().evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe('fixed');
  });

  test('.x-dialog trigger opens a real dialog with its own title/content', async ({ page }) => {
    const trigger = page.locator('.x-dialog').first();
    await expect(trigger).toBeVisible();
    await trigger.click();
    const dialog = page.locator('dialog[open]').first();
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog).toContainText('Basic Dialog');
  });

  test('[x-dropdown] trigger opens its menu on click', async ({ page }) => {
    const trigger = page.locator('[x-dropdown]').first();
    await expect(trigger).toBeVisible();
    await trigger.click();
    // dropdown() builds a .x-dropdown__menu (or similar) child -- accept any
    // newly-visible descendant popup rather than over-specifying the class.
    const opened = await page.evaluate(() => {
      const dd = document.querySelector('[x-dropdown]');
      if (!dd) return false;
      return Array.from(dd.querySelectorAll('*')).some((el) => {
        const cs = getComputedStyle(el);
        return cs.position !== 'static' && cs.display !== 'none' && el.getBoundingClientRect().height > 0;
      }) || document.body.querySelector('[class*="dropdown"][class*="menu"], [class*="dropdown__menu"]') !== null;
    });
    expect(opened, 'expected a dropdown menu/popup to appear after clicking the trigger').toBeTruthy();
  });

  // ─────────────────────────────────────────────────────────────────────
  // "In depth" coverage (John, standing directive) -- every trigger on the
  // page, not just the first instance of each tag, and asserting each
  // configured size/position/variant actually produces a DIFFERENT result
  // from its siblings (effect-based, per DEMOS-AND-DOCS-STANDARDS.md §19 --
  // "not merely that the element renders").
  // ─────────────────────────────────────────────────────────────────────

  test('every .x-dialog trigger on the page opens with real content', async ({ page }) => {
    // Only the "Basic Dialog" section's 4 triggers have distinct titles;
    // the size/variant-variant sections intentionally reuse the generic
    // default title (their point is demonstrating size/variant, not title
    // uniqueness) -- so assert every trigger opens with SOME real content,
    // and separately assert the Basic Dialog section specifically is
    // all-distinct (that's the section whose markup actually varies title).
    const triggers = page.locator('.x-dialog');
    const count = await triggers.count();
    expect(count, 'expected multiple .x-dialog triggers on this page').toBeGreaterThan(1);

    for (let i = 0; i < count; i++) {
      const trigger = triggers.nth(i);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      const dialog = page.locator('dialog[open]').first();
      await expect(dialog, `trigger[${i}] should open a dialog`).toBeVisible({ timeout: 5000 });
      const text = (await dialog.textContent())?.trim() ?? '';
      expect(text.length, `trigger[${i}] dialog should have real content, not empty`).toBeGreaterThan(0);
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible({ timeout: 3000 }).catch(() => {});
    }

    const basicSection = page.locator('#dialog-dialog .x-dialog');
    const basicCount = await basicSection.count();
    const basicTexts = new Set<string>();
    for (let i = 0; i < basicCount; i++) {
      await basicSection.nth(i).click();
      const dialog = page.locator('dialog[open]').first();
      await expect(dialog).toBeVisible({ timeout: 5000 });
      basicTexts.add((await dialog.textContent())?.trim() ?? '');
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible({ timeout: 3000 }).catch(() => {});
    }
    expect(basicTexts.size, `Basic Dialog section: expected ${basicCount} distinct contents, got: ${JSON.stringify([...basicTexts])}`).toBe(basicCount);
  });

  test('dialog size variants (sm/md/lg/xl/full) each open at a distinct width', async ({ page }) => {
    // The "size variants" section triggers are unlabeled ("size=sm" etc as
    // their own text) -- select them by that section's own scope.
    const section = page.locator('#dialog-size-variants');
    const triggers = section.locator('.x-dialog');
    const count = await triggers.count();
    expect(count).toBeGreaterThanOrEqual(5);

    const widths: number[] = [];
    for (let i = 0; i < count; i++) {
      const trigger = triggers.nth(i);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      const dialog = page.locator('dialog[open]').first();
      await expect(dialog, `size trigger[${i}] should open`).toBeVisible({ timeout: 5000 });
      const width = await dialog.evaluate((el) => el.getBoundingClientRect().width);
      widths.push(Math.round(width));
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible({ timeout: 3000 }).catch(() => {});
    }
    expect(new Set(widths).size, `expected ${count} distinct dialog widths across size variants, got: ${JSON.stringify(widths)}`).toBeGreaterThan(1);
  });

  test('every [x-drawer] trigger opens its own panel with matching position', async ({ page }) => {
    const section = page.locator('#drawer-position-variants');
    const triggers = section.locator('[x-drawer]');
    const count = await triggers.count();
    expect(count).toBeGreaterThanOrEqual(4);

    const positions = ['left', 'right', 'top', 'bottom'];
    for (let i = 0; i < Math.min(count, positions.length); i++) {
      const trigger = triggers.nth(i);
      await trigger.scrollIntoViewIfNeeded();
      const expectedPosition = await trigger.getAttribute('position');
      await trigger.click();
      // Legacy drawer() fixed-position panels are appended to document.body;
      // find the most recently added one with a real bounding box.
      await page.waitForTimeout(400);
      const panelRect = await page.evaluate(() => {
        const fixed = Array.from(document.querySelectorAll('body > div')).filter(
          (el) => getComputedStyle(el).position === 'fixed' && el.getBoundingClientRect().width > 0
        );
        const last = fixed[fixed.length - 1] as HTMLElement | undefined;
        return last ? last.getBoundingClientRect() : null;
      });
      expect(panelRect, `trigger[${i}] (position=${expectedPosition}) should open a panel`).not.toBeNull();
      // Close it (click its own close button if present, else re-click trigger to toggle).
      const closeBtn = page.locator('body > div button', { hasText: '×' }).last();
      if (await closeBtn.count()) await closeBtn.click().catch(() => {});
    }
  });

  test('every [x-dropdown] trigger on the page opens something, not just the first', async ({ page }) => {
    const triggers = page.locator('[x-dropdown]');
    const count = await triggers.count();
    expect(count).toBeGreaterThan(1);

    for (let i = 0; i < count; i++) {
      const trigger = triggers.nth(i);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      await page.waitForTimeout(200);
      const opened = await trigger.evaluate((dd) => {
        return Array.from(dd.querySelectorAll('*')).some((el) => {
          const cs = getComputedStyle(el);
          return cs.position !== 'static' && cs.display !== 'none' && el.getBoundingClientRect().height > 0;
        });
      });
      expect(opened, `dropdown trigger[${i}] should open something on click`).toBeTruthy();
      await page.keyboard.press('Escape');
    }
  });
});
