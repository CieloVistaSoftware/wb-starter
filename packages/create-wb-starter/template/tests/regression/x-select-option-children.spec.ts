import { test, expect, Page } from '@playwright/test';

/**
 * #390: <select> silently discarded real <option> children.
 * buildWbSelect() (src/wb-viewmodels/semantics/select.js) called
 * `element.innerHTML = ''` before anything ever read the authored
 * <option> children, and only ever populated options from a JSON-string
 * `options="[...]"` attribute -- never from children. Every documented
 * example (docs/components/forms/forms.readme.md, demos/site/forms.html)
 * used real <option> children, so every one of them rendered an empty
 * dropdown (just the placeholder) despite being "correct" per the docs.
 *
 * Fixed: real <option> children are read BEFORE the innerHTML wipe and
 * take priority over the options="[...]" attribute.
 */
async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'x-select-option-test-area';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(300);
}

test.describe('<select> real <option> children (#390)', () => {
  test('option children render in the built <select>, not just the placeholder', async ({ page }) => {
    await setup(page, `
      <select id="s1">
        <option value="us">United States</option>
        <option value="ca">Canada</option>
        <option value="uk">United Kingdom</option>
      </select>
    `);
    const texts = await page.locator('#s1 select option').allTextContents();
    expect(texts.map((t) => t.trim())).toEqual(['Select...', 'United States', 'Canada', 'United Kingdom']);
  });

  test('option value attribute is preserved', async ({ page }) => {
    await setup(page, `
      <select id="s2">
        <option value="js">JavaScript</option>
        <option value="py">Python</option>
      </select>
    `);
    const values = await page.locator('#s2 select option').evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value));
    expect(values).toEqual(['', 'js', 'py']);
  });

  test('options="[...]" attribute still works when there are no <option> children (backward compat)', async ({ page }) => {
    await setup(page, `<select id="s3" options='[{"value":"a","label":"Alpha"},{"value":"b","label":"Beta"}]'></select>`);
    const texts = await page.locator('#s3 select option').allTextContents();
    expect(texts.map((t) => t.trim())).toEqual(['Select...', 'Alpha', 'Beta']);
  });
});
