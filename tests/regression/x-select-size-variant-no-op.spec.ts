import { test, expect } from '@playwright/test';

/**
 * #497: select.schema.json / semantics/select.js's buildWbSelect() declares
 * `size` (xs/sm/md/lg/xl) and `variant` (default/success/error) and adds
 * matching `x-select--{{size}}` / `x-select--{{variant}}` classes -- but
 * ONLY to the host <select> wrapper (select.js lines 101-102). The
 * actually-visible control is the real <select class="x-select__field">
 * built INSIDE that host (line 112-113), which never receives those
 * classes and has no matching CSS rule of its own -- input.css's
 * `.x-select--*` rules (lines 82-123) all target the host tag/class, and
 * the only rule that touches the inner native <select> tag directly (lines
 * 35-42) hardcodes a constant `border: 1px solid var(--border-color)`,
 * ignoring variant entirely. Confirmed by John pasting ~23 x-select combos
 * (every size x variant) and reporting "almost zero variation" between
 * combos that should look visibly different.
 */
const HARNESS = '/demos/test-harness.html';

async function inject(page: import('@playwright/test').Page, html: string) {
  await page.goto(HARNESS);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  const ids = await page.evaluate(async (h: string) => {
    const existing = document.getElementById('test-container');
    if (existing) existing.remove();
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = h;
    document.body.appendChild(container);
    await (window as any).WB.scan(container);
    return Array.from(container.querySelectorAll('[id]')).map((el) => el.id);
  }, html);
  // Wait for the real <select class="x-select__field"> buildWbSelect()
  // creates, proving the behavior actually ran (not just that the host
  // element exists).
  await page.waitForFunction(
    (elementIds: string[]) => elementIds.every((id) => document.getElementById(id)?.querySelector('select.x-select__field')),
    ids,
    { timeout: 5000 }
  );
}

test.describe('.x-select size/variant classes actually differ from default', () => {
  test('xs/sm/md/lg render distinct rendered <select> padding', async ({ page }) => {
    await inject(page, `
      <select id="sel-xs" size="xs" options='[{"value":"1","label":"One"}]'></select>
      <select id="sel-sm" size="sm" options='[{"value":"1","label":"One"}]'></select>
      <select id="sel-md" size="md" options='[{"value":"1","label":"One"}]'></select>
      <select id="sel-lg" size="lg" options='[{"value":"1","label":"One"}]'></select>
    `);
    // Padding is NOT inherited, so unlike font-size it can only differ if the
    // size class actually lands on the rendered <select> itself. Confirmed
    // live pre-fix: this was "0px" for every size (the host's padding never
    // touches its child), which is why sizes looked nearly identical despite
    // font-size alone inheriting through.
    const paddings = await Promise.all(
      ['#sel-xs', '#sel-sm', '#sel-md', '#sel-lg'].map((sel) =>
        page.locator(`${sel} select.x-select__field`).evaluate((el) => getComputedStyle(el).padding)
      )
    );
    expect(new Set(paddings).size, `expected 4 distinct rendered <select> paddings, got: ${JSON.stringify(paddings)}`).toBe(4);
  });

  test('default/success/error render three distinct rendered <select> border colors', async ({ page }) => {
    await inject(page, `
      <select id="sel-default" variant="default" options='[{"value":"1","label":"One"}]'></select>
      <select id="sel-success" variant="success" options='[{"value":"1","label":"One"}]'></select>
      <select id="sel-error" variant="error" options='[{"value":"1","label":"One"}]'></select>
    `);
    const colors = await Promise.all(
      ['#sel-default', '#sel-success', '#sel-error'].map((sel) =>
        page.locator(`${sel} select.x-select__field`).evaluate((el) => getComputedStyle(el).borderColor)
      )
    );
    expect(new Set(colors).size, `expected 3 distinct rendered <select> border colors, got: ${JSON.stringify(colors)}`).toBe(3);
  });
});
