import { test, expect, Page } from '../fixtures/offline';

/**
 * Issue #365: an audit created a bare `<wb-{tag}></wb-{tag}>` for each of 96
 * component schemas, ran `await WB.scan()`, and flagged 20 as completely inert
 * (empty className + zero children after a settle delay). x-skeleton was
 * confirmed a false positive (its CSS is intentionally tag-selector-only).
 * The other 19 were assumed dead/unused as a batch and deprioritized without
 * per-tag verification -- this session re-verified each one individually.
 *
 * x-fix-card was the one genuine, previously-unreported live bug found in
 * that follow-up: it IS used (tests/behaviors/_misc/fix-card-layout.html),
 * but was inert for two stacked reasons:
 *   1. fix-card.js (the WBFixCard custom-element class, which self-registers
 *      via customElements.define('[x-fix-card]', ...)) was never imported by
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
 * Fix: registered '[x-fix-card]' -> 'fix-card' in tag-map.js's elementMap and
 * wb-viewmodels/index.js's behaviorModules (mirroring [x-control].js's
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
    // Same non-eager await WB.scan() path as card-typed-variants-no-op.spec.ts --
    // custom elements are deferred to an IntersectionObserver and scan()
    // does not await that, so callers must poll afterward rather than
    // trusting a fixed-instant check.
    await (window as any).WB.scan(container);
    return Array.from(container.children).map(el => el.id).filter(Boolean);
  }, html);
  return ids;
}

test.describe('[x-fix-card] actually upgrades and renders (#365)', () => {
  test('bare <div x-fix-card> upgrades to the real custom element class', async ({ page }) => {
    await inject(page, `<div x-fix-card id="fc-upgrade"></div>`);

    // The class 'x-fixcard' (#1096: fixCard lowercased; the attribute is still
    // x-fix-card) is only added by the fixCard() behavior -- it only runs if
    // WB.scan() actually imported fix-card.js. Before the fix, this class
    // never appeared because fix-card.js was never imported.
    await page.waitForFunction(
      () => document.getElementById('fc-upgrade')?.classList.contains('x-fixcard'),
      // waitForFunction(fn, ARG, options): the options object used to sit in
      // the ARG slot, so this 5s bound was never applied and a missing class
      // hung until the 30s test timeout instead of failing here.
      undefined,
      { timeout: 5000 }
    );

    const hasUpgraded = await page.locator('#fc-upgrade').evaluate((el) => {
      // `data` must be a real ACCESSOR -- setter logic that renders. On an
      // inert element, `.data = x` just creates a plain data property that
      // does nothing, which is the #365 failure this guards.
      //
      // Where the accessor lives is not the contract. This used to look only
      // at the prototype, i.e. demand a custom-element upgrade -- but a <div>
      // can never be upgraded to a custom element class (only an element whose
      // TAG is x-fix-card can), so on the 4.0.0 attribute form that check could
      // not pass. fixCard() composes the capability onto the element itself
      // (Tier 1: composition, not subclassing), so walk the chain from the
      // element up and accept the first descriptor found.
      for (let o: any = el; o; o = Object.getPrototypeOf(o)) {
        const desc = Object.getOwnPropertyDescriptor(o, 'data');
        if (desc) return typeof desc.set === 'function';
      }
      return false;
    });
    expect(hasUpgraded, '<div x-fix-card> must carry a real `data` accessor that renders').toBe(true);
  });

  test('setting .data on an upgraded <div x-fix-card> actually renders content', async ({ page }) => {
    await inject(page, `<div x-fix-card id="fc-render"></div>`);
    await page.waitForFunction(
      () => document.getElementById('fc-render')?.classList.contains('x-fixcard'),
      undefined,   // see the note in the test above: options go third
      { timeout: 5000 }
    );

    await page.locator('#fc-render').evaluate((el: any) => {
      el.data = {
        errorId: 'TEST-365',
        issue: 'Regression check',
        component: 'schema-tags-render-audit.spec.ts',
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
    expect(childCount, '[x-fix-card] must produce real child content once .data is set').toBeGreaterThan(0);
  });
});

// #789: the <x-fix-card> TAG used to be `class WBFixCard extends WBCard`. It is
// now a shim that applies the same fixCard() behavior to itself, so both forms
// share one code path. These pin the tag form's contract through that change.
test.describe('<x-fix-card> tag renders through the fix-card behavior (#789)', () => {
  const FIX = {
    errorId: 'TEST-789',
    issue: 'Tag form',
    component: 'fix-card.js',
    date: '2026-10-06T17:00:00Z',
    status: 'FIXED',
    cause: 'the tag subclassed WBCard',
    fix: { action: 'composition shim', file: 'src/wb-viewmodels/fix-card.js' },
    testRun: true,
    testName: 'tests/regression/schema-tags-render-audit.spec.ts',
  };

  test('data set before the tag is attached renders once it is, with one card, and survives a move', async ({ page }) => {
    await page.goto(HARNESS);
    await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 10000 });
    const r = await page.evaluate(async (fix) => {
      await import('/src/wb-viewmodels/fix-card.js');
      const el: any = document.createElement('x-fix-card');
      el.data = fix;
      const a = document.createElement('div');
      const b = document.createElement('div');
      document.body.append(a, b);
      a.appendChild(el);
      await (window as any).WB.scan(a);
      const first = {
        cls: el.className,
        title: el.querySelector('.fix-title')?.textContent,
        headers: el.querySelectorAll('.card-header').length,
      };
      b.appendChild(el);   // move: disconnect + connect
      return {
        first,
        moved: {
          title: el.querySelector('.fix-title')?.textContent,
          headers: el.querySelectorAll('.card-header').length,
          data: el.data?.errorId,
        },
        proto: Object.getPrototypeOf(Object.getPrototypeOf(el)) === HTMLElement.prototype,
      };
    }, FIX);
    expect(r.first.cls.split(/\s+/), 'fixCard() adds x-fixcard (#1096)').toContain('x-fixcard');
    expect(r.first.title).toBe('Tag form');
    expect(r.first.headers, 'one card, not one per path that reached the tag').toBe(1);
    expect(r.moved.title, 'moving the card keeps its record').toBe('Tag form');
    expect(r.moved.headers).toBe(1);
    expect(r.moved.data).toBe('TEST-789');
    expect(r.proto, 'the tag class extends HTMLElement directly: no component hierarchy').toBe(true);
  });
});
