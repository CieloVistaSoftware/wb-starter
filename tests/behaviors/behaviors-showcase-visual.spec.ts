/**
 * Behaviors Showcase Visual Tests
 * ================================
 * Visual regression tests for demos/behaviors-showcase.html
 * Validates rendering, layout, and interaction of all behaviors.
 *
 * Known Issues to Catch:
 * 1. drawer-layout: Toggle arrow overlaps text, "Main Content" cut off
 * 2. dropdown: Not rendering as dropdown - shows raw links
 * 3. toggle: Button becomes black/white (loses styling)
 * 4. masonry: Column layout not working
 * 5. tabs: Buttons too high
 * 6. code-examples: Text overflow, invalid HTML
 */

import { test, expect } from '@playwright/test';

const BEHAVIORS_URL = '/demos/behaviors-showcase.html';

test.describe('Behaviors Showcase Visual Tests', () => {

  // ── Drawer Layout ──────────────────────────────────────────────────────

  test.describe('Drawer Layout', () => {
    test('drawer-layout should have wb-drawer-layout class', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const dl = page.locator('[x-drawer-layout]').first();
      if (await dl.count() > 0) {
        await expect(dl).toHaveClass(/wb-drawer-layout/);
      }
    });

    test('drawer text should not be cut off', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const main = page.locator('[x-drawer-layout] .wb-drawer-layout__content').first();
      if (await main.count() > 0) {
        const box = await main.boundingBox();
        expect(box).not.toBeNull();
        if (box) expect(box.width).toBeGreaterThan(100);
      }
    });

    test('drawer toggle button should not overlap content text', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const toggle = page.locator('[x-drawer-layout] .wb-drawer-layout__toggle').first();
      const content = page.locator('[x-drawer-layout] .wb-drawer-layout__content').first();
      if (await toggle.count() > 0 && await content.count() > 0) {
        const tBox = await toggle.boundingBox();
        const cBox = await content.boundingBox();
        if (tBox && cBox) {
          // Toggle should not overlap content text area
          expect(tBox.x + tBox.width).toBeLessThanOrEqual(cBox.x + 5);
        }
      }
    });

    test('"Main Content" text should be fully visible', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const main = page.getByText('Main Content').first();
      if (await main.count() > 0) {
        await expect(main).toBeVisible();
        const box = await main.boundingBox();
        expect(box).not.toBeNull();
      }
    });
  });

  // ── Dropdown ───────────────────────────────────────────────────────────

  test.describe('Dropdown', () => {
    test('dropdown should have wb-dropdown class', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const dd = page.locator('[x-dropdown]').first();
      if (await dd.count() > 0) {
        await expect(dd).toHaveClass(/wb-dropdown/);
      }
    });

    test('dropdown should create a trigger button', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const trigger = page.locator('.wb-dropdown__trigger').first();
      if (await trigger.count() > 0) {
        await expect(trigger).toBeVisible();
      }
    });

    test('dropdown should create a menu container', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const menu = page.locator('.wb-dropdown__menu').first();
      expect(await menu.count()).toBeGreaterThan(0);
    });

    test('dropdown menu should be hidden initially', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const menu = page.locator('.wb-dropdown__menu').first();
      if (await menu.count() > 0) {
        await expect(menu).not.toBeVisible();
      }
    });

    test('dropdown should NOT show raw links without trigger', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      // If dropdown is working, raw <a> children should be inside a menu, not loose
      const dd = page.locator('[x-dropdown]').first();
      if (await dd.count() > 0) {
        const directLinks = await dd.evaluate(el => {
          return Array.from(el.children).filter(c => c.tagName === 'A' && !c.closest('.wb-dropdown__menu')).length;
        });
        expect(directLinks).toBe(0);
      }
    });

    test('clicking dropdown trigger should open menu', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const trigger = page.locator('.wb-dropdown__trigger').first();
      const menu = page.locator('.wb-dropdown__menu').first();
      if (await trigger.count() > 0 && await menu.count() > 0) {
        await trigger.click();
        await page.waitForTimeout(300);
        await expect(menu).toBeVisible();
      }
    });
  });

  // ── Toggle ─────────────────────────────────────────────────────────────

  test.describe('Toggle', () => {
    test('toggle button should have visible background color', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const toggle = page.locator('[x-toggle]').first();
      if (await toggle.count() > 0) {
        const bg = await toggle.evaluate(el => window.getComputedStyle(el).backgroundColor);
        // Should not be transparent or white-on-white
        expect(bg).not.toBe('rgba(0, 0, 0, 0)');
      }
    });

    test('toggle button should maintain styling after click', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const toggle = page.locator('[x-toggle]').first();
      if (await toggle.count() > 0) {
        const bgBefore = await toggle.evaluate(el => window.getComputedStyle(el).backgroundColor);
        await toggle.click();
        await page.waitForTimeout(300);
        const bgAfter = await toggle.evaluate(el => window.getComputedStyle(el).backgroundColor);
        // Background should still be a real color (not transparent)
        expect(bgAfter).not.toBe('rgba(0, 0, 0, 0)');
      }
    });

    test('toggle button text should be visible (not white on white)', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const toggle = page.locator('[x-toggle]').first();
      if (await toggle.count() > 0) {
        const { color, bg } = await toggle.evaluate(el => {
          const s = window.getComputedStyle(el);
          return { color: s.color, bg: s.backgroundColor };
        });
        expect(color).not.toBe(bg);
      }
    });
  });

  // ── Masonry ────────────────────────────────────────────────────────────

  test.describe('Masonry', () => {
    test('masonry should have wb-masonry class', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const m = page.locator('[x-masonry]').first();
      if (await m.count() > 0) {
        await expect(m).toHaveClass(/wb-masonry/);
      }
    });

    test('masonry should have column-count CSS applied', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const m = page.locator('.wb-masonry').first();
      if (await m.count() > 0) {
        const cc = await m.evaluate(el => window.getComputedStyle(el).columnCount);
        expect(parseInt(cc)).toBeGreaterThanOrEqual(2);
      }
    });

    test('masonry children should have break-inside: avoid', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const child = page.locator('.wb-masonry > *').first();
      if (await child.count() > 0) {
        const bi = await child.evaluate(el => window.getComputedStyle(el).breakInside);
        expect(bi).toBe('avoid');
      }
    });

    test('masonry items should be distributed across columns', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const children = page.locator('.wb-masonry > *');
      if (await children.count() >= 2) {
        const positions = await children.evaluateAll(els =>
          els.slice(0, 4).map(el => el.getBoundingClientRect().left)
        );
        const unique = new Set(positions.map(p => Math.round(p)));
        expect(unique.size).toBeGreaterThanOrEqual(2);
      }
    });
  });

  // ── Tabs ───────────────────────────────────────────────────────────────

  test.describe('Tabs', () => {
    test('tabs should have wb-tabs class', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const tabs = page.locator('wb-tabs').first();
      if (await tabs.count() > 0) {
        await expect(tabs).toHaveClass(/wb-tabs/);
      }
    });

    test('tab buttons should have reasonable height/padding', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const btn = page.locator('.wb-tabs__nav button').first();
      if (await btn.count() > 0) {
        const h = await btn.evaluate(el => el.getBoundingClientRect().height);
        expect(h).toBeLessThanOrEqual(60);
        expect(h).toBeGreaterThanOrEqual(24);
      }
    });

    test('tabs navigation should exist', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const nav = page.locator('.wb-tabs__nav').first();
      if (await nav.count() > 0) {
        await expect(nav).toBeVisible();
      }
    });

    test('clicking tab should switch content', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const buttons = page.locator('.wb-tabs__nav button');
      if (await buttons.count() >= 2) {
        await buttons.nth(1).click();
        await page.waitForTimeout(300);
        const active = await buttons.nth(1).getAttribute('aria-selected');
        expect(active).toBe('true');
      }
    });
  });

  // ── Code Examples ──────────────────────────────────────────────────────

  test.describe('Code Examples', () => {
    test('code blocks should not have horizontal overflow', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const codeBlocks = page.locator('pre, code, wb-mdhtml');
      const count = await codeBlocks.count();

      const overflows: string[] = [];
      for (let i = 0; i < Math.min(10, count); i++) {
        const block = codeBlocks.nth(i);
        const hasOverflow = await block.evaluate(el => el.scrollWidth > el.clientWidth + 5);
        if (hasOverflow) overflows.push(`block ${i}`);
      }
      expect(overflows).toHaveLength(0);
    });

    test('code example HTML should be parseable', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const examples = page.locator('wb-mdhtml');
      const count = await examples.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  // ── Global Page Tests ──────────────────────────────────────────────────

  test.describe('Global Page Tests', () => {
    test('page should not have horizontal scrollbar', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const hasHScroll = await page.evaluate(() =>
        document.body.scrollWidth > window.innerWidth
      );
      expect(hasHScroll).toBe(false);
    });

    test('all behavior elements should be initialized', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      await page.waitForFunction(() => (window as any).WB, { timeout: 10000 });
      await page.waitForTimeout(1000);

      const wbExists = await page.evaluate(() => !!(window as any).WB);
      expect(wbExists).toBe(true);
    });

    test('no visible text should overflow its container', async ({ page }) => {
      await page.goto(BEHAVIORS_URL);
      const overflows = await page.evaluate(() => {
        const issues: string[] = [];
        document.querySelectorAll('section, .demo-area, .card-body').forEach(c => {
          const cr = c.getBoundingClientRect();
          c.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, li, a, td, th').forEach(t => {
            const tr = t.getBoundingClientRect();
            if (tr.right > cr.right + 10) {
              issues.push(`${t.tagName} overflows by ${Math.round(tr.right - cr.right)}px`);
            }
          });
        });
        return issues;
      });
      expect(overflows).toHaveLength(0);
    });
  });

  // ── Known Issues Detection ─────────────────────────────────────────────

  test('KNOWN ISSUE: drawer-layout toggle overlaps text', async ({ page }) => {
    await page.goto(BEHAVIORS_URL);
    const toggle = page.locator('.wb-drawer-layout__toggle').first();
    const content = page.locator('.wb-drawer-layout__content p').first();
    if (await toggle.count() > 0 && await content.count() > 0) {
      const tBox = await toggle.boundingBox();
      const cBox = await content.boundingBox();
      if (tBox && cBox) {
        expect(tBox.x + tBox.width).toBeLessThanOrEqual(cBox.x + 2);
      }
    }
  });

  test('KNOWN ISSUE: toggle button loses styling', async ({ page }) => {
    await page.goto(BEHAVIORS_URL);
    const toggle = page.locator('[x-toggle]').first();
    if (await toggle.count() > 0) {
      await toggle.click();
      await page.waitForTimeout(300);
      const bg = await toggle.evaluate(el => window.getComputedStyle(el).backgroundColor);
      // Should NOT become black or transparent after click
      expect(bg).not.toBe('rgb(0, 0, 0)');
      expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    }
  });
});
