import { test, expect } from '../fixtures/offline';
import { wbIdle } from '../base';
import { pagePath } from '../helpers/page-path';

/**
 * THE SITE'S LEFT NAV IS THE LIBRARY'S OWN x-sidebar (#829, step 4)
 * ================================================================
 * site-engine.js built the left nav as HTML strings (<a class="nav__item">)
 * and ran its own active highlighting, collapse and drag-resize beside it,
 * while sidebar() in src/wb-viewmodels/navigation.js did the same job and the
 * site never used it: two implementations of one collapsible sidebar.
 *
 * Now the site nav is <nav x-sidebar resizable> fed from config/site.json.
 * x-sidebar learned what the site needed: items with an icon, an id and a
 * target (JSON items), `active` matched by id, a drag (and keyboard) resize
 * handle, and an accessible name for each item while collapsed.
 *
 * See it by hand: open the site at desktop width and inspect the left nav.
 * Before: <nav class="site__nav"> holding <a class="nav__item">. Now: <nav
 * class="site__nav x-sidebar" x-sidebar> holding <a class="x-sidebar__item">;
 * the ☰ button collapses it to icons, and its right edge drags (or, focused,
 * takes the arrow keys) to resize it.
 */

const MENU_IDS = ['home', 'behaviors', 'themes', 'docs', 'about'];

async function openSite(page, path = '/?page=home') {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await wbIdle(page);
  await page.waitForFunction(() => 'WBSite' in window, undefined, { timeout: 30000 });
}

const nav = (page) => page.locator('#siteNav');
const item = (page, id: string) => page.locator(`#siteNav .x-sidebar__item[href="${pagePath(id)}"]`);

test('the site nav is an x-sidebar and every menu item is one of its items', async ({ page }) => {
  await openSite(page);
  await expect(nav(page)).toHaveClass(/\bx-sidebar\b/);
  await expect(nav(page)).toHaveAttribute('x-sidebar', '');
  const config = await page.evaluate(() => (window as any).WBSite.config.navigationMenu.length);
  await expect(page.locator('#siteNav .x-sidebar__item')).toHaveCount(config);
  await expect(page.locator('#siteNav .nav__item'), 'no hand-rolled item is left').toHaveCount(0);
  for (const id of MENU_IDS) await expect(item(page, id)).toHaveCount(1);
  const home = item(page, 'home');
  await expect(home.locator('.x-sidebar__icon')).toHaveText('🏠');
  await expect(home.locator('.x-sidebar__label')).toHaveText('Home');
  // A plain <nav> picks up navbar; a <nav> that names x-sidebar keeps only it.
  await expect(nav(page)).not.toHaveClass(/x-navbar/);
});

test('the active item follows navigation, one at a time, with aria-current', async ({ page }) => {
  await openSite(page);
  const active = page.locator('#siteNav .x-sidebar__item--active');
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute('href', pagePath('home'));
  await expect(active).toHaveAttribute('aria-current', 'page');

  await item(page, 'themes').click();
  await page.waitForSelector('#mainPage-themes', { timeout: 20000 });
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute('href', pagePath('themes'));
  await expect(item(page, 'home')).not.toHaveAttribute('aria-current', 'page');
});

test('the toggle collapses the nav to its icons and expands it again', async ({ page }) => {
  await openSite(page);
  const label = item(page, 'home').locator('.x-sidebar__label');
  const icon = item(page, 'home').locator('.x-sidebar__icon');
  await expect(label).toBeVisible();
  await expect(icon).toBeHidden();

  await page.click('#navToggle');
  await expect(nav(page)).toHaveClass(/x-sidebar--collapsed/);
  await expect(nav(page)).toHaveAttribute('collapsed', '');
  await expect(label).toBeHidden();
  await expect(icon).toBeVisible();
  await expect(item(page, 'home'), 'an icon-only item still has a name').toHaveAttribute('aria-label', 'Home');
  await expect.poll(async () => Math.round((await nav(page).boundingBox())!.width)).toBe(60);

  await page.click('#navToggle');
  await expect(nav(page)).not.toHaveClass(/x-sidebar--collapsed/);
  await expect(label).toBeVisible();
});

test('the nav keeps the active item through a collapse', async ({ page }) => {
  await openSite(page, '/?page=about');
  await page.click('#navToggle');
  await expect(nav(page)).toHaveClass(/x-sidebar--collapsed/);
  await expect(page.locator('#siteNav .x-sidebar__item--active')).toHaveAttribute('href', pagePath('about'));
});

test('the right edge drags to resize the nav, and takes the arrow keys', async ({ page }) => {
  await openSite(page);
  const handle = page.locator('#siteNav > .x-sidebar__resizer');
  await expect(handle).toHaveCount(1);
  await expect(handle).toHaveAttribute('role', 'separator');
  const width = async () => Math.round((await nav(page).boundingBox())!.width);

  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(320, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect.poll(width).toBe(320);

  await handle.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(width).toBe(330);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect.poll(width).toBe(310);
  await expect(handle).toHaveAttribute('aria-valuenow', '310');
});

test('on a phone the ☰ button opens the nav with its items', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/?page=home', { waitUntil: 'domcontentloaded' });
  await wbIdle(page);
  await page.waitForFunction(() => 'WBSite' in window, undefined, { timeout: 30000 });
  await expect(nav(page)).toBeHidden();
  await page.click('#navToggle');
  await expect(nav(page)).toHaveClass(/site__nav--mobile-open/);
  await expect(item(page, 'themes')).toBeVisible();
  await expect(page.locator('#siteNav > .x-sidebar__resizer'), 'no resize handle on a phone').toBeHidden();
});

test('x-sidebar on its own: JSON items with icons, active by id, resizable', async ({ page }) => {
  await page.goto('/tests/fixtures/blank.html');
  await page.setContent(`
    <nav id="sb" x-sidebar resizable active="b"
      items='[{"id":"a","label":"Alpha","href":"#a","icon":"★"},{"id":"b","label":"Beta","href":"#b","icon":"☆","target":"_blank"}]'></nav>
    <script type="module">
      import WB from '/src/core/wb.js';
      WB.init({ autoInject: true }).then(() => WB.scan(document.body, { eager: true }));
    </script>
  `);
  const items = page.locator('#sb .x-sidebar__item');
  await expect(items).toHaveCount(2, { timeout: 10_000 });
  await expect(items.nth(0).locator('.x-sidebar__icon')).toHaveText('★');
  await expect(items.nth(0).locator('.x-sidebar__label')).toHaveText('Alpha');
  await expect(items.nth(1)).toHaveAttribute('target', '_blank');
  await expect(page.locator('#sb .x-sidebar__item--active')).toHaveText(/Beta/);
  await page.evaluate(() => document.getElementById('sb')!.setAttribute('active', 'a'));
  await expect(page.locator('#sb .x-sidebar__item--active')).toHaveText(/Alpha/);
  await expect(page.locator('#sb > .x-sidebar__resizer')).toHaveCount(1);
});
