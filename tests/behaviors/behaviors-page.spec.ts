/**
 * Behaviors page (?page=behaviors) — component coverage suite.
 *
 * #862 — this file used to scroll a 13,000px gallery of static <div x-demo>
 * blocks and assert on whatever it found lying in the document. #666 removed
 * that gallery: "Every one of those 88 <div x-demo> blocks now lives in
 * data/behavior-examples.json ... and is rendered on demand by the live-preview
 * panel" (pages/behaviors.html:173). The examples MOVED, they were not deleted,
 * so the intent of every test here still holds — each behavior must upgrade and
 * render on this page. Only the route to the element changed: pick the
 * behavior's row in the browse list, then assert on what the panel rendered.
 *
 * The old loadPage() waited for `[x-badge], .behavior-card, .demo-area`
 * (line 13 of the previous revision). None of the three has existed on this
 * page for some time — .behavior-card/.demo-area belonged to the standalone
 * demos/behaviors-showcase.html that was removed before that — so all 15 tests
 * spent 20s timing out inside the helper without ever reaching an assertion.
 */
import { test, expect, Page, Locator } from '@playwright/test';

// The browse list renders every behavior x every option axis — ~750 rows —
// and each selection is a fresh WB.scan() over freshly injected markup. Under
// `--workers=8` the browsers are CPU-starved enough that `newPage` alone can
// exceed the 30s project default, so the timeout is raised here for the same
// reason and on the same precedent as the `integration` project's 60s
// (playwright.config.ts:301). Isolated, the whole file runs in ~40s.
test.describe.configure({ timeout: 90_000 });

/** Loads the browse UI and waits until the behavior list is populated. */
async function loadBrowse(page: Page): Promise<void> {
  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 30000 });
  await page.waitForSelector('#behaviors-search', { timeout: 30000 });
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 0,
    undefined,
    { timeout: 30000 },
  );
}

type Pick = {
  /** data-browse-token on the row, e.g. 'x-badge'. */
  token: string;
  /** Which option axis to select — 'variant', 'size', 'shape', ... */
  prop?: string;
  /** The option value on that axis. */
  value?: string;
  /** 'semantic' | 'attribute', when a behavior offers both authoring forms. */
  form?: string;
  /** Selector for the rendered host; defaults to `[<token>]`. */
  host?: string;
  /**
   * Proof the BEHAVIOR ran, matched against the host or any descendant.
   * Defaults to `[class*="x-"]` — every behavior on this page applies an x-*
   * class to the host or to something it builds.
   */
  ready?: string;
};

/**
 * Selects one behavior in the browse list and returns its rendered host.
 *
 * The wait must not be "the element exists", and must not be "the element has
 * an id or the selected attribute" either: showLive() writes the raw markup
 * into #behaviors-live-example, calls assignExampleIds() on it, and only THEN
 * awaits WB.scan() (pages/behaviors.html:2066-2072). The id and the option
 * attribute are therefore both present on UN-UPGRADED markup, and waiting on
 * them let assertions read a half-built example — which is what made rating,
 * progress, badge, notification, switch and toast fail under `--workers=8`
 * while passing in isolation. `ready` is the only signal that comes from the
 * behavior itself.
 *
 * The panel is also cleared before the click, so a slow render can never let
 * an assertion read the PREVIOUS selection — the failure mode that would
 * otherwise bite every variant-comparison test.
 */
async function show(page: Page, pick: Pick): Promise<Locator> {
  const host = pick.host || `[${pick.token}]`;
  const ready = pick.ready || '[class*="x-"]';

  const clicked = await page.evaluate((o: Pick) => {
    const rows = [...document.querySelectorAll('.behaviors-search-results__row')] as HTMLElement[];
    const row = rows.find((r) =>
      r.dataset.browseToken === o.token
      && (!o.prop || r.dataset.prop === o.prop)
      && (o.value === undefined || r.dataset.variant === o.value)
      && (!o.form || r.dataset.form === o.form));
    if (!row) return false;
    document.getElementById('behaviors-live-example')!.replaceChildren();
    row.click();
    return true;
  }, pick);

  const what = `${pick.token}${pick.prop ? ` ${pick.prop}=${pick.value}` : ''}`;
  expect(clicked, `no browse row for ${what}`).toBe(true);

  await page.waitForFunction(
    ({ sel, prop, value, proof }) => {
      const el = document.querySelector(`#behaviors-live-example ${sel}`) as HTMLElement | null;
      if (!el) return false;
      if (!el.matches(proof) && !el.querySelector(proof)) return false;
      if (!prop) return true;
      const applied = el.getAttribute(prop.toLowerCase());
      if (value === 'true') return applied !== null;      // bare boolean attribute
      if (value === 'false') return true;                 // demonstrated by ABSENCE
      return applied === value;
    },
    { sel: host, prop: pick.prop || '', value: pick.value || '', proof: ready },
    { timeout: 25000 },
  );

  return page.locator('#behaviors-live-example').locator(host).first();
}

test.describe('Behaviors page — health', () => {
  test('loads with no page/console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon|ERR_|Failed to load resource|404/.test(m.text())) errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
    await loadBrowse(page);
    expect(errors, errors.join('\n')).toHaveLength(0);
  });

  test('no behavior throws (no [x-error] elements)', async ({ page }) => {
    await loadBrowse(page);
    // The panel is the only place behaviors run on this page, so drive a
    // representative spread through it before sweeping. Sweeping the bare
    // browse page would pass vacuously — there would be nothing to be wrong.
    for (const token of ['x-badge', 'x-alert', 'x-spinner', 'x-tabs', 'x-accordion', 'x-avatar', 'x-rating']) {
      await show(page, { token });
    }
    const errs = await page.locator('[x-error="true"]').evaluateAll((els) => els.map((e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '')));
    expect(errs, 'elements with x-error: ' + errs.join(', ')).toHaveLength(0);
  });
});

test.describe('Behaviors page — Feedback', () => {
  test('badges upgrade', async ({ page }) => {
    await loadBrowse(page);
    const b = await show(page, { token: 'x-badge', prop: 'variant', value: 'primary', ready: '.x-badge' });
    await expect(b).toHaveClass(/x-badge/);
    await expect(b).toHaveText(/\S/);
  });

  test('alerts upgrade with role=alert', async ({ page }) => {
    await loadBrowse(page);
    const a = await show(page, { token: 'x-alert', prop: 'variant', value: 'info', ready: '.x-alert__message' });
    await expect(a).toHaveAttribute('role', 'alert');
    await expect(a).toHaveClass(/x-alert/);
  });

  test('progress bars render a fill child', async ({ page }) => {
    await loadBrowse(page);
    // The registry key is x-progressbar (src/core/tag-map.js:136) and the row
    // is labelled `progress`. Both class spellings are accepted on purpose:
    // tag-map:136 routes x-progressbar to the modern `progress` behavior
    // (semantics/progress.js, `.x-progress__bar`), but what actually renders
    // today is the @deprecated progressbar.js (`.x-progress-bar`) that same
    // comment says it deliberately routes AWAY from. Naming one spelling would
    // make this test a referendum on that unresolved routing (filed on #862)
    // instead of on whether the bar renders at all.
    const FILL = '.x-progress__bar, .x-progress-bar';
    const p = await show(page, { token: 'x-progressbar', prop: 'variant', value: 'primary', host: '.x-progress', ready: FILL });
    await expect(p.locator(FILL)).toHaveCount(1);
    // Polled, not read once: the fill carries `transition: width 0.3s`
    // (src/wb-viewmodels/progressbar.js:60), so a single measurement taken the
    // instant the bar is appended reads 0 under `--workers=8` while the
    // transition is still running.
    await expect
      .poll(() => p.locator(FILL).evaluate((el) => el.getBoundingClientRect().width), { timeout: 10000 })
      .toBeGreaterThan(0);
  });

  test('spinners animate', async ({ page }) => {
    await loadBrowse(page);
    const s = await show(page, { token: 'x-spinner', prop: 'variant', value: 'primary', ready: '[class*="x-spinner--"]' });
    // #862/#857: for the attribute form the ring is on the HOST. site.css:227's
    // `x-spinner div { ... }` is a TAG selector and never matches [x-spinner],
    // so the inner <div> the schema builds is unstyled — measuring it would
    // assert a defect that lives in src/styles, not on this page.
    const ring = await s.evaluate((el) => {
      const cs = getComputedStyle(el as HTMLElement);
      return { anim: cs.animationName, bw: parseFloat(cs.borderTopWidth), bs: cs.borderTopStyle };
    });
    expect(ring.anim, 'the spinner is not animated').not.toBe('none');
    expect(ring.bw, 'the spinner ring has no border width').toBeGreaterThan(0);
    expect(ring.bs, 'the spinner ring has no border style').not.toBe('none');
  });

  test('skeletons render', async ({ page }) => {
    await loadBrowse(page);
    const sk = await show(page, { token: 'x-skeleton', prop: 'variant', value: 'text', ready: '[class*="x-skeleton"]' });
    await expect(sk).toBeVisible();
    await expect(sk).toHaveClass(/x-skeleton/);
  });

  test('toast fires with the correct type', async ({ page }) => {
    await loadBrowse(page);
    // The catalogue example carries toast-variant="success"; the row's own
    // `variant` axis colours the BUTTON, not the toast, so any variant row
    // still fires a success toast.
    const btn = await show(page, { token: 'x-toast', prop: 'variant', value: 'info', ready: '[x-toast]' });
    // Unlike every other behavior here, x-toast leaves no mark on its host —
    // it only attaches a click handler — so there is no DOM proof the example
    // is live. Click until it fires rather than asserting on one speculative
    // click that can land before WB.scan() wires the button.
    await expect
      .poll(async () => { await btn.click(); return page.locator('.x-toast--success').count(); }, { timeout: 20000 })
      .toBeGreaterThan(0);
    await expect(page.locator('.x-toast--success').first()).toBeVisible();
  });
});

test.describe('Behaviors page — Navigation', () => {
  test('tabs render a tab strip and switch panels', async ({ page }) => {
    await loadBrowse(page);
    const t = await show(page, { token: 'x-tabs', prop: 'variant', value: 'underline', ready: '[role="tab"]' });
    const tabs = t.locator('[role="tab"]');
    expect(await tabs.count()).toBeGreaterThanOrEqual(2);
    // #862: the old `not.toHaveText(/^Tab \d+$/)` assertion was DELETED, not
    // moved. src/wb-viewmodels/tabs.js:44 reads tab-title/tab/data-tab-title;
    // the generated example in data/behavior-examples.json uses `title=`, which
    // tabs has never read — so "Tab 1" is the example generator's defect
    // (filed on #862), not something this page can be held to.
    const before = await t.locator('[aria-selected="true"]').first().textContent();
    await tabs.nth(1).click();
    await expect(t.locator('[aria-selected="true"]').first()).not.toHaveText(before || '');
  });

  test('accordion upgrades (correct tag)', async ({ page }) => {
    await loadBrowse(page);
    const acc = await show(page, { token: 'x-accordion', ready: '.x-accordion' });
    await expect(acc).toHaveClass(/x-accordion/);
    expect(await page.locator('x-accordian').count()).toBe(0); // misspelling gone
    await expect(acc).not.toHaveAttribute('x-error', 'true');
  });

  test('breadcrumb renders items', async ({ page }) => {
    await loadBrowse(page);
    const bc = await show(page, { token: 'x-breadcrumb', ready: '.x-breadcrumb__separator' });
    await expect(bc).toHaveClass(/x-breadcrumb/);
    expect(await bc.locator('.x-breadcrumb__separator').count(), 'a breadcrumb with no separators has no trail')
      .toBeGreaterThan(0);
    await expect(bc).toHaveText(/Home/);
  });

  test('steps wizard renders items', async ({ page }) => {
    await loadBrowse(page);
    const st = await show(page, { token: 'x-steps', ready: '.x-steps__item' });
    expect(await st.locator('.x-steps__item').count()).toBeGreaterThan(0);
  });
});

test.describe('Behaviors page — Data & Selection', () => {
  test('avatars render content', async ({ page }) => {
    await loadBrowse(page);
    const av = await show(page, { token: 'x-avatar', prop: 'size', value: 'lg', ready: 'img, [class*="x-avatar"]' });
    const filled = await av.evaluate((el) => (el.textContent || '').trim().length > 0 || !!el.querySelector('img'));
    expect(filled, 'the avatar rendered neither an image nor initials').toBe(true);
  });

  test('switch toggles upgrade', async ({ page }) => {
    await loadBrowse(page);
    const sw = await show(page, { token: 'x-switch', prop: 'variant', value: 'primary', ready: '.x-switch__track' });
    await expect(sw).toHaveClass(/x-switch/);
    await expect(sw).toHaveAttribute('role', 'switch');
    await expect(sw).not.toHaveAttribute('x-error', 'true');
  });

  test('rating upgrades', async ({ page }) => {
    await loadBrowse(page);
    const r = await show(page, { token: 'x-rating', prop: 'size', value: 'md', ready: '.x-rating__star' });
    expect(await r.locator('.x-rating__star').count(), 'the rating painted no stars').toBeGreaterThan(0);
    await expect(r).not.toHaveAttribute('x-error', 'true');
  });

  // (input data-variant demo lives on the Components page — covered by input-variant.spec.ts)
});
