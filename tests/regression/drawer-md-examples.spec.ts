import { test, expect } from '@playwright/test';

/**
 * Full coverage of every live example on docs/behaviors/drawer.md, per
 * John's request: "write a full unit test to test each example, write a new
 * issue for every failure naming the test that found the failure, make the
 * fix retest." Loaded through doc-viewer.html exactly as a reader sees it --
 * mdhtml.js's auto-live-render (config.autoLiveRender) promotes every plain
 * ```html fenced block containing a <wb-*> tag or x-* attribute into a real
 * live <div x-demo>, so ALL FOUR of this doc's html examples render live, not
 * just the one explicitly wrapped in <div x-demo>.
 *
 * Two real failures found while writing this suite (both doc-content bugs,
 * not runtime bugs):
 *
 * #620: "With Data Attributes" used `x-drawerLayout` (camelCase, no
 * hyphen) -- HTML lowercases it to `x-drawerlayout` on parse, which matches
 * neither wb-lazy.js's registered dispatch key (`x-drawer-layout`, WITH a
 * hyphen -- confirmed via grep, elementMap['x-drawer-layout'] =
 * 'drawerLayout') nor `x-drawer` (a DIFFERENT behavior entirely, per
 * wb-lazy.js's own comment: "x-drawer-layout maps to a DIFFERENT behavior
 * (drawerLayout, a page-shell layout primitive) -- easy to conflate, but
 * not the same thing"). The div silently never got the drawerLayout()
 * behavior at all -- confirmed live: its only inline style was
 * `position: relative` (demo.js's own doc-link positioning-context fix, NOT
 * drawerLayout()'s `display:flex`/width/transition styling, which never
 * ran). Fixed by correcting the doc's example to `x-drawer-layout`.
 *
 * #621: the "Usage" fenced ```html block directly below the explicit
 * <div x-demo> repeats the EXACT SAME <div x-drawer-layout> markup already shown
 * live above it -- mdhtml.js's auto-live-render promotes it too, so the doc
 * rendered the identical live sidebar demo twice in a row. The doc's own
 * prose right above the first demo ("Wrapped in <div x-demo>, so the live
 * component renders below with its source shown underneath") confirms the
 * Usage section was always redundant -- the x-demo already shows the exact
 * same source in its own auto-generated code panel. Fixed by removing the
 * redundant "### Usage" section entirely.
 */

const DOC_URL = '/public/doc-viewer.html?file=docs%2Fcomponents%2Fdrawer.md';

async function loadDoc(page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(DOC_URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('[x-demo] .x-demo__grid', { timeout: 10000 });
  await page.waitForTimeout(1000);
  return errors;
}

test.describe('drawer.md: "Drawer Layout" live x-demo (position=left width=300px)', () => {
  test('renders a real <div x-drawer-layout> with the documented position/width applied', async ({ page }) => {
    const errors = await loadDoc(page);
    const layouts = page.locator('[x-drawer-layout]');
    await expect(layouts.first()).toHaveCount(1, { timeout: 5000 }).catch(() => {});
    const count = await layouts.count();
    expect(count, 'no <div x-drawer-layout> rendered at all on drawer.md').toBeGreaterThan(0);

    const el = layouts.first();
    await expect(el).toHaveAttribute('position', 'left');
    await expect(el).toHaveAttribute('width', '300px');

    const width = await el.evaluate((e) => getComputedStyle(e).width);
    expect(width, '[x-drawer-layout] did not apply the documented width').toBe('300px');

    const display = await el.evaluate((e) => getComputedStyle(e).display);
    expect(display, '[x-drawer-layout] behavior did not run (expected display:flex)').toBe('flex');

    expect(errors, `page errors while rendering drawer.md:\n${errors.join('\n')}`).toEqual([]);
  });

  test('sidebar content (h3 + nav) is preserved inside the drawer', async ({ page }) => {
    await loadDoc(page);
    const el = page.locator('[x-drawer-layout]').first();
    await expect(el.locator('h3')).toHaveText('Sidebar');
    await expect(el.locator('nav')).toContainText('Navigation content');
  });
});

test.describe('drawer.md: no redundant duplicate of the same live example (#621)', () => {
  test('the "Drawer Layout" example renders exactly once, not duplicated by a leftover Usage block', async ({ page }) => {
    await loadDoc(page);
    const layouts = page.locator('x-drawer-layout[position="left"][width="300px"]');
    const count = await layouts.count();
    expect(count, 'the same [x-drawer-layout] markup rendered more than once -- a redundant fenced block duplicated the [x-demo] above it').toBe(1);
  });
});

test.describe('drawer.md: "With Data Attributes" -- x-drawer-layout on a plain <div> (#620)', () => {
  test('the div actually receives the drawerLayout() behavior (flex layout + sized), not just an inert attribute', async ({ page }) => {
    const errors = await loadDoc(page);
    const div = page.locator('div[x-drawer-layout], div[x-drawerlayout]').first();
    await expect(div, 'no div carrying the drawer-layout data-attribute example was found').toHaveCount(1, { timeout: 5000 });

    // drawerLayout() (src/wb-viewmodels/layouts.js) unconditionally sets
    // display:flex + flexDirection:column as part of its base styling --
    // the one unambiguous signal the behavior actually ran on this host,
    // as opposed to the attribute just sitting there unrecognized.
    const display = await div.evaluate((e) => getComputedStyle(e).display);
    expect(display, 'drawerLayout() never ran on the x-drawer-layout div -- behavior was not dispatched').toBe('flex');

    const width = await div.evaluate((e) => getComputedStyle(e).width);
    expect(width, 'x-drawer-layout div did not apply its documented width="300px"').toBe('300px');

    expect(errors, `page errors while rendering drawer.md:\n${errors.join('\n')}`).toEqual([]);
  });
});

test.describe('drawer.md: "Drawer Overlay" -- x-drawer button opens a real panel', () => {
  test('clicking the button opens a drawer panel with the documented title and content', async ({ page }) => {
    const errors = await loadDoc(page);
    const btn = page.locator('button[x-drawer]').first();
    await expect(btn, 'no button carrying x-drawer was found').toHaveCount(1, { timeout: 5000 });
    await expect(btn).toHaveAttribute('title', 'Settings');

    await btn.scrollIntoViewIfNeeded();
    // Click near the button's own text, not its doc-link icon (top-right).
    await btn.click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(400);

    const panel = page.locator('.x-drawer__panel--open');
    await expect(panel, 'clicking the x-drawer button did not open a panel').toHaveCount(1, { timeout: 3000 });
    await expect(panel).toContainText('Settings');
    await expect(panel).toContainText('Settings content');

    const backdrop = page.locator('.x-drawer__backdrop--open');
    await expect(backdrop, 'drawer opened without its backdrop').toHaveCount(1);

    expect(errors, `page errors while opening the drawer:\n${errors.join('\n')}`).toEqual([]);
  });
});

test.describe('drawer.md: "JavaScript API" snippet -- programmatic drawer() call', () => {
  test('drawer(button, {title, content, position}) matches the documented signature and opens correctly', async ({ page }) => {
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );
    const result = await page.evaluate(async () => {
      const mod = await import('/src/wb-viewmodels/overlay.js');
      const button = document.createElement('button');
      button.id = 'my-btn';
      document.body.appendChild(button);
      mod.drawer(button, { title: 'My Drawer', content: 'Content here', position: 'left' });
      button.click();
      await new Promise((r) => setTimeout(r, 300));
      const panel = document.querySelector('.x-drawer__panel--open');
      return {
        panelFound: !!panel,
        text: panel ? panel.textContent : null,
        position: panel ? panel.className : null,
      };
    });
    expect(result.panelFound, 'programmatic drawer() call (matching the doc\'s JS API example) did not open a panel').toBe(true);
    expect(result.text).toContain('My Drawer');
    expect(result.text).toContain('Content here');
    expect(result.position).toContain('x-drawer--left');
  });
});
