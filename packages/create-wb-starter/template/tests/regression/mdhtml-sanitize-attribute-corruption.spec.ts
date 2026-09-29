import { test, expect } from '../fixtures/offline';

/**
 * mdhtml.js's XSS sanitizer (on by default -- `sanitize="false"` opts out)
 * strips `on*="..."` event-handler attributes from rendered markdown via
 * a regex: `/\s*on\w+\s*=\s*["'][^"']*["']/gi`. The leading `\s*` (zero or
 * more) let the match start MID-WORD, not just at a real attribute
 * boundary -- so any attribute whose NAME merely contains "on" followed by
 * more word characters before its own `=` (e.g. `options='[{"a":"b"}]'`,
 * matched as "opti|ons='...") got silently eaten from there through the
 * next quote. This is not cosmetic: the resulting DOM element is missing
 * the attribute entirely (confirmed live on docs/behaviors-reference.md
 * and docs/behaviors/select.md -- <select options="..."> lost
 * its whole `options` attribute, so the dropdown only ever showed its
 * "Select..." placeholder with zero real entries).
 *
 * Fixed by requiring a real leading whitespace boundary (`\s+`), which a
 * mid-word "on" (preceded by a word character, not whitespace) can never
 * satisfy, while genuine ` onclick="..."` attributes (always preceded by
 * whitespace in valid HTML) still match and get stripped.
 */

test.describe('mdhtml.js sanitizer: on* stripping does not eat unrelated attributes', () => {
  test('the fixed regex leaves a JSON-in-attribute value like options=\'[...]\' intact', async ({ page }) => {
    await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/behaviors-reference.md'), {
      waitUntil: 'domcontentloaded',
    });

    const result = await page.evaluate(() => {
      const html =
        '<select label="Country" options=\'[{"value":"us","label":"United States"},{"value":"uk","label":"United Kingdom"}]\'></select>' +
        '<div onclick="window.__xss_fired = true" data-safe="keep-me">click</div>';
      return html.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
    });

    // The JSON attribute value must survive completely unmangled.
    expect(result).toContain('options=\'[{"value":"us","label":"United States"},{"value":"uk","label":"United Kingdom"}]\'');
    // A genuine event-handler attribute must still be stripped (the
    // sanitizer's actual security purpose must keep working).
    expect(result).not.toContain('onclick=');
    expect(result).not.toContain('window.__xss_fired');
    // An unrelated attribute after the stripped one survives untouched.
    expect(result).toContain('data-safe="keep-me"');
  });

  test('docs/behaviors-reference.md: the live <select> keeps its real options attribute and dropdown entries', async ({ page }) => {
    await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/behaviors-reference.md'), {
      waitUntil: 'domcontentloaded',
    });

    // By its authored attribute, not the .x-select class: the lazy runtime
    // (#491) only builds the host as it nears the viewport, so a class the
    // build adds cannot be what scrolls it there. (The doc's host was a bare
    // <select options=...> -- the migration's reading of <x-select> -- which
    // takes the native branch and never builds from options=; it is
    // <div x-select> again.)
    const select = page.locator('[x-demo] [x-select]').first();
    await select.scrollIntoViewIfNeeded();
    await expect(select).toHaveAttribute('x-ready', '', { timeout: 20000 });
    await expect(select).toBeVisible({ timeout: 20000 });

    await expect
      .poll(() => select.getAttribute('options'), {
        message: '.x-select should keep its full options JSON attribute, not lose it to the sanitizer',
        timeout: 10000,
      })
      .toContain('United States');

    const nativeOptions = select.locator('select option');
    await expect(nativeOptions).toHaveCount(3); // placeholder + US + UK
    await expect(select.locator('select')).toContainText('United States');
    await expect(select.locator('select')).toContainText('United Kingdom');
  });

  test('docs/behaviors/select.md: every .x-select example renders its real options, not just the placeholder', async ({ page }) => {
    // select.md was rewritten around ONE example -- a native <select> whose
    // <option> children are the choices (#746: no x-select on a <select>) --
    // so the eight `.x-select options='[...]'` hosts this used to count are
    // gone, and the count assertion could never be met. What the doc shows
    // must still survive the sanitizer whole: every authored option, with its
    // value intact (fix/706-dropdown carries the `/` a sloppier attribute
    // regex would also eat).
    await page.goto(
      '/public/doc-viewer.html?file=' + encodeURIComponent('docs/behaviors/select.md'),
      { waitUntil: 'domcontentloaded' }
    );

    const selects = page.locator('[x-demo] select');
    await expect(selects.first()).toBeAttached({ timeout: 20000 });
    const count = await selects.count();
    expect(count, 'select.md should render its live <select> example').toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      const sel = selects.nth(i);
      await sel.scrollIntoViewIfNeeded();
      await expect(sel).toBeVisible({ timeout: 10000 });
      const values = await sel.locator('option').evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value));
      expect(values, `select #${i} should keep its authored options, not just a placeholder`).toEqual(['main', 'develop', 'fix/706-dropdown']);
    }
  });
});
