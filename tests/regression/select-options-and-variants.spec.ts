import { test, expect, type Page } from '@playwright/test';

/**
 * #681 — <select> must honour its schema and render real options.
 *
 * John: "we need better samples of the select/option examples ... I didn't see
 * any colors".
 *
 * Two defects, both proven by measurement rather than by class name:
 *
 *   1. select.js early-returns for a native <select>, handling only
 *      `clearable`. `variant` and `size` are declared in select.schema.json and
 *      were read ONLY by buildWbSelect(), which a native <select> never
 *      reaches — so `<select variant="error">` came out with className === "".
 *   2. The showcase emitted `<select>Example select content</select>`. Bare
 *      text in a <select> is not selectable, so the control rendered empty at
 *      21x17 px with nothing to pick.
 *
 * Colour assertions compare COMPUTED values between variants. A test that
 * asserted the class name would have passed throughout the entire bug — that
 * was the #671 lesson and it applies here unchanged.
 */

const FIXTURE = '/tests/fixtures/blank.html';

async function render(page: Page, markup: string) {
  await page.goto(FIXTURE, { waitUntil: 'domcontentloaded' });

  // The blank fixture ships no theme, so every var(--danger-color) would be
  // undefined and compute to black — see form-variants-and-striping.spec.ts.
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/styles/themes.css';
    link.addEventListener('load', () => resolve(), { once: true });
    link.addEventListener('error', () => reject(new Error('themes.css failed to load')), { once: true });
    document.head.appendChild(link);
  }));

  await page.evaluate(async (html) => {
    const host = document.createElement('div');
    host.id = 'harness';
    host.style.cssText = 'width: 720px;';
    document.body.appendChild(host);
    host.innerHTML = html;
    const mod: any = await import('/src/core/wb-lazy.js');
    const WB = mod.default || mod.WB;
    await WB.scan(host, { eager: true });
  }, markup);

  await page.waitForFunction(() => {
    const link = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .find((l) => (l as HTMLLinkElement).href.includes('input.css')) as HTMLLinkElement | undefined;
    return !!link && !!link.sheet;
  }, undefined, { timeout: 10000 });

  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));

  const themed = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--danger-color').trim()
  );
  expect(themed, 'the theme must be live before any colour is asserted').not.toBe('');
}

const border = (page: Page, sel: string) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    return el ? getComputedStyle(el).borderColor : null;
  }, sel);

const OPTIONS = '<option value="alpha">Alpha</option><option value="beta">Beta</option>';

test.describe('select: variants are visible on a native <select> (#681)', () => {
  test('error and success each differ from plain and from each other', async ({ page }) => {
    await render(page, `
      <select id="e" variant="error">${OPTIONS}</select>
      <select id="s" variant="success">${OPTIONS}</select>
      <select id="p">${OPTIONS}</select>
    `);

    const [e, s, p] = await Promise.all([border(page, '#e'), border(page, '#s'), border(page, '#p')]);
    expect(e, 'error must not look like plain').not.toBe(p);
    expect(s, 'success must not look like plain').not.toBe(p);
    expect(e, 'error and success must differ').not.toBe(s);
  });

  test('the variant class actually reaches the element', async ({ page }) => {
    // The direct root cause: className was empty, so no rule could ever match.
    await render(page, `<select id="e" variant="error">${OPTIONS}</select>`);
    const cls = await page.evaluate(() => document.querySelector('#e')!.className);
    expect(cls, 'a native <select> must receive its variant class').toContain('wb-select--error');
  });

  test('size tokens apply, but a numeric size keeps its native meaning', async ({ page }) => {
    await render(page, `
      <select id="lg" size="lg">${OPTIONS}</select>
      <select id="rows" size="4">${OPTIONS}</select>
    `);

    const lg = await page.evaluate(() => document.querySelector('#lg')!.className);
    expect(lg, 'a token size is a style modifier').toContain('wb-select--lg');

    // size="4" is real HTML meaning "show 4 rows" — turning it into a class
    // would both lose that and invent a .wb-select--4 rule that does not exist.
    const rows = await page.evaluate(() => {
      const el = document.querySelector('#rows') as HTMLSelectElement;
      return { cls: el.className, size: el.size };
    });
    expect(rows.cls, 'a numeric size must not become a style class').not.toContain('wb-select--4');
    expect(rows.size, 'and must keep its native row-count meaning').toBe(4);
  });
});

test.describe('select: options render and are selectable (#681)', () => {
  test('a select with options is usable, and one with bare text is not', async ({ page }) => {
    await render(page, `
      <select id="good">${OPTIONS}</select>
      <select id="bad">Example select content</select>
    `);

    const good = await page.evaluate(() => {
      const el = document.querySelector('#good') as HTMLSelectElement;
      const r = el.getBoundingClientRect();
      return { options: el.options.length, w: Math.round(r.width), h: Math.round(r.height) };
    });
    expect(good.options, 'authored <option> children must survive').toBe(2);
    expect(good.w, 'and the control must have real width').toBeGreaterThan(0);
    expect(good.h, 'and real height').toBeGreaterThan(0);

    // Pinning the defect the showcase used to emit, so nobody reintroduces it.
    const bad = await page.evaluate(() =>
      (document.querySelector('#bad') as HTMLSelectElement).options.length
    );
    expect(bad, 'bare text in a <select> yields nothing selectable — this is why the sample was empty').toBe(0);
  });

  test('selecting an option changes the value and fires change', async ({ page }) => {
    await render(page, `<select id="s">${OPTIONS}</select>`);

    const fired = await page.evaluate(async () => {
      const el = document.querySelector('#s') as HTMLSelectElement;
      let count = 0;
      el.addEventListener('change', () => { count++; });
      el.value = 'beta';
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return { value: el.value, count };
    });
    expect(fired.value, 'the second option should be selectable by value').toBe('beta');
    expect(fired.count, 'change should fire').toBe(1);
  });

  test('multiple and disabled reach the control', async ({ page }) => {
    await render(page, `
      <select id="m" multiple>${OPTIONS}</select>
      <select id="d" disabled>${OPTIONS}</select>
    `);
    const state = await page.evaluate(() => {
      const m = document.querySelector('#m') as HTMLSelectElement;
      const d = document.querySelector('#d') as HTMLSelectElement;
      return { multiple: m.multiple, disabled: d.disabled };
    });
    expect(state.multiple).toBe(true);
    expect(state.disabled).toBe(true);
  });

  test('clearable wraps the control and the clear button empties it', async ({ page }) => {
    await render(page, `<select id="c" clearable>${OPTIONS}</select>`);

    const wrapped = await page.evaluate(() =>
      !!document.querySelector('#c')!.closest('.wb-select-clearable')
    );
    expect(wrapped, 'clearable should wrap the control').toBe(true);

    const cleared = await page.evaluate(() => {
      const el = document.querySelector('#c') as HTMLSelectElement;
      el.value = 'beta';
      const btn = el.closest('.wb-select-clearable')!.querySelector('.wb-select__clear') as HTMLElement;
      if (!btn) return { hadButton: false, index: el.selectedIndex };
      btn.click();
      return { hadButton: true, index: el.selectedIndex };
    });
    expect(cleared.hadButton, 'a clear control should exist').toBe(true);
    expect(cleared.index, 'clearing should deselect').toBe(-1);
  });
});
