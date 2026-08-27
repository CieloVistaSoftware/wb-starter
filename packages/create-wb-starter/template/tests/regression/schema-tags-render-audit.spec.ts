import { test, expect, Page } from '@playwright/test';

/**
 * Issue #365: an audit created a bare `<wb-{tag}></wb-{tag}>` for each of 96
 * behavior schemas, ran `WB.scan()`, and flagged 20 as completely inert
 * (empty className + zero children after a settle delay). x-skeleton was
 * confirmed a false positive (its CSS is intentionally tag-selector-only).
 * The other 19 were assumed dead/unused as a batch and deprioritized without
 * per-tag verification -- this session re-verified each one individually.
 *
 * x-fix-card was the one genuine, previously-unreported live bug found in
 * that follow-up: it IS used (tests/behaviors/_misc/fix-card-layout.html),
 * but was inert for two stacked reasons:
 *   1. fix-card.js (the WBFixCard custom-element class, which self-registers
 *      via customElements.define('x-fix-card', ...)) was never imported by
 *      anything in the live app -- not eagerly (unlike x-grid.js/
 *      x-demo.js), not via tag-map.js's elementMap, not via
 *      wb-viewmodels/index.js's lazy-load behaviorModules registry. So the
 *      tag never upgraded to the real class, and its `.data =` setter
 *      (the only thing that triggers render()) silently did nothing on a
 *      plain, un-upgraded HTMLElement.
 *   2. The manual test fixture that DOES use it
 *      (tests/behaviors/_misc/fix-card-layout.html) pointed its own
 *      <script type="module" src="/src/behaviors/js/fix-card.js"> at a path
 *      that doesn't exist (the real file is src/wb-viewmodels/fix-card.js)
 *      -- a second, independent reason the class never loaded there either.
 *
 * Fix: registered 'x-fix-card' -> 'fix-card' in tag-map.js's elementMap and
 * wb-viewmodels/index.js's behaviorModules (mirroring x-control.js's
 * established pattern of a self-registering custom-element class that also
 * exports a default behavior function for the lazy-loader to resolve),
 * corrected the stale fixture path, and added x-fix-card to both
 * SCHEMA_EXCLUDED_TAGS lists (schema-builder.js + wb.js's processSchema) --
 * WBFixCard extends WBCard and rebuilds its own DOM unconditionally exactly
 * like the rest of the x-card* family, but its literal tag name doesn't
 * start with "WB-CARD" so the existing tagName.startsWith('WB-CARD') check
 * silently missed it.
 *
 * The other 18 (x-autocomplete, x-behavior, x-behaviors, x-colorpicker,
 * x-counter, x-error, x-fieldset, x-file, x-floatinglabel, x-formrow,
 * x-help, x-inputgroup, x-label, x-masked, x-tags, wb-views, x-wizard,
 * x-search-index) were re-confirmed to have zero real-world usage as their
 * own bare custom tag anywhere in pages/demos/docs/tests, AND (for the 13
 * form-enhancement tags) are declared `"wbBehavior": {"type": "modifier"}`
 * with an intentionally empty `$view: []` -- they were designed to attach to
 * a native element via an x-* attribute, never to exist as a standalone
 * <wb-X> tag, so "renders nothing as a bare tag" is the same class of
 * false positive as x-skeleton, not a bug. See the #365 issue comment
 * (posted this session) for the full per-tag table.
 */

const HARNESS = '/demos/test-harness.html';

async function inject(page: Page, html: string) {
  await page.goto(HARNESS);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  const ids = await page.evaluate(async (h: string) => {
    const existing = document.getElementById('test-container');
    if (existing) existing.remove();
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = h;
    document.body.appendChild(container);
    // Same non-eager WB.scan() path as card-typed-variants-no-op.spec.ts --
    // custom elements are deferred to an IntersectionObserver and scan()
    // does not await that, so callers must poll afterward rather than
    // trusting a fixed-instant check.
    await (window as any).WB.scan(container);
    return Array.from(container.children).map(el => el.id).filter(Boolean);
  }, html);
  return ids;
}

test.describe('x-fix-card actually upgrades and renders (#365)', () => {
  test('bare <div x-fix-card> upgrades to the real custom element class', async ({ page }) => {
    await inject(page, `<div x-fix-card id="fc-upgrade"></div>`);

    // 'fix-card' is only added by WBFixCard.connectedCallback -- it only
    // fires if customElements.define('x-fix-card', WBFixCard) actually ran
    // and the browser upgraded the element. Before the fix, this class
    // never appeared because fix-card.js was never imported.
    await page.waitForFunction(
      () => document.getElementById('fc-upgrade')?.classList.contains('fix-card'),
      { timeout: 5000 }
    );

    const hasUpgraded = await page.locator('#fc-upgrade').evaluate((el) => {
      // A real custom-element upgrade replaces the element's prototype --
      // 'data' becomes an accessor (getter/setter) on WBFixCard.prototype,
      // not a plain own property. On a never-upgraded HTMLElement, setting
      // .data would just create a plain own property with no setter logic.
      const proto = Object.getPrototypeOf(el);
      const desc = Object.getOwnPropertyDescriptor(proto, 'data');
      return typeof desc?.set === 'function';
    });
    expect(hasUpgraded, 'x-fix-card must upgrade to WBFixCard (data must be a real accessor)').toBe(true);
  });

  test('setting .data on an upgraded <div x-fix-card> actually renders content', async ({ page }) => {
    await inject(page, `<div x-fix-card id="fc-render"></div>`);
    await page.waitForFunction(
      () => document.getElementById('fc-render')?.classList.contains('fix-card'),
      { timeout: 5000 }
    );

    await page.locator('#fc-render').evaluate((el: any) => {
      el.data = {
        errorId: 'TEST-365',
        issue: 'Regression check',
        behavior: 'schema-tags-render-audit.spec.ts',
        date: new Date().toISOString(),
        status: 'FIXED',
        cause: 'fix-card.js was never imported anywhere',
        fix: { action: 'Wired tag-map.js + behaviorModules', file: 'src/wb-viewmodels/fix-card.js' },
        testRun: true,
        testName: 'tests/regression/schema-tags-render-audit.spec.ts'
      };
    });

    // Before the fix this was a silent no-op (render() bails on
    // `!this.fixData || !this.card` when the setter never ran) -- the
    // element stayed at zero children, matching the original audit's
    // "empty className + zero children" inert signal exactly.
    await expect(page.locator('#fc-render .fix-title')).toHaveText('Regression check');
    await expect(page.locator('#fc-render .fix-status')).toHaveText('FIXED');
    const childCount = await page.locator('#fc-render').evaluate((el) => el.children.length);
    expect(childCount, 'x-fix-card must produce real child content once .data is set').toBeGreaterThan(0);
  });
});
