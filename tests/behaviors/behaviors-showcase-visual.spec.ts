/**
 * Behaviors Showcase Visual Tests
 * ================================
 * Visual regression tests for the behaviors page (/?page=behaviors).
 * Validates rendering, layout, and interaction of all behaviors.
 *
 * Known Issues to Catch:
 * 1. drawer-layout: Toggle arrow overlaps text, "Main Content" cut off
 * 2. dropdown: Not rendering as dropdown - shows raw links
 * 3. toggle: Button becomes black/white (loses styling)
 * 4. masonry: Column layout not working
 * 5. tabs: Buttons too high
 * 6. code-examples: Text overflow, invalid HTML
 *
 * WHERE THESE RUN
 * ---------------
 * This file was written against demos/behaviors-showcase.html, which rendered
 * every behavior inline. That page was removed when its content moved into the
 * SPA route (see the header of behaviors-showcase.spec.ts), and #664/#666 then
 * made that route a BROWSER: nothing renders until a behavior is picked from
 * the list. Every test here was loading a 404, so the `if (count > 0)` guards
 * made most of them pass without looking at anything, and the three with an
 * unconditional expect() failed.
 *
 * Each block now picks its behavior out of the list with showBehavior() and
 * reads what renders in the live panel -- the same authored example a reader
 * sees. showBehavior() fails if the behavior has no row, so a block cannot
 * silently measure nothing again.
 *
 * #1092: showBehavior() proves the ROW exists, not that the example rendered
 * the part a test measures. Each test now asserts its subject is present before
 * measuring it, instead of an if() that skipped every expect() and passed.
 */

import { test, expect } from '../fixtures/offline';
import { showBehavior } from '../helpers/behaviors-page';

// Booting the page, filling the list from its two fetches, then rendering and
// scanning one example is ~10s per test; the waits are event-driven, so the
// longer ceiling buys tolerance under parallel workers without hiding a hang.
test.describe.configure({ timeout: 90_000 });

/** Everything below is read from inside the rendered example, never the page chrome. */
const EX = '#behaviors-live-example';

test.describe('Behaviors Showcase Visual Tests', () => {

  // ── Drawer Layout ──────────────────────────────────────────────────────

  test.describe('Drawer Layout', () => {
    test('drawer-layout should have [x-drawer-layout] class', async ({ page }) => {
      await showBehavior(page, 'x-drawer-layout');
      const dl = page.locator(`${EX} [x-drawer-layout]`).first();
      // #1092: the example must render a [x-drawer-layout] element to check
      expect(await dl.count(), 'the x-drawer-layout example renders no [x-drawer-layout] element').toBeGreaterThan(0);
      await expect(dl).toHaveClass(/x-drawerlayout/);
    });

    // #1092: these three named a demo that no longer exists
    // (a content part, a schema-built toggle part, "Main Content"),
    // so behind their if() guards they had checked nothing since it went. The
    // example is now <aside x-drawer-layout> holding its own <nav> links, and
    // the toggle layouts.js creates is .x-drawerlayout__toggle (layouts.js drawerLayout).
    test('drawer links are not cut off by the drawer', async ({ page }) => {
      await showBehavior(page, 'x-drawer-layout');
      const drawer = page.locator(`${EX} [x-drawer-layout]`).first();
      const links = drawer.locator('a');
      expect(await links.count(), 'the x-drawer-layout example has no links in its drawer').toBeGreaterThan(0);
      const dBox = await drawer.boundingBox();
      expect(dBox, 'the drawer has no layout box (not displayed)').not.toBeNull();
      for (const link of await links.all()) {
        const box = await link.boundingBox();
        expect(box, 'a drawer link has no layout box').not.toBeNull();
        expect(box!.width, 'a drawer link collapsed to zero width').toBeGreaterThan(0);
        expect(box!.x + box!.width, 'a drawer link runs past the drawer edge').toBeLessThanOrEqual(dBox!.x + dBox!.width + 1);
      }
    });

    test('drawer toggle button does not overlap the drawer links', async ({ page }) => {
      await showBehavior(page, 'x-drawer-layout');
      const toggle = page.locator(`${EX} .x-drawerlayout__toggle`).first();
      expect(await toggle.count(), 'x-drawer-layout created no .x-drawerlayout__toggle').toBeGreaterThan(0);
      const tBox = await toggle.boundingBox();
      expect(tBox, '.x-drawerlayout__toggle has no layout box (not displayed)').not.toBeNull();
      const links = page.locator(`${EX} [x-drawer-layout] a`);
      expect(await links.count(), 'the x-drawer-layout example has no links in its drawer').toBeGreaterThan(0);
      for (const link of await links.all()) {
        const b = await link.boundingBox();
        expect(b, 'a drawer link has no layout box').not.toBeNull();
        const overlaps = tBox!.x < b!.x + b!.width && b!.x < tBox!.x + tBox!.width
          && tBox!.y < b!.y + b!.height && b!.y < tBox!.y + tBox!.height;
        expect(overlaps, `the toggle covers the link "${await link.textContent()}"`).toBe(false);
      }
    });
  });

  // ── Dropdown ───────────────────────────────────────────────────────────

  test.describe('Dropdown', () => {
    test('dropdown should have [x-dropdown] class', async ({ page }) => {
      await showBehavior(page, 'x-dropdown');
      const dd = page.locator(`${EX} [x-dropdown]`).first();
      // #1092: the example must render a [x-dropdown] element to check
      expect(await dd.count(), 'the x-dropdown example renders no [x-dropdown] element').toBeGreaterThan(0);
      await expect(dd).toHaveClass(/x-dropdown/);
    });

    test('dropdown should create a trigger button', async ({ page }) => {
      await showBehavior(page, 'x-dropdown');
      const trigger = page.locator(`${EX} .x-dropdown__trigger`).first();
      // #1092: creating the trigger IS the claim; its absence must fail
      expect(await trigger.count(), 'x-dropdown created no .x-dropdown__trigger').toBeGreaterThan(0);
      await expect(trigger).toBeVisible();
    });

    test('dropdown should create a menu container', async ({ page }) => {
      await showBehavior(page, 'x-dropdown');
      const menu = page.locator(`${EX} .x-dropdown__menu`).first();
      expect(await menu.count()).toBeGreaterThan(0);
    });

    test('dropdown menu should be hidden initially', async ({ page }) => {
      await showBehavior(page, 'x-dropdown');
      const menu = page.locator(`${EX} .x-dropdown__menu`).first();
      // #1092: a missing menu is not a hidden menu
      expect(await menu.count(), 'x-dropdown created no .x-dropdown__menu').toBeGreaterThan(0);
      await expect(menu).not.toBeVisible();
    });

    test('dropdown should NOT show raw links without trigger', async ({ page }) => {
      await showBehavior(page, 'x-dropdown');
      // If dropdown is working, raw <a> children should be inside a menu, not loose
      const dd = page.locator(`${EX} [x-dropdown]`).first();
      // #1092: no [x-dropdown] element means zero loose links for the wrong reason
      expect(await dd.count(), 'the x-dropdown example renders no [x-dropdown] element').toBeGreaterThan(0);
      const directLinks = await dd.evaluate(el => {
        return Array.from(el.children).filter(c => c.tagName === 'A' && !c.closest('.x-dropdown__menu')).length;
      });
      expect(directLinks).toBe(0);
    });

    test('clicking dropdown trigger should open menu', async ({ page }) => {
      await showBehavior(page, 'x-dropdown');
      const trigger = page.locator(`${EX} .x-dropdown__trigger`).first();
      const menu = page.locator(`${EX} .x-dropdown__menu`).first();
      // #1092: both the trigger and the menu must exist to test opening
      expect(await trigger.count(), 'x-dropdown created no .x-dropdown__trigger').toBeGreaterThan(0);
      expect(await menu.count(), 'x-dropdown created no .x-dropdown__menu').toBeGreaterThan(0);
      await trigger.click();
      await expect(menu).toBeVisible();
    });
  });

  // ── Toggle ─────────────────────────────────────────────────────────────

  test.describe('Toggle', () => {
    test('toggle button should have visible background color', async ({ page }) => {
      await showBehavior(page, 'x-toggle');
      const toggle = page.locator(`${EX} [x-toggle]`).first();
      // #1092: the example must render a [x-toggle] element to measure
      expect(await toggle.count(), 'the x-toggle example renders no [x-toggle] element').toBeGreaterThan(0);
      const bg = await toggle.evaluate(el => window.getComputedStyle(el).backgroundColor);
      // Should not be transparent or white-on-white
      expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    });

    test('toggle button should maintain styling after click', async ({ page }) => {
      await showBehavior(page, 'x-toggle');
      const toggle = page.locator(`${EX} [x-toggle]`).first();
      // #1092: the example must render a [x-toggle] element to click
      expect(await toggle.count(), 'the x-toggle example renders no [x-toggle] element').toBeGreaterThan(0);
      const bgBefore = await toggle.evaluate(el => window.getComputedStyle(el).backgroundColor);
      await toggle.click();
      // The toggle has repainted, transitions done (#1516: not 300ms).
      await page.evaluate(async () => {
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        await Promise.all(document.getAnimations()
          .filter((a) => Number.isFinite(Number(a.effect?.getComputedTiming().endTime)))
          .map((a) => a.finished.catch(() => {})));
      });
      const bgAfter = await toggle.evaluate(el => window.getComputedStyle(el).backgroundColor);
      // Background should still be a real color (not transparent)
      expect(bgAfter).not.toBe('rgba(0, 0, 0, 0)');
    });

    test('toggle button text should be visible (not white on white)', async ({ page }) => {
      await showBehavior(page, 'x-toggle');
      const toggle = page.locator(`${EX} [x-toggle]`).first();
      // #1092: the example must render a [x-toggle] element to measure
      expect(await toggle.count(), 'the x-toggle example renders no [x-toggle] element').toBeGreaterThan(0);
      const { color, bg } = await toggle.evaluate(el => {
        const s = window.getComputedStyle(el);
        return { color: s.color, bg: s.backgroundColor };
      });
      expect(color).not.toBe(bg);
    });
  });

  // ── Masonry ────────────────────────────────────────────────────────────

  test.describe('Masonry', () => {
    test('masonry should have [x-masonry] class', async ({ page }) => {
      await showBehavior(page, 'x-masonry');
      const m = page.locator(`${EX} [x-masonry]`).first();
      // #1092: the example must render a [x-masonry] element to check
      expect(await m.count(), 'the x-masonry example renders no [x-masonry] element').toBeGreaterThan(0);
      await expect(m).toHaveClass(/x-masonry/);
    });

    test('masonry should have column-count CSS applied', async ({ page }) => {
      await showBehavior(page, 'x-masonry');
      const m = page.locator(`${EX} .x-masonry`).first();
      // #1092: no .x-masonry element means the behavior never applied its class
      expect(await m.count(), 'the x-masonry example has no .x-masonry element').toBeGreaterThan(0);
      const cc = await m.evaluate(el => window.getComputedStyle(el).columnCount);
      expect(parseInt(cc)).toBeGreaterThanOrEqual(2);
    });

    test('masonry children should have break-inside: avoid', async ({ page }) => {
      await showBehavior(page, 'x-masonry');
      const child = page.locator(`${EX} .x-masonry > *`).first();
      // #1092: there must be a masonry item to measure
      expect(await child.count(), 'the x-masonry example has no .x-masonry items').toBeGreaterThan(0);
      const bi = await child.evaluate(el => window.getComputedStyle(el).breakInside);
      expect(bi).toBe('avoid');
    });

    test('masonry items should be distributed across columns', async ({ page }) => {
      await showBehavior(page, 'x-masonry');
      const children = page.locator(`${EX} .x-masonry > *`);
      // #1092: distribution across columns needs at least two items
      expect(await children.count(), 'the x-masonry example has fewer than 2 .x-masonry items').toBeGreaterThanOrEqual(2);
      const positions = await children.evaluateAll(els =>
        els.slice(0, 4).map(el => el.getBoundingClientRect().left)
      );
      const unique = new Set(positions.map(p => Math.round(p)));
      expect(unique.size).toBeGreaterThanOrEqual(2);
    });
  });

  // ── Tabs ───────────────────────────────────────────────────────────────

  test.describe('Tabs', () => {
    test('tabs should have [x-tabs] class', async ({ page }) => {
      await showBehavior(page, 'x-tabs');
      const tabs = page.locator(`${EX} [x-tabs]`).first();
      // #1092: the example must render a [x-tabs] element to check
      expect(await tabs.count(), 'the x-tabs example renders no [x-tabs] element').toBeGreaterThan(0);
      await expect(tabs).toHaveClass(/x-tabs/);
    });

    test('tab buttons should have reasonable height/padding', async ({ page }) => {
      await showBehavior(page, 'x-tabs');
      const btn = page.locator(`${EX} .x-tabs__nav button`).first();
      // #1092: there must be a tab button to measure
      expect(await btn.count(), 'x-tabs created no .x-tabs__nav button').toBeGreaterThan(0);
      const h = await btn.evaluate(el => el.getBoundingClientRect().height);
      expect(h).toBeLessThanOrEqual(60);
      expect(h).toBeGreaterThanOrEqual(24);
    });

    test('tabs navigation should exist', async ({ page }) => {
      await showBehavior(page, 'x-tabs');
      const nav = page.locator(`${EX} .x-tabs__nav`).first();
      // #1092: existence IS the claim; its absence must fail
      expect(await nav.count(), 'x-tabs created no .x-tabs__nav').toBeGreaterThan(0);
      await expect(nav).toBeVisible();
    });

    test('clicking tab should switch content', async ({ page }) => {
      await showBehavior(page, 'x-tabs');
      const buttons = page.locator(`${EX} .x-tabs__nav button`);
      // #1092: switching needs at least two tabs
      expect(await buttons.count(), 'x-tabs created fewer than 2 .x-tabs__nav buttons').toBeGreaterThanOrEqual(2);
      await buttons.nth(1).click();
      // Retrying matcher, not a 300ms sleep then one read (#1516).
      await expect(buttons.nth(1)).toHaveAttribute('aria-selected', 'true');
    });
  });

  // ── Code Examples ──────────────────────────────────────────────────────

  test.describe('Code Examples', () => {
    test('code blocks should not have horizontal overflow', async ({ page }) => {
      await showBehavior(page, 'x-mdhtml');
      const codeBlocks = page.locator(`${EX} pre, ${EX} code, ${EX} [x-mdhtml]`);
      const count = await codeBlocks.count();
      // #1092: an empty loop finds no overflow; require blocks to scan
      expect(count, 'the x-mdhtml example renders no code blocks to scan').toBeGreaterThan(0);

      const overflows: string[] = [];
      for (let i = 0; i < Math.min(10, count); i++) {
        const block = codeBlocks.nth(i);
        const hasOverflow = await block.evaluate(el => el.scrollWidth > el.clientWidth + 5);
        if (hasOverflow) overflows.push(`block ${i}`);
      }
      expect(overflows).toHaveLength(0);
    });

    test('code example HTML should be parseable', async ({ page }) => {
      await showBehavior(page, 'x-mdhtml');
      const examples = page.locator(`${EX} [x-mdhtml]`);
      const count = await examples.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  // ── Global Page Tests ──────────────────────────────────────────────────

  test.describe('Global Page Tests', () => {
    test('page should not have horizontal scrollbar', async ({ page }) => {
      await page.goto('/?page=behaviors');
      const hasHScroll = await page.evaluate(() =>
        document.body.scrollWidth > window.innerWidth
      );
      expect(hasHScroll).toBe(false);
    });

    test('all behavior elements should be initialized', async ({ page }) => {
      await page.goto('/?page=behaviors');
      await page.waitForFunction(() => (window as any).WB, { timeout: 10000 });
      await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage, { timeout: 20000 });

      const wbExists = await page.evaluate(() => !!(window as any).WB);
      expect(wbExists).toBe(true);
    });

    test('no visible text should overflow its container', async ({ page }) => {
      await page.goto('/?page=behaviors');
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

  // #1092: "KNOWN ISSUE: drawer-layout toggle overlaps text" duplicated the
  // Drawer Layout overlap test above against the same vanished demo; removed.

  test('KNOWN ISSUE: toggle button loses styling', async ({ page }) => {
    await showBehavior(page, 'x-toggle');
    const toggle = page.locator(`${EX} [x-toggle]`).first();
    // #1092: the example must render a [x-toggle] element to click
    expect(await toggle.count(), 'the x-toggle example renders no [x-toggle] element').toBeGreaterThan(0);
    await toggle.click();
    // The toggle has repainted, transitions done (#1516: not 300ms).
    await page.evaluate(async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await Promise.all(document.getAnimations()
        .filter((a) => Number.isFinite(Number(a.effect?.getComputedTiming().endTime)))
        .map((a) => a.finished.catch(() => {})));
    });
    const bg = await toggle.evaluate(el => window.getComputedStyle(el).backgroundColor);
    // Should NOT become black or transparent after click
    expect(bg).not.toBe('rgb(0, 0, 0)');
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
  });
});
