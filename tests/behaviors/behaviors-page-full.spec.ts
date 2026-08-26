/**
 * Comprehensive unit tests for the ENTIRE WB Behaviors showcase page.
 * One test per component category so a failure names exactly what is broken.
 *
 * #862 — the page is a BROWSE UI. #666 removed the ten per-category demo
 * sections and their 88 <div x-demo> blocks; every example now lives in
 * data/behavior-examples.json and is rendered on demand into
 * #behaviors-live-example when its row in the browse list is clicked
 * (pages/behaviors.html:173-179). So `#mainPage-behaviors section[id]` is []
 * and `[x-badge]` is 0 on load, and 15 of the 17 tests here were asserting
 * against markup that had been deliberately deleted.
 *
 * The intent survives the move — "every behavior on this page upgrades and
 * renders correctly" is exactly what the live panel now does — so the
 * assertions are unchanged and only the route to the element is rewritten.
 *
 * Base URL is configurable: WB_BASE=https://cielovistasoftware.github.io/wb-starter
 * to run against the live GitHub Pages deploy; defaults to localhost for the
 * local fix→rerun loop (which reflects the latest merged source).
 */
import { test, expect, Page, Locator } from '@playwright/test';

// The browse list renders every behavior x every option axis — ~750 rows —
// and each selection is a fresh WB.scan() over freshly injected markup. Several
// tests here drive four selections in a row. Under `--workers=8` the browsers
// are CPU-starved enough that `newPage` alone can exceed the 30s project
// default, so the timeout is raised here for the same reason and on the same
// precedent as the `integration` project's 60s (playwright.config.ts:301).
test.describe.configure({ timeout: 90_000 });

const BASE = process.env.WB_BASE || '';
const URL = `${BASE.replace(/\/$/, '')}/?page=behaviors`;

async function load(page: Page): Promise<void> {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#mainPage-behaviors #behaviors-search', { timeout: 30000 });
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 0,
    undefined,
    { timeout: 30000 },
  );
}

type Pick = {
  /** data-browse-token on the row, e.g. 'x-badge'. */
  token: string;
  /** Which option axis to select — 'variant', 'size', ... */
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
 * them let assertions read a half-built example — which is what made switches,
 * badges, progress and notifications fail under `--workers=8` while passing in
 * isolation. `ready` is the only signal that comes from the behavior itself.
 *
 * Clearing the panel first means a slow render can never let an assertion read
 * the PREVIOUS selection either — the failure mode that would otherwise bite
 * the variant-comparison tests below, every one of which selects three or four
 * rows in a row.
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
      if (value === 'true') return applied !== null;
      if (value === 'false') return true;
      return applied === value;
    },
    { sel: host, prop: pick.prop || '', value: pick.value || '', proof: ready },
    { timeout: 25000 },
  );

  return page.locator('#behaviors-live-example').locator(host).first();
}

/** Background colour of the host after selecting one variant row. */
async function bgFor(page: Page, pick: Pick): Promise<string> {
  const el = await show(page, pick);
  return el.evaluate((n) => getComputedStyle(n as HTMLElement).backgroundColor);
}

test.describe('Behaviors page — full coverage', () => {
  test.beforeEach(async ({ page }) => load(page));

  test('page structure: the browse workspace is present and populated', async ({ page }) => {
    // #862: the old assertion listed section#buttons … section#utilities — the
    // exact ten sections #666 deleted and #774 replaced with this workspace.
    // It is dropped, not repointed: those sections are not coming back. What
    // the page IS required to have is the search, the authoring-form filter,
    // a populated result list, and the live panel they drive.
    const parts = await page.evaluate(() => ({
      search: !!document.getElementById('behaviors-search'),
      filter: !!document.getElementById('behaviors-form-filter'),
      results: !!document.getElementById('behaviors-search-results'),
      live: !!document.getElementById('behaviors-live'),
      stage: !!document.getElementById('behaviors-live-stage'),
      example: !!document.getElementById('behaviors-live-example'),
      rows: document.querySelectorAll('.behaviors-search-results__row').length,
      tokens: new Set([...document.querySelectorAll('.behaviors-search-results__row')]
        .map((r) => (r as HTMLElement).dataset.browseToken)).size,
    }));
    for (const key of ['search', 'filter', 'results', 'live', 'stage', 'example'] as const) {
      expect((parts as any)[key], `#behaviors-${key} missing from the workspace`).toBe(true);
    }
    expect(parts.rows, 'the browse list rendered no rows').toBeGreaterThan(100);
    expect(parts.tokens, 'the list reaches far too few distinct behaviors').toBeGreaterThan(100);
  });

  test('buttons: variants render distinct backgrounds', async ({ page }) => {
    const colors: string[] = [];
    for (const v of ['primary', 'secondary', 'ghost']) {
      colors.push(await bgFor(page, { token: 'x-button', form: 'semantic', prop: 'variant', value: v, host: 'button.x-button', ready: '[class*="x-button--"]' }));
    }
    expect(new Set(colors).size, `button variants not distinct: ${colors}`).toBeGreaterThanOrEqual(3);
  });

  test('switches: render as toggles and flip on click', async ({ page }) => {
    const sw = await show(page, { token: 'x-switch', prop: 'variant', value: 'primary', ready: '.x-switch__track' });
    expect(await sw.evaluate((el) => el.children.length), '[x-switch] rendered nothing').toBeGreaterThan(0);
    await expect(sw).toHaveAttribute('role', 'switch');
    const before = await sw.getAttribute('aria-checked');
    await sw.locator('.x-switch__track').click();
    await expect(sw, 'clicking the track did not flip the switch').not.toHaveAttribute('aria-checked', before || '');
  });

  test('alerts: 4 variants render distinct backgrounds', async ({ page }) => {
    const colors: string[] = [];
    for (const v of ['info', 'success', 'warning', 'error']) {
      colors.push(await bgFor(page, { token: 'x-alert', prop: 'variant', value: v, ready: '.x-alert__message' }));
    }
    expect(new Set(colors).size, `alert variants not distinct: ${colors.join(', ')}`).toBeGreaterThanOrEqual(4);
  });

  test('badges: variants render distinct backgrounds', async ({ page }) => {
    const colors: string[] = [];
    for (const v of ['primary', 'success', 'error']) {
      colors.push(await bgFor(page, { token: 'x-badge', prop: 'variant', value: v, ready: '.x-badge' }));
    }
    expect(new Set(colors).size, `badge variants not distinct: ${colors.join(', ')}`).toBeGreaterThanOrEqual(3);
  });

  test('progress: bar fill width reflects value', async ({ page }) => {
    // Registered as x-progressbar (src/core/tag-map.js:136), listed as `progress`.
    // The fill selector accepts both class spellings deliberately — see the
    // same test in behaviors-page.spec.ts and #862. The assertion is the RATIO,
    // not the class: value="72" max="100" must paint ~72% of the track, which
    // is what "reflects value" means and stays true whichever module wins.
    const FILL = '.x-progress__bar, .x-progress-bar';
    const p = await show(page, { token: 'x-progressbar', prop: 'variant', value: 'primary', host: '.x-progress', ready: FILL });
    const percentPainted = () => p.evaluate((el, fillSel) => {
      const fill = el.querySelector(fillSel) as HTMLElement;
      if (!fill) return -1;
      const track = (el as HTMLElement).getBoundingClientRect().width;
      return track ? Math.round((fill.getBoundingClientRect().width / track) * 100) : -1;
    }, FILL);
    // Polled, not read once: the fill carries `transition: width 0.3s`
    // (src/wb-viewmodels/progressbar.js:60), so a single measurement taken the
    // instant the bar is appended reads 0 under `--workers=8` while the
    // transition is still running.
    await expect.poll(percentPainted, { timeout: 10000 }).toBeGreaterThan(60);
    const pct = await percentPainted();
    expect(pct, `value="72" painted ${pct}% of the track`).toBeLessThan(85);
  });

  test('notifications: render with content', async ({ page }) => {
    const n = await show(page, { token: 'x-cardnotification', prop: 'variant', value: 'warning', ready: '.x-notification__content' });
    const r = await n.evaluate((el) => ({
      h: Math.round((el as HTMLElement).getBoundingClientRect().height),
      text: (el.textContent || '').trim().length,
    }));
    expect(r.h > 8 && r.text > 0, `notification rendered empty/zero-height: ${JSON.stringify(r)}`).toBe(true);
  });

  test('spinners: visible and animated', async ({ page }) => {
    // #862/#857: for the attribute form the ring is on the HOST —
    // src/styles/site.css:227's `x-spinner div { … }` is a TAG selector and
    // never matches [x-spinner], so the inner <div> is unstyled. Measuring it
    // would assert a src/styles defect, not this page's behaviour.
    const seen: unknown[] = [];
    for (const size of ['sm', 'md', 'lg', 'xl']) {
      const sp = await show(page, { token: 'x-spinner', prop: 'size', value: size, ready: '[class*="x-spinner--"]' });
      seen.push(await sp.evaluate((el) => {
        const cs = getComputedStyle(el as HTMLElement);
        return { bw: parseFloat(cs.borderTopWidth), bs: cs.borderTopStyle, anim: cs.animationName };
      }));
    }
    expect(seen.length).toBe(4);
    expect(
      seen.every((s: any) => s.bw >= 1.5 && s.bs !== 'none' && s.anim === 'x-spin'),
      `spinner invisible/not animated: ${JSON.stringify(seen)}`,
    ).toBe(true);
  });

  test('rating: value painted on first render', async ({ page }) => {
    // #862: the `icon="❤️"` half of this test is DELETED. It selected a demo
    // that #666 removed, and `icon` is a free-text property so the browse list
    // offers no row for it — there is no icon= example left on this page to
    // assert against. Custom-icon coverage lives in rating-icon-value.spec.ts.
    const r = await show(page, { token: 'x-rating', prop: 'size', value: 'md', ready: '.x-rating__star' });
    const stars = await r.evaluate((el) => ({
      total: el.querySelectorAll('.x-rating__star').length,
      full: el.querySelectorAll('.x-rating__star--full').length,
    }));
    expect(stars.total, 'the rating painted no stars').toBeGreaterThan(0);
    expect(stars.full, 'the rating does not show its value on first paint').toBeGreaterThan(0);
  });

  test('dialog: a trigger opens it and it can close', async ({ page }) => {
    // #862: retargeted from x-modal, which has no entry in
    // data/behavior-examples.json. x-dialog does, and pages/behaviors.html:1113
    // emits its TRIGGER form specifically so the example is clickable. The old
    // test only asserted a trigger existed despite its title; now the round
    // trip is actually driven.
    const wrapper = await show(page, { token: 'x-dialog', prop: 'size', value: 'md', host: 'dialog', ready: '[class*="x-dialog"]' });
    const trigger = page.locator('#behaviors-live-example button').first();
    await expect(trigger, 'the dialog example has no discoverable open trigger').toBeVisible();
    expect(await wrapper.evaluate((d) => (d as HTMLDialogElement).open), 'the dialog started open').toBe(false);
    await trigger.click();
    await expect
      .poll(() => wrapper.evaluate((d) => (d as HTMLDialogElement).open), { timeout: 10000 })
      .toBe(true);
    await page.keyboard.press('Escape');
    await expect
      .poll(() => wrapper.evaluate((d) => (d as HTMLDialogElement).open), { timeout: 10000 })
      .toBe(false);
  });

  test('tabs: clicking a tab switches the active panel', async ({ page }) => {
    const t = await show(page, { token: 'x-tabs', prop: 'variant', value: 'underline', ready: '[role="tab"]' });
    const tabs = t.locator('[role="tab"]');
    expect(await tabs.count(), 'tabs rendered fewer than 2 tab buttons').toBeGreaterThanOrEqual(2);
    const before = await t.locator('[aria-selected="true"]').first().textContent();
    await tabs.nth(1).click();
    await expect(
      t.locator('[aria-selected="true"]').first(),
      'clicking a tab did not change the active panel',
    ).not.toHaveText(before || '');
  });

  test('accordion: clicking a header expands/collapses', async ({ page }) => {
    const acc = await show(page, { token: 'x-accordion', ready: '.x-details__summary' });
    const first = acc.locator('details').first();
    expect(await first.evaluate((d) => (d as HTMLDetailsElement).open), 'the accordion started open').toBe(false);
    const hBefore = await first.evaluate((d) => Math.round(d.getBoundingClientRect().height));
    await first.locator('summary').click();
    await expect
      .poll(() => first.evaluate((d) => (d as HTMLDetailsElement).open), { timeout: 10000 })
      .toBe(true);
    const hAfter = await first.evaluate((d) => Math.round(d.getBoundingClientRect().height));
    expect(hAfter, `accordion did not expand on click: ${hBefore} → ${hAfter}`).toBeGreaterThan(hBefore);
  });

  test('avatars: render an image or initials', async ({ page }) => {
    const av = await show(page, { token: 'x-avatar', prop: 'size', value: 'lg', ready: 'img, [class*="x-avatar"]' });
    const r = await av.evaluate((el) => ({
      h: Math.round((el as HTMLElement).getBoundingClientRect().height),
      hasImgOrText: !!el.querySelector('img') || (el.textContent || '').trim().length > 0,
    }));
    expect(r.h > 8 && r.hasImgOrText, `avatar rendered empty: ${JSON.stringify(r)}`).toBe(true);
  });

  test('skeletons: render with shimmer animation', async ({ page }) => {
    const sk = await show(page, { token: 'x-skeleton', prop: 'variant', value: 'text', ready: '[class*="x-skeleton"]' });
    const r = await sk.evaluate((el) => {
      const target = (el.querySelector('*') as HTMLElement) || (el as HTMLElement);
      return {
        h: Math.round((el as HTMLElement).getBoundingClientRect().height),
        anim: getComputedStyle(target).animationName,
      };
    });
    expect(r.h, `skeleton has no height: ${JSON.stringify(r)}`).toBeGreaterThan(4);
    expect(r.anim, `skeleton is not shimmering: ${JSON.stringify(r)}`).not.toBe('none');
  });

  test('code blocks: highlighted like an editor', async ({ page }) => {
    // #862: the old `> 5 blocks, > 5 highlighted` thresholds were sized for the
    // 88 demo blocks #666 removed. The panel renders the HTML sample, the doc
    // body and the event-handler snippet — those are the code blocks this page
    // has now, and they must still be highlighted rather than plain text.
    await show(page, { token: 'x-badge', prop: 'variant', value: 'primary', ready: '.x-badge' });
    const snapshot = () => page.evaluate(() => {
      const isHighlighted = (c: Element | null) =>
        !!c && c.classList.contains('hljs') && !!c.querySelector('[class^="hljs-"]');
      const inPanel = [...document.querySelectorAll('#behaviors-live pre code, #behaviors-live code.language-html')];
      return {
        total: inPanel.length,
        highlighted: inPanel.filter(isHighlighted).length,
        htmlSample: isHighlighted(document.querySelector('#behaviors-live-code code')),
      };
    });
    // showDoc() fetches docs/behaviors/<name>.md and highlights it after the
    // example is already live, so the count settles a beat after `ready`.
    await expect.poll(async () => (await snapshot()).highlighted, { timeout: 20000 }).toBeGreaterThanOrEqual(2);
    const r = await snapshot();
    expect(r.total, 'the live panel rendered no code blocks').toBeGreaterThan(1);
    expect(r.htmlSample, 'the HTML sample is not syntax-highlighted').toBe(true);
  });

  test('no component left in an error state', async ({ page }) => {
    // #862: this passed before only because there was nothing on the page to be
    // in an error state. Drive a spread through the panel first so the sweep
    // has something to be wrong about.
    for (const token of ['x-badge', 'x-alert', 'x-spinner', 'x-tabs', 'x-accordion', 'x-avatar', 'x-switch', 'x-rating', 'x-skeleton', 'x-breadcrumb', 'x-steps', 'x-cardnotification']) {
      await show(page, { token });
    }
    const errs = await page.evaluate(() =>
      [...document.querySelectorAll('#mainPage-behaviors [x-error]')].map((e) => e.tagName.toLowerCase() + ':' + e.getAttribute('x-error'))
    );
    expect(errs, `components in x-error: ${errs.join(', ')}`).toEqual([]);
  });

  test('no "Schema not found" or uncaught errors on load', async ({ page }) => {
    const problems: string[] = [];
    page.on('console', (m) => { if (/Schema not found/i.test(m.text())) problems.push('schema: ' + m.text()); });
    page.on('pageerror', (e) => problems.push('uncaught: ' + String(e)));
    await load(page);
    await show(page, { token: 'x-badge', prop: 'variant', value: 'primary', ready: '.x-badge' });
    expect(problems, `console problems:\n${problems.join('\n')}`).toEqual([]);
  });
});
