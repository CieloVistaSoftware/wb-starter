import { test, expect, type Page } from '@playwright/test';

/**
 * #671 / #672 — variants and striping must be VISIBLE, not merely classed.
 *
 * #671: `<textarea variant="error">` applied `x-textarea--error` correctly and
 * input.css defined the rule correctly, yet every variant looked identical to
 * plain. Two independent causes, both of which had to go:
 *
 *   1. textarea.js / input.js set `border`, `background` and `color` INLINE.
 *      Inline beats every stylesheet rule at any specificity, so the behavior
 *      overrode its own variant classes.
 *   2. input.css's bare-native rules stacked 5-9 `:not([type=...])` selectors,
 *      worth a class each — specificity 0-9-1 against a modifier class's
 *      0-1-0. The rule's own comment claimed "low specificity"; :where()
 *      finally makes that true.
 *
 * #672: striping only painted the odd rows, leaving the even ones transparent,
 * so contrast depended on whatever surface the table sat on rather than on the
 * theme.
 *
 * Assertions compare COMPUTED colour between variants — a test that only
 * checked for the class name would have passed throughout the entire bug.
 */

const FIXTURE = '/tests/fixtures/blank.html';

/**
 * Render markup through WB and WAIT FOR THE SPECIFIC STYLESHEET it needs.
 *
 * Behavior CSS is JIT-loaded per behavior (src/core/style-loader.js), so the
 * stylesheet lands some time after the element does. An earlier version of this
 * helper accepted *any* stylesheet and swallowed its own timeout, so tests
 * measured unstyled elements and reported `rgb(0, 0, 0)` — a false failure that
 * would have been a false PASS just as easily. Wait for the named file, and let
 * the wait throw: a test that cannot establish its own preconditions must fail
 * loudly, not guess.
 */
async function render(page: Page, markup: string, requiredCss: string[]) {
  await page.goto(FIXTURE, { waitUntil: 'domcontentloaded' });

  // The blank fixture loads no theme, so every --danger-color / --bg-* is
  // UNDEFINED there. `border-color: var(--undefined)` is invalid at computed-
  // value time and falls back to black, which made all four textareas report
  // rgb(0, 0, 0) and looked exactly like the bug under test. The theme is a
  // precondition of asserting on themed colours, so this test loads it rather
  // than assuming the fixture will.
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

  // `link.sheet` stays null until the file is fetched AND parsed, so it is the
  // honest signal that the rules are live — the <link> existing is not.
  await page.waitForFunction(
    (files) => files.every((f) => {
      const link = [...document.querySelectorAll('link[rel="stylesheet"]')]
        .find((l) => (l as HTMLLinkElement).href.includes(f)) as HTMLLinkElement | undefined;
      return !!link && !!link.sheet;
    }),
    requiredCss,
    { timeout: 10000 }
  );
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));

  const themed = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--danger-color').trim()
  );
  expect(themed, 'the theme must be live before any colour is asserted').not.toBe('');
}

function borderOf(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? getComputedStyle(el).borderColor : null;
  }, selector);
}

test.describe('form control variants are visible (#671)', () => {
  test('textarea error/success/warning each differ from plain and from each other', async ({ page }) => {
    await render(page, `
      <textarea id="e" variant="error">e</textarea>
      <textarea id="s" variant="success">s</textarea>
      <textarea id="w" variant="warning">w</textarea>
      <textarea id="p">plain</textarea>
    `, ['input.css']);

    const [e, s, w, p] = await Promise.all([
      borderOf(page, '#e'), borderOf(page, '#s'), borderOf(page, '#w'), borderOf(page, '#p'),
    ]);

    expect(e, 'error must not look like plain').not.toBe(p);
    expect(s, 'success must not look like plain').not.toBe(p);
    expect(w, 'warning must not look like plain').not.toBe(p);
    expect(new Set([e, s, w]).size, 'the three variants must be distinguishable from each other').toBe(3);
  });

  test('the behavior no longer sets border/background/color inline', async ({ page }) => {
    // The root cause, pinned directly: any inline colour here re-breaks every
    // variant no matter how correct the stylesheet is.
    await render(page, `<textarea id="e" variant="error">e</textarea>`, ['input.css']);
    const inline = await page.evaluate(() => {
      const el = document.querySelector('#e') as HTMLElement;
      return { border: el.style.border, background: el.style.background, color: el.style.color };
    });
    expect(inline.border, 'border must come from the stylesheet').toBe('');
    expect(inline.background, 'background must come from the stylesheet').toBe('');
    expect(inline.color, 'color must come from the stylesheet').toBe('');
  });

  test('input error differs from plain — the 0-9-1 :not() chain no longer wins', async ({ page }) => {
    await render(page, `<input id="e" variant="error" value="e"><input id="p" value="p">`, ['input.css']);
    const [e, p] = await Promise.all([borderOf(page, '#e'), borderOf(page, '#p')]);
    expect(e, 'input variant must beat the bare-native base rule').not.toBe(p);
  });
});

test.describe('striped rows have real contrast (#672)', () => {
  test('both parities are painted, and they differ', async ({ page }) => {
    const rows = JSON.stringify(Array.from({ length: 6 }, (_, i) => [`r${i + 1}`, String(i + 1)])).replace(/"/g, '&quot;');
    await render(page, `<table striped headers="A,B" rows="${rows}"></table>`, ['data.css']);

    const bgs = await page.evaluate(() =>
      [...document.querySelectorAll('#harness tbody tr')].slice(0, 2)
        .map((tr) => getComputedStyle(tr).backgroundColor)
    );

    const TRANSPARENT = 'rgba(0, 0, 0, 0)';
    expect(bgs[0], 'odd rows must be painted').not.toBe(TRANSPARENT);
    expect(bgs[1], 'even rows must be painted too — not left to whatever is behind the table').not.toBe(TRANSPARENT);
    expect(bgs[0], 'the two parities must actually differ').not.toBe(bgs[1]);
  });

  test('the pager uses a defined theme token, not an undefined one', async ({ page }) => {
    // --bg-surface is defined in no theme; using it computed to transparent.
    const rows = JSON.stringify(Array.from({ length: 6 }, (_, i) => [`r${i + 1}`, String(i + 1)])).replace(/"/g, '&quot;');
    await render(page, `<table paginated page-size="3" headers="A,B" rows="${rows}"></table>`, ['data.css']);
    const bg = await page.evaluate(() => {
      const el = document.querySelector('.x-table__pager');
      return el ? getComputedStyle(el).backgroundColor : null;
    });
    expect(bg, 'the pager should have a background').not.toBeNull();
    expect(bg, 'an undefined custom property computes to transparent').not.toBe('rgba(0, 0, 0, 0)');
  });
});
