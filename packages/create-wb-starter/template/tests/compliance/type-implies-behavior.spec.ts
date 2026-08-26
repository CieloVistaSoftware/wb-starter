/**
 * Type-Implies-Behavior Rule (see docs/standards/V3-STANDARDS.md, "Type-Implies-Behavior
 * Rule" section, #481) — if a native `type="…"` value unambiguously implies exactly one
 * behavior, that behavior must be auto-inferred from `nativeMap` alone; a redundant
 * `x-{name}` attribute of the same name must never be required. `<input type="checkbox">`
 * needs no `x-checkbox`; `<input type="password">` needs no `x-password` (#481, previously
 * required x-password only — nativeMap had no `input[type="password"]` entry).
 *
 * `wb-*` custom elements already satisfy this by construction (elementMap keys behaviors by
 * tag name) — this file also spot-checks that a couple of them never secretly need a matching
 * x-attribute on top of the bare tag.
 *
 * Regression guard: any FUTURE behavior whose name exactly matches a native <input> type
 * value must be explicitly classified below — an unclassified match fails loudly instead of
 * silently reproducing the #481 bug under a new name.
 */
import { test, expect } from '@playwright/test';

// Behaviors whose name exactly matches a native <input type="…"> value, and that DO get
// auto-inferred from nativeMap alone — no x-{name} attribute should ever be required.
const AUTO_INFER = ['checkbox', 'radio', 'range', 'password'];

// Per-behavior signal that proves the behavior actually ran, evaluated in-page against the
// rendered #probe element. checkbox() is CSS-injection-only by design (no wrapper, no class
// — see semantics/checkbox.js's own header comment: "No wrapper, no fake span, no classes"),
// so it needs a different signal than the others' added class.
function isEnhanced(behaviorName) {
  const el = document.getElementById('probe');
  if (behaviorName === 'checkbox') {
    return [...document.querySelectorAll('style')].some(s => s.textContent.includes('input[type="checkbox"]'));
  }
  if (behaviorName === 'password') {
    return !!el.parentElement && el.parentElement.classList.contains('x-password');
  }
  return el.classList.contains(`wb-${behaviorName}`);
}

// Behaviors whose name exactly matches a native <input type="…"> value, but that
// deliberately still require the explicit x-{name} attribute — native type="search"/
// type="file" already render usably on their own, so the richer wrapper is an opt-in
// upgrade, not something every instance of that type obviously wants. `marker` is the class
// the RICHER behavior specifically adds — search still gets the unrelated generic input()
// wrapper (x-input__field) for free like any other text-like type, so absence of ALL classes
// isn't the right check; absence of search()'s own marker is.
const OPT_IN_BY_DESIGN = {
  search: { marker: 'x-search__input' },
  file: { marker: 'x-file__input' },
  // 'image'/'button' behaviors (card.js's image()/button()) enhance <img>/<button> TAGS
  // (already correctly native-mapped via their own tag selectors) and only coincidentally
  // share a name with the rare/deprecated <input type="image">/<input type="button">) values
  // — they were never candidates for input[type=] auto-infer at all, so there is no marker to
  // check here; listing them is purely to satisfy the regression-guard classification below.
  image: { marker: null },
  button: { marker: null },
};

// Every value the HTML5 spec allows for <input type="…">.
const NATIVE_INPUT_TYPES = new Set([
  'text', 'password', 'email', 'tel', 'url', 'number', 'date', 'datetime-local',
  'month', 'week', 'time', 'checkbox', 'radio', 'range', 'color', 'file', 'search',
  'submit', 'reset', 'button', 'image', 'hidden'
]);

async function renderWithWB(page, coreModule: string, html: string) {
  await page.goto('/tests/fixtures/blank.html');
  await page.setContent(`
    ${html}
    <script type="module">
      import WB from '${coreModule}';
      window.__wb = WB;
      window.__wbDone = false;
      WB.init({ autoInject: true }).then(() => WB.scan(document.body)).then(() => { window.__wbDone = true; });
    </script>
  `);
  await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
}

test.describe('Type-implies-behavior rule — static registry checks', () => {
  test('every AUTO_INFER behavior has a nativeMap entry keyed by its native type', async ({ page }) => {
    await page.goto('/tests/fixtures/blank.html');
    const nativeMap = await page.evaluate(async () => {
      const mod = await import('/src/core/tag-map.js');
      return mod.nativeMap;
    });
    for (const name of AUTO_INFER) {
      expect(nativeMap[`input[type="${name}"]`], `nativeMap should map input[type="${name}"] -> '${name}'`).toBe(name);
    }
  });

  test('OPT_IN_BY_DESIGN behaviors stay explicit — nativeMap must NOT auto-infer them', async ({ page }) => {
    await page.goto('/tests/fixtures/blank.html');
    const nativeMap = await page.evaluate(async () => {
      const mod = await import('/src/core/tag-map.js');
      return mod.nativeMap;
    });
    for (const name of Object.keys(OPT_IN_BY_DESIGN)) {
      expect(nativeMap[`input[type="${name}"]`], `nativeMap should NOT auto-infer '${name}' from type= alone`).toBeUndefined();
    }
  });

  test('no unclassified behavior name matches a native <input> type (regression guard)', async ({ page }) => {
    await page.goto('/tests/fixtures/blank.html');
    const behaviorNames = await page.evaluate(async () => {
      const mod = await import('/src/wb-viewmodels/index.js');
      return Object.keys(mod.behaviorModules);
    });
    const classified = new Set([...AUTO_INFER, ...Object.keys(OPT_IN_BY_DESIGN)]);
    const unclassified = behaviorNames.filter(name => NATIVE_INPUT_TYPES.has(name) && !classified.has(name));
    expect(
      unclassified,
      `Behavior name(s) [${unclassified.join(', ')}] exactly match a native <input> type value ` +
      `but aren't classified in this test / docs/standards/V3-STANDARDS.md's "Type-Implies-` +
      `Behavior Rule" section. Decide which list it belongs in and update both.`
    ).toEqual([]);
  });
});

for (const core of ['/src/core/wb.js', '/src/core/wb-lazy.js']) {
  test.describe(`Type-implies-behavior rule — live DOM (${core})`, () => {
    for (const name of AUTO_INFER) {
      test(`<input type="${name}"> alone (no x-${name}) gets the ${name} behavior`, async ({ page }) => {
        await renderWithWB(page, core, `<input id="probe" type="${name}">`);
        const probe = page.locator('#probe');
        await expect(probe).not.toHaveAttribute('x-' + name);
        const enhanced = await page.evaluate(isEnhanced, name);
        expect(enhanced, `<input type="${name}"> should be auto-enhanced with zero x-${name} attribute`).toBe(true);
      });
    }

    test('type="password" AND explicit x-password together still apply the behavior exactly once (no double-wrap)', async ({ page }) => {
      await renderWithWB(page, core, `<input id="probe" type="password" x-password>`);
      const toggleCount = await page.locator('#probe').evaluate(el =>
        (el.parentElement ? el.parentElement.querySelectorAll('.x-password__toggle').length : 0)
      );
      expect(toggleCount, 'exactly one toggle button — never double-applied').toBe(1);
    });

    for (const [name, cfg] of Object.entries(OPT_IN_BY_DESIGN)) {
      if (!cfg.marker) continue; // image/button: no input[type=] marker to probe, see comment above
      test(`<input type="${name}"> alone (no x-${name}) never gets the richer ${name} enhancement`, async ({ page }) => {
        await renderWithWB(page, core, `<input id="probe" type="${name}">`);
        const hasMarker = await page.locator('#probe').evaluate((el, marker) => el.classList.contains(marker), cfg.marker);
        expect(hasMarker, `<input type="${name}"> should not carry '${cfg.marker}' without explicit x-${name}`).toBe(false);
      });
    }
  });
}

test.describe('wb-* custom elements never need a matching x-attribute on top of the bare tag', () => {
  for (const core of ['/src/core/wb.js', '/src/core/wb-lazy.js']) {
    test(`<div x-cardexpandable> with zero x-* attributes still activates (${core})`, async ({ page }) => {
      await renderWithWB(page, core, `<div x-cardexpandable id="probe" title="Read More" max-height="80px"><p>Body</p></div>`);
      await expect(page.locator('#probe')).toHaveClass(/x-card/, { timeout: 10000 });
    });
  }
});
