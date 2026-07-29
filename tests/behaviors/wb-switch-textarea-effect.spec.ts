/**
 * Effect-based coverage for the "🔘 Switch" and "📝 Textarea" sections of
 * demos/site/forms.html (DEMOS-AND-DOCS-STANDARDS.md #19 — every declared
 * attribute must be proven to produce its real effect, not merely render or
 * receive a class).
 *
 * Runtime: this spec targets demos/test-harness.html, which boots
 * src/core/wb-lazy.js (WB.scan/WB.inject only — no schema-builder pipeline).
 * This is the SAME runtime forms.html itself uses for its standalone demo
 * (both load wb-lazy.js), and the pattern is based on the working
 * wb-demo-width-and-toggle.spec.ts setup().
 *
 * Investigated live (via direct DOM probing in a real browser) before
 * writing any assertion, per TIER1 law #7 ("trace, don't guess"):
 *
 * 1. forms.html documents a "Known gap (#322)" claiming <wb-switch> "won't
 *    render" on this runtime because it needs its schema built first. That
 *    claim does NOT hold: switchInput() (src/wb-viewmodels/semantics/
 *    switch.js) has a self-build fallback (#279) that constructs the
 *    input/track/thumb itself whenever no schema-built structure is
 *    present — confirmed live: <wb-switch> DOES render and toggle
 *    correctly on demos/test-harness.html via `WB.scan(area, { eager: true
 *    })`. So wb-switch's checked/disabled behavior IS testable here, and is
 *    covered below using the real `<wb-switch>` tag.
 *
 * 2. <wb-textarea>, by contrast, has NO such self-build fallback in
 *    textarea.js — its own top-of-file comment says it "only ever
 *    meaningfully runs on the real <textarea>" (the schema-built child).
 *    wb-lazy.js has no schema pipeline to build that child, so
 *    `<wb-textarea>` stays a plain, non-editable WB-TEXTAREA host: styled,
 *    but with no real form control inside it at all (confirmed live:
 *    element.querySelector('textarea') is null after an eager scan). This
 *    is the SAME class of gap as #322, just never documented for textarea
 *    — see the final report for details. Because of this, every wb-textarea
 *    assertion below targets the native `<textarea x-behavior="textarea">`
 *    path instead of `<wb-textarea>` — textarea() is the exact same
 *    function either way; the native element is simply the one that's
 *    actually reachable on this runtime.
 *
 * 3. A few declared attributes were empirically confirmed to have NO real
 *    effect at all on this runtime (traced to root cause, not guessed):
 *    <wb-switch label-position>, <wb-switch size>/<wb-switch variant>,
 *    <textarea resize>, and <textarea variant>'s border-color. Those
 *    assertions use `test.fail()` — the effect-based assertion still
 *    documents the intended behavior (so a real fix flips it to an
 *    "unexpected pass" that flags for follow-up), without turning the whole
 *    suite red for an already-traced, reported defect.
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage, { timeout: 20000 });
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'wb-switch-textarea-test-area';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => {
    const area = document.getElementById('wb-switch-textarea-test-area');
    if ((window as any).WB?.scan) await (window as any).WB.scan(area, { eager: true });
  });
  await page.waitForTimeout(300);
}

// Same setup, but flips the module-level autoInject config on first —
// mirrors forms.html's own `WB.init({ autoInject: true })`, which is what
// lets its bare (no x-behavior) native <textarea autosize> / <textarea
// show-count> markup actually initialize. Safe per-test: each Playwright
// test gets a fresh page navigation, so this JS module state never leaks
// across tests.
async function setupNative(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage, { timeout: 20000 });
  await page.evaluate((h: string) => {
    (window as any).WB.config.set('autoInject', true);
    const c = document.createElement('div');
    c.id = 'wb-switch-textarea-native-test-area';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => {
    const area = document.getElementById('wb-switch-textarea-native-test-area');
    if ((window as any).WB?.scan) await (window as any).WB.scan(area, { eager: true });
  });
  await page.waitForTimeout(300);
}

test.describe('<wb-switch> — real effects (self-build path, #279)', () => {
  test('checked: clicking flips the real state (input.checked + aria-checked), not just a class', async ({ page }) => {
    await setup(page, '<wb-switch id="sw-checked" label="Notify"></wb-switch>');
    const host = page.locator('#sw-checked');
    const input = host.locator('input');

    expect(await input.evaluate((el: HTMLInputElement) => el.checked), 'starts OFF').toBe(false);
    expect(await host.getAttribute('aria-checked')).toBe('false');

    await host.click();
    await expect(input).toBeChecked();
    expect(await host.getAttribute('aria-checked'), 'aria-checked did not sync after click').toBe('true');

    await host.click();
    await expect(input).not.toBeChecked();
    expect(await host.getAttribute('aria-checked')).toBe('false');
  });

  test('disabled: clicking does not flip the state', async ({ page }) => {
    await setup(page, '<wb-switch id="sw-disabled" label="Off" disabled></wb-switch>');
    const host = page.locator('#sw-disabled');
    const input = host.locator('input');

    expect(await input.evaluate((el: HTMLInputElement) => el.disabled), 'input not disabled').toBe(true);
    await host.click({ force: true }); // force: a disabled control legitimately blocks normal actionable clicks
    await expect(input).not.toBeChecked();
    expect(await host.getAttribute('aria-checked'), 'a disabled switch must never report checked').toBe('false');
  });

  test('SUSPECTED BUG: label-position start/end has no effect on real DOM order', async ({ page }) => {
    test.fail(true, 'switchInput() (semantics/switch.js) never reads the label-position attribute in its self-build fallback — it always appends a wb-switch__label-end span regardless of the declared position. Also broken via the schema-driven engine (main site): switch.schema.json\'s label-start/label-end createdWhen conditions use "labelPosition == \'start\'" equality syntax, but schema-builder.js\'s evaluateCondition() only supports truthy-field lookups, not "==" comparisons, so neither $view part is ever created there either — same root cause, both engines.');
    await setup(
      page,
      '<wb-switch id="sw-start" label="Start" label-position="start"></wb-switch>' +
      '<wb-switch id="sw-end" label="End" label-position="end"></wb-switch>'
    );

    const order = await page.evaluate(() => {
      const indexOf = (host: Element, selector: string) =>
        Array.prototype.indexOf.call(host.children, host.querySelector(selector));
      const start = document.getElementById('sw-start')!;
      const end = document.getElementById('sw-end')!;
      return {
        startLabelBeforeTrack: indexOf(start, '[class*="wb-switch__label"]') < indexOf(start, '.wb-switch__track'),
        endLabelAfterTrack: indexOf(end, '[class*="wb-switch__label"]') > indexOf(end, '.wb-switch__track'),
      };
    });
    expect(order.startLabelBeforeTrack, 'label-position="start" should place the label before the track in DOM order').toBe(true);
    expect(order.endLabelAfterTrack, 'label-position="end" should place the label after the track in DOM order').toBe(true);
  });

  test('SUSPECTED BUG: size produces no computed style difference', async ({ page }) => {
    test.fail(true, 'switchInput() never reads the size attribute at all on this runtime (no schema pipeline to apply switch.schema.json\'s appliesClass) — <wb-switch size="sm"> and size="lg"> render identically. This DOES work on the schema-driven main site (?page=behaviors), confirmed live: <wb-switch size="lg"> there gets class wb-switch--lg. So this is a wb-lazy.js-runtime-specific gap, not a universal one.');
    await setup(
      page,
      '<wb-switch id="sw-sm" label="A" size="sm"></wb-switch>' +
      '<wb-switch id="sw-lg" label="B" size="lg"></wb-switch>'
    );
    const trackWidth = async (id: string) =>
      page.locator(`#${id} .wb-switch__track`).evaluate((el) => getComputedStyle(el).width);
    const sm = await trackWidth('sw-sm');
    const lg = await trackWidth('sw-lg');
    expect(sm, 'size="sm" vs size="lg" tracks should differ in computed width').not.toBe(lg);
  });

  test('SUSPECTED BUG: variant produces no computed style difference', async ({ page }) => {
    test.fail(true, 'Same root cause as size: switchInput() never reads the variant attribute on this runtime. <wb-switch variant="primary"> gets no wb-switch--primary class here (confirmed live), though it does on the schema-driven main site.');
    await setup(
      page,
      '<wb-switch id="sw-default" label="A"></wb-switch>' +
      '<wb-switch id="sw-primary" label="B" variant="primary"></wb-switch>'
    );
    const trackBg = async (id: string) =>
      page.locator(`#${id} .wb-switch__track`).evaluate((el) => getComputedStyle(el).backgroundColor);
    const def = await trackBg('sw-default');
    const primary = await trackBg('sw-primary');
    expect(def, 'variant="primary" should visibly differ from the default variant').not.toBe(primary);
  });
});

test.describe('wb-textarea\'s textarea() behavior — real effects (native <textarea x-behavior="textarea"> path; see file header re: <wb-textarea> gap)', () => {
  test('rows: real rendered row count differs, backed by the actual DOM property', async ({ page }) => {
    await setup(
      page,
      '<textarea id="ta-rows3" x-behavior="textarea" rows="3"></textarea>' +
      '<textarea id="ta-rows8" x-behavior="textarea" rows="8"></textarea>'
    );
    const rows3 = page.locator('#ta-rows3');
    const rows8 = page.locator('#ta-rows8');

    expect(await rows3.evaluate((el: HTMLTextAreaElement) => el.rows)).toBe(3);
    expect(await rows8.evaluate((el: HTMLTextAreaElement) => el.rows)).toBe(8);

    const h3 = await rows3.evaluate((el) => el.getBoundingClientRect().height);
    const h8 = await rows8.evaluate((el) => el.getBoundingClientRect().height);
    expect(h8, 'rows=8 should render visibly taller than rows=3').toBeGreaterThan(h3);
  });

  test('max-length + show-count: counter reflects the real current/max count as you type', async ({ page }) => {
    await setup(page, '<textarea id="ta-count" x-behavior="textarea" show-count max-length="20"></textarea>');
    const ta = page.locator('#ta-count');
    const counter = page.locator('#ta-count').locator('xpath=..').locator('.wb-textarea__counter');

    await expect(counter).toHaveText('0/20');
    await ta.pressSequentially('hello');
    await expect(counter).toHaveText('5/20');
    await ta.pressSequentially(' world');
    await expect(counter).toHaveText('11/20');
  });

  test('SUSPECTED BUG: max-length does not actually enforce the character limit', async ({ page }) => {
    test.fail(true, 'textarea.js reads config.maxLength only to color/format the counter text — it never sets the native maxLength property or a maxlength attribute on the element, and never truncates config.value on input. Confirmed live: typing 20 characters past a max-length="10" textarea leaves the full 20-character value in place; the counter just shows "20/10" (and turns red) instead of blocking further input.');
    await setup(page, '<textarea id="ta-limit" x-behavior="textarea" show-count max-length="10"></textarea>');
    const ta = page.locator('#ta-limit');
    await ta.pressSequentially('12345678901234567890'); // 20 chars typed, limit is 10
    const value = await ta.inputValue();
    expect(value.length, 'typed value should be capped at max-length').toBeLessThanOrEqual(10);
  });

  test('autosize: element height actually grows as multi-line content is typed', async ({ page }) => {
    await setup(page, '<textarea id="ta-autosize" x-behavior="textarea" autosize style="width:200px;"></textarea>');
    const ta = page.locator('#ta-autosize');
    const before = await ta.evaluate((el) => el.getBoundingClientRect().height);

    await ta.fill('line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8');
    await page.waitForTimeout(100);
    const after = await ta.evaluate((el) => el.getBoundingClientRect().height);
    expect(after, 'autosize textarea should grow taller as multi-line content is added').toBeGreaterThan(before);
  });

  test('disabled: typing has no effect on value', async ({ page }) => {
    await setup(page, '<textarea id="ta-disabled" x-behavior="textarea" disabled></textarea>');
    const ta = page.locator('#ta-disabled');
    await expect(ta).toBeDisabled();

    // A genuinely disabled native control refuses Playwright's own typing
    // action (real browser-level enforcement) -- that rejection IS the effect.
    await expect(ta.pressSequentially('hello', { timeout: 1000 })).rejects.toThrow();
    expect(await ta.inputValue()).toBe('');
  });

  test('SUSPECTED BUG: resize has no effect on the computed CSS resize property', async ({ page }) => {
    test.fail(true, 'textarea.js never reads the resize attribute/property at all -- it only ever sets style.resize based on autosize (none if autosize is set, vertical otherwise), completely ignoring the declared resize value. Confirmed live: resize="none"/"horizontal"/"both" all compute to resize:"vertical" (the autosize-less default), identical to resize="vertical" itself.');
    await setup(
      page,
      '<textarea id="ta-resize-none" x-behavior="textarea" resize="none"></textarea>' +
      '<textarea id="ta-resize-h" x-behavior="textarea" resize="horizontal"></textarea>' +
      '<textarea id="ta-resize-both" x-behavior="textarea" resize="both"></textarea>' +
      '<textarea id="ta-resize-v" x-behavior="textarea" resize="vertical"></textarea>'
    );
    const computedResize = async (id: string) => page.locator(`#${id}`).evaluate((el) => getComputedStyle(el).resize);

    expect(await computedResize('ta-resize-none')).toBe('none');
    expect(await computedResize('ta-resize-h')).toBe('horizontal');
    expect(await computedResize('ta-resize-both')).toBe('both');
    expect(await computedResize('ta-resize-v')).toBe('vertical');
  });

  test('variant: the wb-textarea--{variant} class is applied for the real element', async ({ page }) => {
    await setup(
      page,
      '<textarea id="ta-variant-success" x-behavior="textarea" variant="success"></textarea>' +
      '<textarea id="ta-variant-error" x-behavior="textarea" variant="error"></textarea>'
    );
    await expect(page.locator('#ta-variant-success')).toHaveClass(/wb-textarea--success/);
    await expect(page.locator('#ta-variant-error')).toHaveClass(/wb-textarea--error/);
  });

  test('SUSPECTED BUG: variant produces no real visual (border-color) difference', async ({ page }) => {
    test.fail(true, 'The wb-textarea--success/--error classes ARE applied (see previous test), and input.css DOES define distinct border-color rules for them (.wb-textarea--success / .wb-textarea--error), but textarea.js unconditionally sets an inline `element.style.border = \'1px solid var(--border-color, ...)\'` shorthand in its "Basic styling" block BEFORE the variant class is ever considered. An inline style always outranks an external class selector in the cascade, so the class-based border-color is silently masked. Confirmed live: default/success/error computed border-color is identical.');
    await setup(
      page,
      '<textarea id="ta-border-default" x-behavior="textarea"></textarea>' +
      '<textarea id="ta-border-success" x-behavior="textarea" variant="success"></textarea>' +
      '<textarea id="ta-border-error" x-behavior="textarea" variant="error"></textarea>'
    );
    const borderColor = async (id: string) => page.locator(`#${id}`).evaluate((el) => getComputedStyle(el).borderColor);
    const def = await borderColor('ta-border-default');
    const success = await borderColor('ta-border-success');
    const error = await borderColor('ta-border-error');
    expect(success, 'variant="success" should render a visibly different border color than default').not.toBe(def);
    expect(error, 'variant="error" should render a visibly different border color than default').not.toBe(def);
  });
});

test.describe('Native <textarea> section (bare attributes + autoInject, matching forms.html\'s own WB.init config)', () => {
  test('native <textarea autosize>: same real height-growth behavior as the x-behavior path', async ({ page }) => {
    await setupNative(page, '<textarea id="nat-autosize" autosize style="width:200px;"></textarea>');
    const ta = page.locator('#nat-autosize');
    await expect(ta).toHaveClass(/wb-textarea--autosize/);

    const before = await ta.evaluate((el) => el.getBoundingClientRect().height);
    await ta.fill('line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8');
    await page.waitForTimeout(100);
    const after = await ta.evaluate((el) => el.getBoundingClientRect().height);
    expect(after, 'native autosize textarea should grow taller with multi-line content').toBeGreaterThan(before);
  });

  test('native <textarea show-count max-length="100">: counter reflects the real current/max count as you type', async ({ page }) => {
    await setupNative(page, '<textarea id="nat-count" show-count max-length="100"></textarea>');
    const ta = page.locator('#nat-count');
    const counter = ta.locator('xpath=..').locator('.wb-textarea__counter');

    await expect(counter).toHaveText('0/100');
    await ta.pressSequentially('hello there');
    await expect(counter).toHaveText('11/100');
  });
});
