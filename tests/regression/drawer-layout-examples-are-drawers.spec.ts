import { test, expect } from '../fixtures/offline';

/**
 * The Behaviors page's x-drawer-layout examples are drawers (#1928).
 *
 * John, 2026-10-16: "run tests on these, they aren't working correct". All five
 * (wide, narrow, right side, with a heading, icons only) showed one line of
 * run-together links ("InboxStarredSentArchive") and, hidden under the visible
 * one, a second toggle button. Present on every date bisected back to
 * 2026-09-15; the 40 existing drawer specs never looked for any of it.
 *
 *  - two toggles: drawerLayout() ran twice, reached as 'drawerLayout'
 *    (tag-map) and 'drawer-layout' (the attribute, an export alias); the
 *    runtimes compared raw names. canonicalBehaviorName() folds them.
 *  - one line, no panel: layout.css gave the drawer no surface and its <nav>
 *    no list layout.
 */
const EXAMPLES = ['wide drawer', 'narrow drawer', 'right side', 'with a heading', 'icons only'];

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1300, height: 800 });
  await page.goto('/?page=behaviors');
  await expect(page.locator('.behaviors-live__body')).toBeVisible({ timeout: 20000 });
});

for (const label of EXAMPLES) {
  test(`x-drawer-layout "${label}": one toggle, a visible panel, links stacked`, async ({ page }) => {
    await page.evaluate((l) => {
      const row = [...document.querySelectorAll('.behaviors-search-results__row')]
        .find((r) => /x-drawer-la/.test(r.textContent || '') && (r.textContent || '').includes(l));
      (row as HTMLElement).click();
    }, label);
    const drawer = page.locator('#behaviors-live-stage [x-drawer-layout]');
    await expect(drawer).toHaveClass(/x-drawerlayout/, { timeout: 15000 });

    const m = await drawer.evaluate((el) => {
      const cs = getComputedStyle(el);
      const links = [...el.querySelectorAll('nav a')];
      return {
        toggles: el.querySelectorAll(':scope > button').length,
        background: cs.backgroundColor,
        border: parseFloat(cs.borderTopWidth),
        links: links.length,
        rows: new Set(links.map((a) => Math.round(a.getBoundingClientRect().y))).size,
      };
    });
    expect(m.toggles, 'drawerLayout ran once: one toggle button').toBe(1);
    expect(m.background, 'the drawer has a surface').not.toBe('rgba(0, 0, 0, 0)');
    expect(m.border, 'the drawer has an edge').toBeGreaterThan(0);
    if (m.links > 1) expect(m.rows, 'menu links are stacked, one per row').toBe(m.links);
  });
}

test('the toggle collapses the drawer to its minWidth and opens it again', async ({ page }) => {
  await page.evaluate(() => {
    const row = [...document.querySelectorAll('.behaviors-search-results__row')]
      .find((r) => /x-drawer-la/.test(r.textContent || '') && (r.textContent || '').includes('wide drawer'));
    (row as HTMLElement).click();
  });
  const drawer = page.locator('#behaviors-live-stage [x-drawer-layout]');
  await expect(drawer).toHaveClass(/x-drawerlayout/, { timeout: 15000 });
  const open = (await drawer.boundingBox())!.width;
  await drawer.locator(':scope > button').click();
  await expect(drawer).toHaveClass(/collapsed/);
  await expect.poll(async () => (await drawer.boundingBox())!.width, 'collapsed to minWidth 64px').toBeLessThan(open / 2);
  await drawer.locator(':scope > button').click();
  await expect(drawer).not.toHaveClass(/collapsed/);
  await expect.poll(async () => Math.round((await drawer.boundingBox())!.width)).toBe(Math.round(open));
});
