/**
 * THE INPUT ROWS A READER CLICKS CHANGE WHAT THEY SEE
 * ===================================================
 * #754 (closed) found input sizes dead and was guarded by
 * tests/behaviors/input-permutations.spec.ts -- which checks that a size or
 * type LEAVES A TRACE (a class, an attribute). A trace is not a rendering.
 *
 * John, 2026-09-28, on the behaviors page: "none of the sizes work" and, of
 * input · inputType=date / time / datetime-local, "shouldn't these have input
 * masks?" On 4.0.5 the inputType rows wrote `inputtype="date"` (HTML
 * lowercases the camelCase) beside the example's own type="text", so the
 * field stayed a text box with an "owner/name" placeholder (#1211).
 *
 * So this measures the rendered field, from the rows themselves.
 */
import { test, expect, Page } from '../fixtures/offline';

async function showRow(page: Page, prop: string, value: string) {
  const row = page.locator(`.behaviors-search-results__row[data-label="input"][data-prop="${prop}"][data-variant="${value}"]`).first();
  await expect(row).toBeAttached({ timeout: 30_000 });
  const group = page.locator('#behaviors-search-results details', { has: row });
  if (!(await group.first().evaluate((d) => (d as HTMLDetailsElement).open))) {
    await group.first().locator(':scope > summary').click();
  }
  await row.click();
  const input = page.locator(`#behaviors-live-example input#input-${prop.toLowerCase()}-${value}`);
  await expect(input).toHaveAttribute('x-ready', '');
  return input;
}

test.beforeEach(async ({ page }) => { await page.goto('/?page=behaviors'); });

test('size=sm, md, lg render three different heights and text sizes', async ({ page }) => {
  const seen: Record<string, { h: number; font: number }> = {};
  for (const size of ['sm', 'md', 'lg']) {
    const input = await showRow(page, 'size', size);
    seen[size] = await input.evaluate((el) => ({
      h: (el as HTMLElement).offsetHeight,
      font: parseFloat(getComputedStyle(el).fontSize),
    }));
  }
  const all = JSON.stringify(seen);
  expect(seen.md.h, `md taller than sm — ${all}`).toBeGreaterThan(seen.sm.h);
  expect(seen.lg.h, `lg taller than md — ${all}`).toBeGreaterThan(seen.md.h);
  expect(seen.md.font, `md text larger than sm — ${all}`).toBeGreaterThan(seen.sm.font);
  expect(seen.lg.font, `lg text larger than md — ${all}`).toBeGreaterThan(seen.md.font);
});

for (const type of ['date', 'time', 'datetime-local']) {
  test(`inputType=${type} renders the browser's ${type} picker, not a text box`, async ({ page }) => {
    const input = await showRow(page, 'inputType', type);
    // .type reflects what the browser actually built; an unknown value reads "text".
    expect(await input.evaluate((el) => (el as HTMLInputElement).type)).toBe(type);
    await expect(page.locator('#behaviors-live-code')).toContainText(`input-type="${type}"`);
  });
}

/**
 * John, 2026-09-28: "NONE OF THE SIZES WORK." The rows above were measured
 * on the <input> form only. The x-input rows build <div x-input size="…">,
 * where the size class landed on the host <div> and the real field inside
 * kept the browser's own 1px 2px padding: sm/md/lg read 25/28/31px against
 * the <input> form's 26/36/47px -- three near-identical boxes.
 * One size must look the same whichever way it is written.
 */
test('x-input size=sm, md, lg render the same field as <input size>', async ({ page }) => {
  const field = async (label: string, size: string) => {
    const row = page.locator(`.behaviors-search-results__row[data-label="${label}"][data-prop="size"][data-variant="${size}"]`).first();
    await expect(row).toBeAttached({ timeout: 30_000 });
    const group = page.locator('#behaviors-search-results details', { has: row });
    if (!(await group.first().evaluate((d) => (d as HTMLDetailsElement).open))) {
      await group.first().locator(':scope > summary').click();
    }
    await row.click();
    const input = page.locator(`#behaviors-live-example #input-size-${size} input.x-input__field, #behaviors-live-example input#input-size-${size}`).first();
    await expect(input).toHaveClass(/x-input__field/);
    await expect(page.locator(`#behaviors-live-example [id="input-size-${size}"]`)).toHaveAttribute('x-ready', '');
    return input.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { h: (el as HTMLElement).offsetHeight, font: cs.fontSize, pad: cs.padding };
    });
  };
  for (const size of ['sm', 'md', 'lg']) {
    const native = await field('input', size);
    const container = await field('x-input', size);
    expect(container, `size=${size}: <div x-input> field vs <input> field`).toEqual(native);
  }
});
