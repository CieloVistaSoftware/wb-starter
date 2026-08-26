import { test, expect } from '@playwright/test';

/**
 * demos/site/overlays.html: "not one single dropdown is working" -- three
 * separate real bugs in src/wb-viewmodels/dropdown.js and the demo markup:
 *
 * 1. dropdown.js's `posStyles` map was keyed 'bottom-left'/'bottom-right'/
 *    'top-left'/'top-right', but dropdown.schema.json's actual `position`
 *    enum is 'bottom-start'/'bottom-end'/'top-start'/'top-end' -- no demo
 *    attribute value ever matched a map key, so every position silently
 *    fell through to the same default and all 4 position-variant demos
 *    rendered identically. Fixed the map's keys (and default) to match
 *    the schema.
 * 2. Every dropdown demo on the page used bare text content with no
 *    `items` attribute and no real <a>/<button>/<div> children --
 *    dropdown()'s menu-population logic (hasChildItems / config.items)
 *    had nothing to populate from, so clicking any of them opened a
 *    technically-visible but completely EMPTY menu (0 children, a 150x2px
 *    sliver) -- confirmed live before this fix. The earlier automated
 *    test only checked the menu wasn't `display:none`, which is why it
 *    passed while the feature was actually broken. Added real `items=`
 *    attributes to every dropdown demo.
 */

async function ready(page) {
  await page.goto('/demos/site/overlays.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WB, { timeout: 20000 });
}

test.describe('demos/site/overlays.html: dropdowns actually work', () => {
  test('every dropdown menu has real, visible items when opened (not an empty sliver)', async ({ page }) => {
    await ready(page);
    const dropdowns = page.locator('[x-dropdown]');
    const count = await dropdowns.count();
    expect(count).toBeGreaterThanOrEqual(6);

    for (let i = 0; i < count; i++) {
      const dd = dropdowns.nth(i);
      await dd.scrollIntoViewIfNeeded();
      const isHover = (await dd.getAttribute('trigger')) === 'hover';
      if (isHover) {
        await dd.hover();
      } else {
        await dd.click();
      }
      const menu = dd.locator('.x-dropdown__menu');
      const items = menu.locator('.x-dropdown__item');
      await expect(items.first(), `dropdown #${i} menu should have real items, not be empty`).toBeVisible({ timeout: 5000 });
      const itemCount = await items.count();
      expect(itemCount, `dropdown #${i} should have multiple menu items`).toBeGreaterThanOrEqual(2);
      if (isHover) {
        await page.mouse.move(0, 0);
      } else {
        await dd.click();
      }
    }
  });

  test('bottom-start/bottom-end/top-start/top-end each position the menu distinctly', async ({ page }) => {
    await ready(page);
    const positioned = page.locator('[x-dropdown][position]');
    const count = await positioned.count();
    expect(count).toBeGreaterThanOrEqual(4);

    const seen = new Set<string>();
    for (let i = 0; i < count; i++) {
      const dd = positioned.nth(i);
      const pos = await dd.getAttribute('position');
      await dd.scrollIntoViewIfNeeded();
      await dd.click();
      const menu = dd.locator('.x-dropdown__menu');
      await expect(menu).toBeVisible();
      const ddBox = await dd.boundingBox();
      const menuBox = await menu.boundingBox();
      const vertical = menuBox!.y >= ddBox!.y + ddBox!.height - 5 ? 'below' : 'above';
      const horizontal = Math.abs(menuBox!.x - ddBox!.x) < 5 ? 'left' : 'right';
      seen.add(`${pos}:${vertical}-${horizontal}`);
      await dd.click();
    }
    // All 4 positions should be geometrically distinct combinations.
    expect(seen.size, `expected 4 distinct position layouts, got: ${JSON.stringify([...seen])}`).toBe(4);
  });
});
