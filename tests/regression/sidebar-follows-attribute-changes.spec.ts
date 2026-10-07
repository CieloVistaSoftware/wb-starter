import { test, expect } from '../fixtures/offline';

/**
 * x-sidebar FOLLOWS ITS ATTRIBUTES AFTER LOAD (#1683)
 * ==================================================
 * sidebar() (src/wb-viewmodels/navigation.js) read `collapsed` through
 * read-attr.js (plain or data-* spelling) but `items` and `active` with
 * getAttribute -- the plain spelling only. So `data-items` rendered an empty
 * nav. Its MutationObserver watched ONLY the data-* spellings, and on a change
 * re-read the PLAIN spelling:
 *   - setAttribute('active', ...)        never re-rendered (not observed);
 *   - setAttribute('data-active', ...)   re-rendered with the OLD plain value.
 * Either way the highlighted item never moved.
 *
 * See it by hand: on a page with <nav x-sidebar items="Home,Docs" active="Home">,
 * run el.setAttribute('active', 'Docs') in the console. Before: Home stays
 * highlighted. Now: Docs is.
 */

async function mountSidebar(page, attrs: string) {
  await page.goto('/tests/fixtures/blank.html');
  await page.setContent(`
    <nav id="sb" x-sidebar ${attrs}></nav>
    <script type="module">
      import WB from '/src/core/wb.js';
      WB.init({ autoInject: true }).then(() => WB.scan(document.body, { eager: true }));
    </script>
  `);
  await expect(page.locator('#sb .x-sidebar__item')).toHaveCount(3, { timeout: 10_000 });
}

const active = (page) => page.locator('#sb .x-sidebar__item--active');

for (const prefix of ['', 'data-']) {
  const name = (n: string) => `${prefix}${n}`;

  test(`x-sidebar re-renders when ${name('active')} changes`, async ({ page }) => {
    await mountSidebar(page, `${name('items')}="Home,Docs,About" ${name('active')}="Home"`);
    await expect(active(page)).toHaveText('Home');
    await page.evaluate((a) => document.getElementById('sb')!.setAttribute(a, 'Docs'), name('active'));
    await expect(active(page)).toHaveText('Docs');
  });

  test(`x-sidebar re-renders when ${name('items')} changes`, async ({ page }) => {
    await mountSidebar(page, `${name('items')}="Home,Docs,About"`);
    await page.evaluate((a) => document.getElementById('sb')!.setAttribute(a, 'One,Two'), name('items'));
    await expect(page.locator('#sb .x-sidebar__item')).toHaveText(['One', 'Two']);
  });

  test(`x-sidebar collapses and expands when ${name('collapsed')} changes`, async ({ page }) => {
    await mountSidebar(page, `${name('items')}="Home,Docs,About"`);
    const sb = page.locator('#sb');
    await expect(sb).not.toHaveClass(/x-sidebar--collapsed/);
    await page.evaluate((a) => document.getElementById('sb')!.setAttribute(a, ''), name('collapsed'));
    await expect(sb).toHaveClass(/x-sidebar--collapsed/);
    await page.evaluate((a) => document.getElementById('sb')!.removeAttribute(a), name('collapsed'));
    await expect(sb).not.toHaveClass(/x-sidebar--collapsed/);
  });
}
