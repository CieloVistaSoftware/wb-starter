/**
 * THE PILL NAV ITEM STYLE (#828)
 * ==============================
 * John, on the sidebar: "What is needed to break away from this 'Square'
 * look?" and then "I like the inset pill, wb-starter needs to expose that as
 * an option."
 *
 * What reads as square is the active fill running wall to wall, not the
 * corner radius. x-sidebar now takes itemstyle="pill", and config/site.json's
 * navigationLayout.navigationItemStyle passes it to the site's left nav.
 * "block", the full-width fill, stays the default so no existing site
 * changes. The active item's text is var(--text-on-accent), not a literal
 * white.
 *
 * See it by hand: set "navigationItemStyle": "pill" in config/site.json and
 * open the site. Before: the active item is a square block from wall to
 * wall. Now: it is a rounded pill inset from both walls, and every label sits
 * where it did.
 */
import fs from 'fs';
import { test, expect, type Page } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';

// The site test mocks config/site.json, and a mocked response must not be
// answered by the service worker instead.
test.use({ serviceWorkers: 'block' });

const SITE_CONFIG = JSON.parse(fs.readFileSync('config/site.json', 'utf8'));

/** Open the site with navigationItemStyle set to `style` (or left out). */
async function openSite(page: Page, style?: string) {
  const config = structuredClone(SITE_CONFIG);
  if (style === undefined) delete config.navigationLayout.navigationItemStyle;
  else config.navigationLayout.navigationItemStyle = style;
  await page.route('**/config/site.json', (route) => route.fulfill({ json: config }));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#siteNav .x-sidebar__item--active')).toHaveCount(1, { timeout: 30000 });
}

/** Where the active item and its label sit, relative to the nav's walls. */
const measureActive = (page: Page) => page.evaluate(() => {
  const nav = document.getElementById('siteNav')!.getBoundingClientRect();
  const item = document.querySelector('#siteNav .x-sidebar__item--active')!;
  const box = item.getBoundingClientRect();
  const label = item.querySelector('.x-sidebar__label')!.getBoundingClientRect();
  return {
    pill: document.getElementById('siteNav')!.classList.contains('x-sidebar--pill'),
    insetLeft: Math.round(box.left - nav.left),
    insetRight: Math.round(nav.right - box.right),
    labelLeft: Math.round(label.left - nav.left),
    radius: parseFloat(getComputedStyle(item).borderTopLeftRadius),
  };
});

test('a site with no navigationItemStyle keeps the full-width block', async ({ page }) => {
  await openSite(page);
  const active = await measureActive(page);
  expect(active.pill).toBe(false);
  expect(active.radius).toBe(0);
});

test('navigationItemStyle "pill" insets the active fill from both walls and rounds it, and labels stay put', async ({ page }) => {
  await openSite(page, 'block');
  const block = await measureActive(page);
  await page.unroute('**/config/site.json');

  await openSite(page, 'pill');
  const pill = await measureActive(page);
  expect(pill.pill).toBe(true);
  expect(pill.insetLeft, 'inset from the left wall').toBeGreaterThan(block.insetLeft);
  expect(pill.insetRight, 'inset from the right wall').toBeGreaterThan(block.insetRight);
  expect(pill.radius, 'fully rounded').toBeGreaterThan(100);
  expect(pill.labelLeft, 'the label does not move').toBe(block.labelLeft);
});

test('x-sidebar itemstyle="pill" rounds its items, follows the attribute, and the active text is --text-on-accent', async ({ page }) => {
  await injectAndScan(page, '<div id="sb" x-sidebar items="Home,About" active="Home" itemstyle="pill"></div>');
  const sidebar = page.locator('#sb');
  await expect(sidebar).toHaveClass(/x-sidebar--pill/, { timeout: 15000 });
  const active = page.locator('#sb .x-sidebar__item--active');
  expect(parseFloat(await active.evaluate((el) => getComputedStyle(el).borderTopLeftRadius))).toBeGreaterThan(100);

  const [color, onAccent] = await active.evaluate((el) => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--text-on-accent)';
    el.append(probe);
    const expected = getComputedStyle(probe).color;
    probe.remove();
    return [getComputedStyle(el).color, expected];
  });
  expect(color).toBe(onAccent);

  await sidebar.evaluate((el) => el.setAttribute('itemstyle', 'block'));
  await expect(sidebar).not.toHaveClass(/x-sidebar--pill/);
});
