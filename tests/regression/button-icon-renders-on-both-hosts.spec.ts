import { test, expect } from '@playwright/test';

/**
 * `<div x-button icon="star">` renders its icon, same as `<button icon="star">`.
 *
 * John: "you broke the icon" — on
 * `<div id="button-icon-star" x-button variant="primary" icon="star" size="md">`,
 * which rendered its label and no star at all, while the identical native
 * <button> rendered the SVG fine.
 *
 * Cause: button() bails out when it sees an x- attribute it does not recognise,
 * on the reasoning that another system owns the element. The schema builder
 * stamps `x-schema="button"` on a host it has processed — this behavior's OWN
 * marker — and the guard counted it as foreign, so the whole behavior returned
 * early and never injected the icon. The modifier classes on the element came
 * from the schema builder, which is why it LOOKED styled: `x-button--star`
 * (the icon name mapped as if it were a variant) and `x-button--_self` are
 * classes button() never emits.
 *
 * This is #746 a second time. That issue fixed exactly the same self-exclusion
 * for `x-button`, and OWN_ATTRS has grown three entries since without
 * `x-schema` among them.
 *
 * Asserted as PARITY between the two authoring forms rather than as "an svg
 * exists": the standing rule is that both forms produce the same control, and
 * a parity assertion catches the next feature that reaches only one of them.
 */

const ICONS = ['star', 'download', 'check', 'search'];

type Row = {
  icon: string;
  attr: { svg: boolean; iconSpan: boolean; classes: string[] };
  native: { svg: boolean; iconSpan: boolean; classes: string[] };
};

test.describe('button icon parity across authoring forms', () => {
  let rows: Row[];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });

    rows = await page.evaluate(async (icons) => {
      const out: any[] = [];
      for (const icon of icons) {
        const host = document.createElement('div');
        host.style.cssText = 'position:fixed;top:0;left:0;width:640px;z-index:99999';
        host.innerHTML =
          `<div id="attr-${icon}" x-button variant="primary" icon="${icon}" size="md">Label</div>` +
          `<button id="native-${icon}" variant="primary" icon="${icon}" size="md">Label</button>`;
        document.body.appendChild(host);
        await (window as any).WB.scan(host, { eager: true });
        await new Promise((r) => setTimeout(r, 400));

        const read = (id: string) => {
          const el = document.getElementById(id)!;
          return {
            svg: !!el.querySelector('svg'),
            iconSpan: !!el.querySelector('.x-button__icon'),
            classes: Array.from(el.classList).sort(),
          };
        };
        out.push({ icon, attr: read(`attr-${icon}`), native: read(`native-${icon}`) });
        host.remove();
      }
      return out;
    }, ICONS);

    await page.close();
  });

  test('the sweep actually ran', () => {
    expect(rows.length).toBe(ICONS.length);
  });

  test('the attribute form renders an icon', () => {
    const missing = rows.filter((r) => !r.attr.svg).map((r) => `icon="${r.icon}"`);
    expect(missing, '<div x-button icon="…"> rendered no icon').toEqual([]);
  });

  test('the native form still renders an icon', () => {
    // Guards the fix from being "made both forms equally broken".
    const missing = rows.filter((r) => !r.native.svg).map((r) => `icon="${r.icon}"`);
    expect(missing, '<button icon="…"> rendered no icon').toEqual([]);
  });

  test('neither form invents a modifier class from the icon name', () => {
    // `x-button--star` treats the icon's VALUE as if it were a variant. Any
    // such class means something mapped attributes blindly instead of reading
    // the schema.
    const bogus: string[] = [];
    for (const r of rows) {
      for (const [form, data] of [['attr', r.attr], ['native', r.native]] as const) {
        const bad = data.classes.filter((c) => c === `x-button--${r.icon}` || c === 'x-button--_self');
        if (bad.length) bogus.push(`${form} icon="${r.icon}" got ${bad.join(', ')}`);
      }
    }
    expect(bogus, 'an attribute VALUE was mapped straight to a modifier class').toEqual([]);
  });
});
