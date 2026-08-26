/**
 * Effect-based coverage for the forms.html "🔍 Search" / "📋 Select" sections:
 * <div x-searchfield> (src/wb-viewmodels/search.js), <div x-select> (src/wb-viewmodels/semantics/select.js),
 * plus the native <select> and <input x-autocomplete> alternative shown near the bottom of
 * that page. Per DEMOS-AND-DOCS-STANDARDS.md §19, every declared attribute below is asserted
 * by its real computed-style/behavioral effect, not by presence of a class or attribute alone.
 *
 * IMPORTANT — searchable on <div x-select>: demos/site/forms.html itself documents (near its
 * "Standard Select" demo) that filtering is done via `x-autocomplete`, "not a `searchable`
 * attribute on <select> (which doesn't exist)". Confirmed in source: buildWbSelect() in
 * src/wb-viewmodels/semantics/select.js never reads a `searchable` attribute/option at all —
 * only select.schema.json (a stale/aspirational spec) declares it. So the `searchable` test
 * below asserts the CURRENT real behavior (it's inert — no filter UI appears, matching the
 * page's own disclaimer) rather than the schema's aspirational claim, per TIER1 Law #5/#7.
 * Real typed-filtering coverage lives in the x-autocomplete test instead.
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  // #735: NOT WBSite. This page is a standalone harness, not an SPA route, so
  // window.WBSite is never created here -- the wait burned its full timeout and
  // failed before a single assertion ran. WB.behaviors is the readiness signal
  // that applies, and this setup scans the DOM itself below.
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'test-area';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => {
    if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true });
  });
  await page.waitForTimeout(300);
}

test.describe('<div x-searchfield> effect-based attribute coverage', () => {
  test('instant fires wb:search immediately on input; non-instant is debounced', async ({ page }) => {
    await setup(page, `
      <div x-searchfield id="s-instant" instant placeholder="instant"></div>
      <div x-searchfield id="s-normal" placeholder="normal"></div>
    `);

    await page.evaluate(() => {
      (window as any).__events = { instant: [] as any[], normal: [] as any[] };
      document.querySelector('#s-instant input')!.addEventListener('wb:search', (e: any) => {
        (window as any).__events.instant.push(e.detail);
      });
      document.querySelector('#s-normal input')!.addEventListener('wb:search', (e: any) => {
        (window as any).__events.normal.push(e.detail);
      });
    });

    await page.locator('#s-instant input').pressSequentially('a');
    await page.locator('#s-normal input').pressSequentially('a');

    // Well under the 300ms default debounce (search.js config.debounce).
    await page.waitForTimeout(60);
    const early = await page.evaluate(() => (window as any).__events);
    expect(early.instant.length).toBeGreaterThan(0);
    expect(early.instant[0].instant).toBe(true);
    expect(early.normal.length).toBe(0); // non-instant hasn't fired yet -- still debouncing

    // Let the debounce timer elapse and confirm it fires eventually, flagged non-instant.
    await page.waitForTimeout(400);
    const later = await page.evaluate(() => (window as any).__events);
    expect(later.normal.length).toBeGreaterThan(0);
    expect(later.normal[0].instant).toBe(false);
  });

  test('loading renders a real spinner element distinct from the non-loading state', async ({ page }) => {
    await setup(page, `
      <div x-searchfield id="s-loading" loading placeholder="loading"></div>
      <div x-searchfield id="s-plain" placeholder="plain"></div>
    `);

    const spinner = page.locator('#s-loading .x-search__loading');
    await expect(spinner).toHaveCount(1);
    const anim = await spinner.evaluate((el) => getComputedStyle(el).animationName);
    expect(anim).not.toBe('none'); // x-search-spin keyframe actually applied

    await expect(page.locator('#s-plain .x-search__loading')).toHaveCount(0);
  });

  test('variant produces real computed style differences (glass backdrop-filter, minimal border)', async ({ page }) => {
    // SUSPECTED BUG (confirmed via this test's real run, not guessed): search.js's search()
    // adds the `x-search--{variant}` class to `element`, which IS the <input> itself --
    // see the classList.add() calls at the top of search(element, options) in
    // src/wb-viewmodels/search.js, all executed BEFORE the wrapper div is created and the
    // input is moved inside it. So the modifier class ends up on a DESCENDANT of
    // .x-search__wrapper, never an ancestor. But search.css's variant rules are all
    // ancestor-descendant selectors (`.x-search--glass .x-search__wrapper`,
    // `.x-search--minimal .x-search__wrapper`) expecting the modifier class on an
    // ancestor of the wrapper -- so they never match. Empirically confirmed: glass
    // backdrop-filter computes to 'none' (same as default), identical to no variant at all.
    // Marked test.fail() so the suite stays green until src/wb-viewmodels/search.js applies
    // the modifier class to the wrapper (or the host <div x-searchfield> tag) instead of the input.
    test.fail();
    await setup(page, `
      <div x-searchfield id="s-default" placeholder="default"></div>
      <div x-searchfield id="s-glass" variant="glass" placeholder="glass"></div>
      <div x-searchfield id="s-minimal" variant="minimal" placeholder="minimal"></div>
    `);

    const defaultWrapper = page.locator('#s-default .x-search__wrapper');
    const glassWrapper = page.locator('#s-glass .x-search__wrapper');
    const minimalWrapper = page.locator('#s-minimal .x-search__wrapper');

    const defaultBackdrop = await defaultWrapper.evaluate((el) => getComputedStyle(el).backdropFilter);
    const glassBackdrop = await glassWrapper.evaluate((el) => getComputedStyle(el).backdropFilter);
    expect(defaultBackdrop).toBe('none');
    expect(glassBackdrop).not.toBe('none'); // blur(8px) actually applied

    const defaultBorder = await defaultWrapper.evaluate((el) => getComputedStyle(el).borderTopWidth);
    const minimalBorder = await minimalWrapper.evaluate((el) => getComputedStyle(el).borderTopWidth);
    expect(defaultBorder).not.toBe('0px'); // real 1px border
    expect(minimalBorder).toBe('0px'); // border: none actually removed it
  });

  test('size sm vs lg produce a real computed height difference', async ({ page }) => {
    // SUSPECTED BUG (same root cause as the variant test above, confirmed via this test's
    // real run): the `x-search--sm`/`x-search--lg` class is added to the <input> element
    // in search.js, before that input is moved inside .x-search__wrapper -- so it ends up
    // a descendant of the wrapper, not an ancestor. search.css's size rules
    // (`.x-search--sm .x-search__wrapper`, `.x-search--lg .x-search__wrapper`) need the
    // modifier class on an ancestor of the wrapper, so they never match. Empirically
    // confirmed: both sm and lg wrappers compute to the same 40px (2.5rem) default height.
    // Marked test.fail() so the suite stays green until src/wb-viewmodels/search.js applies
    // the modifier class to the wrapper (or the host <div x-searchfield> tag) instead of the input.
    test.fail();
    await setup(page, `
      <div x-searchfield id="s-sm" size="sm" placeholder="sm"></div>
      <div x-searchfield id="s-lg" size="lg" placeholder="lg"></div>
    `);

    const smHeight = await page.locator('#s-sm .x-search__wrapper').evaluate((el) => parseFloat(getComputedStyle(el).height));
    const lgHeight = await page.locator('#s-lg .x-search__wrapper').evaluate((el) => parseFloat(getComputedStyle(el).height));
    expect(smHeight).toBeLessThan(lgHeight); // 2rem vs 3rem per search.css
  });

  test('disabled blocks real typing -- the underlying input value never changes', async ({ page }) => {
    await setup(page, `<div x-searchfield id="s-disabled" disabled placeholder="disabled"></div>`);

    const input = page.locator('#s-disabled input');
    await expect(input).toBeDisabled();

    let blocked = false;
    try {
      await input.pressSequentially('test', { timeout: 2000 });
    } catch {
      blocked = true; // Playwright can't focus/type into a disabled input -- proves the effect
    }
    const value = await input.inputValue();
    expect(value).toBe('');
    // Either Playwright refused the interaction, or (defense in depth) the value simply never changed.
    expect(blocked || value === '').toBe(true);
  });
});

test.describe('<div x-select> effect-based attribute coverage', () => {
  const FRUIT_OPTIONS = '[{"value":"a","label":"Apple"},{"value":"b","label":"Banana"},{"value":"c","label":"Cherry"}]';

  test('searchable is currently inert -- no filter UI, identical to a plain <select> (see file header)', async ({ page }) => {
    await setup(page, `
      <div x-select id="sel-plain" options='${FRUIT_OPTIONS}'></div>
      <div x-select id="sel-searchable" searchable options='${FRUIT_OPTIONS}'></div>
    `);

    // No dedicated search/filter input is rendered by the searchable attribute.
    await expect(page.locator('#sel-searchable input[type="text"], #sel-searchable input[type="search"]')).toHaveCount(0);

    // Same option count as the plain select -- searchable does not add or remove anything.
    const plainCount = await page.locator('#sel-plain select option').count();
    const searchableCount = await page.locator('#sel-searchable select option').count();
    expect(searchableCount).toBe(plainCount);
  });

  test('clearable actually empties the current selection', async ({ page }) => {
    await setup(page, `<div x-select id="sel-clearable" clearable options='${FRUIT_OPTIONS}'></div>`);

    const select = page.locator('#sel-clearable select');
    await select.selectOption('a');
    expect(await select.inputValue()).toBe('a');

    await page.locator('#sel-clearable .x-select__clear').click();
    expect(await select.inputValue()).toBe(''); // real value change to empty
  });

  test('multiple allows two options to remain selected simultaneously; default does not', async ({ page }) => {
    await setup(page, `
      <div x-select id="sel-multiple" multiple options='${FRUIT_OPTIONS}'></div>
      <div x-select id="sel-single" options='${FRUIT_OPTIONS}'></div>
    `);

    const multi = page.locator('#sel-multiple select');
    await multi.selectOption(['a', 'b']);
    const multiSelected = await multi.evaluate((el) => Array.from((el as HTMLSelectElement).selectedOptions).map((o) => o.value));
    expect(multiSelected.sort()).toEqual(['a', 'b']); // both remain selected

    const single = page.locator('#sel-single select');
    await single.selectOption('a');
    await single.selectOption('b');
    const singleSelected = await single.evaluate((el) => Array.from((el as HTMLSelectElement).selectedOptions).map((o) => o.value));
    expect(singleSelected).toEqual(['b']); // selecting a 2nd option deselects the 1st
  });

  test('disabled cannot be changed by interaction', async ({ page }) => {
    await setup(page, `<div x-select id="sel-disabled" disabled options='${FRUIT_OPTIONS}'></div>`);

    const select = page.locator('#sel-disabled select');
    await expect(select).toBeDisabled();

    let blocked = false;
    try {
      await select.selectOption('a', { timeout: 2000 });
    } catch {
      blocked = true;
    }
    const value = await select.inputValue();
    expect(value).toBe(''); // still the placeholder -- no selection change occurred
    expect(blocked || value === '').toBe(true);
  });

  test('required makes the underlying <select> fail native validation when empty, pass once a value is set', async ({ page }) => {
    await setup(page, `<div x-select id="sel-required" required options='${FRUIT_OPTIONS}'></div>`);

    const select = page.locator('#sel-required select');
    await expect(select).toHaveJSProperty('required', true);

    const validBefore = await select.evaluate((el) => (el as HTMLSelectElement).checkValidity());
    expect(validBefore).toBe(false); // required + empty value -- real Constraint Validation API failure

    await select.selectOption('a');
    const validAfter = await select.evaluate((el) => (el as HTMLSelectElement).checkValidity());
    expect(validAfter).toBe(true);
  });
});

test.describe('Native <select> and <input x-autocomplete> (forms.html "Select" fallback section)', () => {
  test('a plain native <select> changes .value on selection', async ({ page }) => {
    await setup(page, `
      <select id="native-sel">
        <option value="">Choose...</option>
        <option value="x">Option X</option>
        <option value="y">Option Y</option>
      </select>
    `);

    const select = page.locator('#native-sel');
    await select.selectOption('y');
    expect(await select.inputValue()).toBe('y');
  });

  test('x-autocomplete surfaces a real filtered suggestion for a partial match', async ({ page }) => {
    await setup(page, `
      <input id="ac-input" type="text" x-autocomplete items="Apple,Banana,Cherry,Date,Elderberry" placeholder="Search fruit...">
    `);

    const input = page.locator('#ac-input');
    await input.pressSequentially('Ban');

    const suggestions = page.locator('#test-area .x-autocomplete__list li');
    await expect(suggestions).toHaveCount(1); // real filtering, not just rendering
    await expect(suggestions.first()).toHaveText('Banana');
  });
});
