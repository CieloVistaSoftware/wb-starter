import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#632): John, live: <button label="Save" icon="💾"> rendered
 * ONLY the icon span -- no "Save" text anywhere. button.schema.json declares
 * `label` as the button's primary (required) text property, but nothing in
 * button.js ever read it. Separately, <button label="Next" icon="→"
 * iconposition="end"> (no hyphen, exactly as John authored it) silently
 * ignored the position too -- only the hyphenated `icon-position` was ever
 * checked, so HTML's own lowercasing of a camelCase attribute (no hyphen
 * inserted) meant `iconposition` never matched. Same recurring pattern as
 * cardhorizontal's image-position (#601-603).
 *
 * Fixed: `applyLabel()` (button.js) fills in `label` as real text content
 * before icon/loading are applied -- same "children win over label" pattern
 * as badge()'s own label handling (#618) -- and icon-position reading now
 * also checks the no-hyphen `iconposition` form. Both fixes apply to both
 * <button> and a native <button>.
 */

async function renderButtons(page, markup: string) {
  await page.goto('/tests/fixtures/blank.html');
  await page.setContent(`
    <div id="test-container">${markup}</div>
    <script type="module">
      import WB from '/src/core/wb.js';
      window.__wbDone = false;
      WB.init({ autoInject: true }).then(() => WB.scan(document.body)).then(() => { window.__wbDone = true; });
    </script>
  `);
  await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 15000 });
  await page.waitForTimeout(300);
}

test.describe('button label attribute renders as text (#632)', () => {
  test('<button label="..." icon="..."> shows both the icon and the label text', async ({ page }) => {
    await renderButtons(page, `<button id="b1" label="Save" icon="💾"></button>`);
    const text = await page.locator('#b1').textContent();
    expect(text?.trim(), 'label text missing from x-button face').toContain('Save');
    await expect(page.locator('#b1 .x-button__icon')).toHaveCount(1);
  });

  test('native <button label="..." icon="..."> shows both the icon and the label text', async ({ page }) => {
    await renderButtons(page, `<button id="b2" label="Save" icon="💾"></button>`);
    const text = await page.locator('#b2').textContent();
    expect(text?.trim(), 'label text missing from native button face').toContain('Save');
    await expect(page.locator('#b2 .x-button__icon')).toHaveCount(1);
  });

  test('real text content still wins over label (children win over label)', async ({ page }) => {
    await renderButtons(page, `<button id="b3" label="Ignored">Real Text</button>`);
    const text = await page.locator('#b3').textContent();
    expect(text?.trim()).toBe('Real Text');
  });

  test('label + doc-link icon (x-demo) coexist -- doc-link does not block label rendering', async ({ page }) => {
    await renderButtons(page, `<button id="b4" label="Save"><a class="x-demo__card-doc-link">📖</a></button>`);
    const text = await page.locator('#b4').textContent();
    expect(text?.trim(), 'label was skipped because the doc-link icon looked like author content').toContain('Save');
  });
});

test.describe('button icon-position: both hyphenated and no-hyphen forms work (#632)', () => {
  test('<button icon-position="end"> (correct kebab-case) places the icon after the label', async ({ page }) => {
    await renderButtons(page, `<button id="b5" label="Next" icon="→" icon-position="end"></button>`);
    const html = await page.locator('#b5').innerHTML();
    expect(html.indexOf('x-button__icon')).toBeGreaterThan(html.indexOf('Next'));
  });

  test('<button iconposition="end"> (no hyphen, as authored) still places the icon after the label', async ({ page }) => {
    await renderButtons(page, `<button id="b6" label="Next" icon="→" iconposition="end"></button>`);
    const html = await page.locator('#b6').innerHTML();
    expect(html.indexOf('x-button__icon'), 'iconposition (no hyphen) was ignored, icon stayed at the default start position').toBeGreaterThan(html.indexOf('Next'));
  });

  test('default (no icon-position at all) places the icon before the label', async ({ page }) => {
    await renderButtons(page, `<button id="b7" label="Save" icon="💾"></button>`);
    const html = await page.locator('#b7').innerHTML();
    expect(html.indexOf('x-button__icon')).toBeLessThan(html.indexOf('Save'));
  });
});
