import { test, expect } from '../fixtures/offline';

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
 *
 * docs/components/drawer.md no longer exists. The drawer docs were split into
 * docs/behaviors/drawer.md (x-drawer, the slide-out panel) and
 * docs/behaviors/drawerLayout.md (x-drawer-layout, the collapsible sidebar),
 * and both were rewritten around a single live example each -- so every test
 * below that loaded the old URL waited on a demo that could never appear. They
 * now cover the live examples those two docs actually show; the #620
 * (dispatched, not inert) and #621 (rendered once, not duplicated) guards
 * carry over unchanged.
 */

const DRAWER_DOC = '/public/doc-viewer.html?file=docs%2Fbehaviors%2Fdrawer.md';
const LAYOUT_DOC = '/public/doc-viewer.html?file=docs%2Fbehaviors%2FdrawerLayout.md';

async function loadDoc(page, url: string) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'networkidle' });
  const demo = page.locator('[x-demo]').first();
  // Lazy runtime (#491): the demo only builds once it is near the viewport.
  await demo.scrollIntoViewIfNeeded();
  await expect(demo.locator('.x-demo__grid')).toBeVisible({ timeout: 10000 });
  return errors;
}

test.describe('drawerLayout.md: live x-demo (width=220px)', () => {
  test('renders a real x-drawer-layout with the documented width applied', async ({ page }) => {
    const errors = await loadDoc(page, LAYOUT_DOC);
    const el = page.locator('[x-demo] [x-drawer-layout]').first();
    await el.scrollIntoViewIfNeeded();
    await expect(el).toHaveAttribute('x-ready', '', { timeout: 10000 });
    await expect(el).toHaveAttribute('width', '220px');

    // drawerLayout() (src/wb-viewmodels/layouts.js) unconditionally sets
    // display:flex as part of its base styling -- the one unambiguous signal
    // the behavior actually ran on this host (#620), as opposed to the
    // attribute just sitting there unrecognized.
    await expect(el, '[x-drawer-layout] behavior did not run (expected display:flex)').toHaveCSS('display', 'flex');
    await expect(el, '[x-drawer-layout] did not apply the documented width').toHaveCSS('width', '220px');

    expect(errors, `page errors while rendering drawerLayout.md:\n${errors.join('\n')}`).toEqual([]);
  });

  test('sidebar content (nav links) is preserved inside the drawer', async ({ page }) => {
    await loadDoc(page, LAYOUT_DOC);
    const el = page.locator('[x-demo] [x-drawer-layout]').first();
    await el.scrollIntoViewIfNeeded();
    await expect(el.locator('nav a')).toHaveText(['Overview', 'Runs', 'Settings']);
  });
});

test.describe('drawerLayout.md: no redundant duplicate of the same live example (#621)', () => {
  test('the example renders exactly once, not duplicated by a leftover Usage block', async ({ page }) => {
    await loadDoc(page, LAYOUT_DOC);
    await expect(page.locator('[x-drawer-layout][width="220px"]'),
      'the same [x-drawer-layout] markup rendered more than once -- a redundant fenced block duplicated the [x-demo] above it',
    ).toHaveCount(1);
  });
});

test.describe('drawer.md: Usage -- x-drawer button opens a real panel', () => {
  test('clicking the button opens a drawer panel with the documented title and content', async ({ page }) => {
    const errors = await loadDoc(page, DRAWER_DOC);
    const btn = page.locator('[x-demo] button[x-drawer]').first();
    await btn.scrollIntoViewIfNeeded();
    await expect(btn).toHaveAttribute('x-ready', '', { timeout: 10000 });
    await expect(btn).toHaveAttribute('title', 'Filters');
    await expect(btn).toContainText('Open filters');

    // Click near the button's own text, not its doc-link icon (top-right).
    await btn.click({ position: { x: 10, y: 10 } });

    const panel = page.locator('.x-drawer__panel--open');
    await expect(panel, 'clicking the x-drawer button did not open a panel').toHaveCount(1, { timeout: 3000 });
    await expect(panel.locator('.x-drawer__title')).toHaveText('Filters');
    await expect(panel.locator('.x-drawer__body')).toContainText('Status, owner, label and date range live here.');
    await expect(page.locator('.x-drawer__backdrop--open'), 'drawer opened without its backdrop').toHaveCount(1);

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
      // #1493: the panel gets x-drawer__panel--open inside requestAnimationFrame
      // (overlay.js show()). A fixed 300ms sleep lost that race on a busy CI
      // runner, where frames come late; wait for the panel itself (5s cap).
      const deadline = performance.now() + 5000;
      let panel: Element | null = null;
      while (!(panel = document.querySelector('.x-drawer__panel--open')) && performance.now() < deadline) {
        await new Promise((r) => requestAnimationFrame(r));
      }
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
