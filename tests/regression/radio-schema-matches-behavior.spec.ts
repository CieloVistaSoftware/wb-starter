import { test, expect } from '../fixtures/offline';
import fs from 'node:fs';

/**
 * #1154: radio.js reads label, variant and size, but radio.schema.json was
 * generator output: variant and size defaulted to the placeholder strings
 * "this is the variant" / "this is the size", with no enum, so nothing
 * schema-driven knew which values exist. The docs said variant defaults to
 * `default`, the code to ''.
 *
 * The schema, the docs table and the running behavior must say the same thing.
 */
const schema = JSON.parse(fs.readFileSync('src/wb-models/radio.schema.json', 'utf8'));
const doc = fs.readFileSync('docs/behaviors/radio.md', 'utf8');

function docDefault(attr: string): string | undefined {
  const row = doc.split(/\r?\n/).find((l) => l.startsWith('| `' + attr + '`'));
  return row?.split('|')[3]?.trim().replace(/`/g, '');
}

test('radio.schema.json declares variant and size as the behavior reads them (#1154)', () => {
  const { variant, size } = schema.properties;
  expect(variant.enum, 'variant lists the colours radio.js styles').toEqual(['default', 'success', 'warning', 'danger', 'info']);
  expect(variant.default).toBe('default');
  expect(size.enum).toEqual(['sm', 'md', 'lg']);
  expect(size.default).toBe('md');
  expect(docDefault('variant'), 'docs/behaviors/radio.md variant default').toBe(variant.default);
  expect(docDefault('size'), 'docs/behaviors/radio.md size default').toBe(size.default);
});

test('every declared radio variant and size is applied, and default adds nothing (#1154)', async ({ page }) => {
  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => Boolean((window as any).WB));
  const variants: string[] = schema.properties.variant.enum;
  const sizes: string[] = schema.properties.size.enum;
  const classes = await page.evaluate(async ({ variants, sizes }) => {
    const host = document.createElement('div');
    for (const v of variants) host.insertAdjacentHTML('beforeend', `<input type="radio" name="v" data-case="variant:${v}" variant="${v}">`);
    for (const s of sizes) host.insertAdjacentHTML('beforeend', `<input type="radio" name="s" data-case="size:${s}" size="${s}">`);
    document.body.append(host);
    await (window as any).WB.scan(host, { eager: true });
    const out: Record<string, string> = {};
    host.querySelectorAll('input').forEach((el) => { out[el.getAttribute('data-case')!] = el.className; });
    return out;
  }, { variants, sizes });

  for (const v of variants) {
    const cls = classes[`variant:${v}`];
    expect(cls, `variant="${v}" is decorated`).toMatch(/\bx-radio\b/);
    if (v === 'default') expect(cls, 'variant="default" adds no colour class').not.toMatch(/x-radio--default/);
    else expect(cls, `variant="${v}"`).toMatch(new RegExp(`\\bx-radio--${v}\\b`));
  }
  for (const s of sizes) expect(classes[`size:${s}`], `size="${s}"`).toMatch(new RegExp(`\\bx-radio--${s}\\b`));
});

test('<div x-radio> builds a real radio and passes its options on (#1154)', async ({ page }) => {
  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => Boolean((window as any).WB));
  const inner = await page.evaluate(async () => {
    const host = document.createElement('div');
    host.innerHTML = '<div x-radio variant="success" size="lg" checked label="Yes"></div>';
    document.body.append(host);
    await (window as any).WB.scan(host, { eager: true });
    const input = host.querySelector('input[type="radio"]') as HTMLInputElement | null;
    return input && { className: input.className, checked: input.checked, label: host.textContent?.trim() };
  });
  expect(inner, 'a radio was built inside the div').not.toBeNull();
  expect(inner!.className).toMatch(/\bx-radio--success\b/);
  expect(inner!.className).toMatch(/\bx-radio--lg\b/);
  expect(inner!.checked).toBe(true);
  expect(inner!.label).toBe('Yes');
});
