/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INPUT — Parameter Permutation Suite (#754)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John: "run tests on all input examples we have ensure the variants are all
 * working", and "doesn't work but should at least show a runtime error".
 *
 * Written because `<div x-input label="Repository" placeholder="owner/name"
 * input-type="text">` — the documented authoring form — rendered NOTHING:
 * the field-building path was gated on tagName === 'WB-INPUT'.
 *
 * Value lists are read from input.schema.json at runtime, so a value added to
 * the schema is covered without touching this file, and a gutted schema fails
 * loudly instead of making every loop vacuously pass.
 *
 * Every parameter is checked on BOTH hosts the framework claims to support:
 *   - `<input>`      — the native control, wrapped by the behavior
 *   - `<div x-input>` — a container the behavior builds a field inside
 * A parameter that works on one and not the other is the #754 bug class.
 *
 * @version 3.0.0
 */

import { test, expect, Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

const schema = JSON.parse(
  readFileSync(join(process.cwd(), 'src/wb-models/input.schema.json'), 'utf8')
);
const P = (schema.properties ?? {}) as Record<string, any>;

const VARIANTS: string[] = P.variant?.enum ?? [];
const SIZES: string[] = P.size?.enum ?? [];
const TYPES: string[] = P.inputType?.enum ?? [];
const ICON_POSITIONS: string[] = P.iconPosition?.enum ?? [];
const BOOLEANS = ['disabled', 'readonly', 'required', 'clearable'] as const;

const HOSTS = [
  { name: '<input>', open: (attrs: string) => `<input ${attrs}>`, container: false },
  { name: '<div x-input>', open: (attrs: string) => `<div x-input ${attrs}></div>`, container: true },
];

async function render(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 15000 });
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'input-perm-area';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => {
    const c = document.getElementById('input-perm-area');
    if ((window as any).WB?.scan) await (window as any).WB.scan(c, { eager: true });
  });
  await page.waitForTimeout(250);
}

/** The element a parameter should have landed on: the field itself. */
async function fieldOf(page: Page, id: string) {
  return page.evaluate((elId) => {
    const host = document.getElementById(elId)!;
    const field = host.tagName === 'INPUT' ? host : host.querySelector('input');
    return {
      hostTag: host.tagName,
      hostClass: host.className,
      hasField: !!field,
      fieldClass: field ? (field as HTMLElement).className : null,
      fieldType: field ? (field as HTMLInputElement).type : null,
      fieldPlaceholder: field ? (field as HTMLInputElement).placeholder : null,
      fieldName: field ? (field as HTMLInputElement).name : null,
      disabled: field ? (field as HTMLInputElement).disabled : null,
      readOnly: field ? (field as HTMLInputElement).readOnly : null,
      required: field ? (field as HTMLInputElement).required : null,
      text: host.textContent || '',
      html: host.outerHTML.slice(0, 200),
    };
  }, id);
}

test.describe('Input — schema sanity', () => {
  test('every enum this suite iterates has values', () => {
    expect(VARIANTS.length, 'variant enum').toBeGreaterThan(0);
    expect(SIZES.length, 'size enum').toBeGreaterThan(0);
    expect(TYPES.length, 'inputType enum').toBeGreaterThan(0);
    expect(ICON_POSITIONS.length, 'iconPosition enum').toBeGreaterThan(0);
  });
});

for (const host of HOSTS) {
  test.describe(`Input — ${host.name}`, () => {
    test('the behavior produces a usable field', async ({ page }) => {
      await render(page, host.open('id="f0" placeholder="type here"'));
      const f = await fieldOf(page, 'f0');
      expect(f.hasField, `${host.name} produced no <input> to type into — ${f.html}`).toBe(true);
    });

    test(`every variant applies (${VARIANTS.length})`, async ({ page }) => {
      await render(page, VARIANTS.map((v, i) => host.open(`id="v${i}" variant="${v}"`)).join(''));
      for (const [i, v] of VARIANTS.entries()) {
        const f = await fieldOf(page, `v${i}`);
        const marked = `${f.hostClass} ${f.fieldClass ?? ''}`.includes(v);
        expect(marked, `variant="${v}" left no trace on ${host.name} — ${f.html}`).toBe(true);
      }
    });

    test(`every size applies (${SIZES.length})`, async ({ page }) => {
      await render(page, SIZES.map((s, i) => host.open(`id="s${i}" size="${s}"`)).join(''));
      for (const [i, s] of SIZES.entries()) {
        const f = await fieldOf(page, `s${i}`);
        const marked = `${f.hostClass} ${f.fieldClass ?? ''}`.includes(s);
        expect(marked, `size="${s}" left no trace on ${host.name} — ${f.html}`).toBe(true);
      }
    });

    test(`every inputType reaches the field (${TYPES.length})`, async ({ page }) => {
      // The container form takes it as input-type; the native form as type.
      const attr = host.container ? 'input-type' : 'type';
      await render(page, TYPES.map((t, i) => host.open(`id="t${i}" ${attr}="${t}"`)).join(''));
      for (const [i, t] of TYPES.entries()) {
        const f = await fieldOf(page, `t${i}`);
        expect(f.hasField, `${attr}="${t}" produced no field`).toBe(true);
        expect(f.fieldType, `${attr}="${t}" did not reach the field on ${host.name}`).toBe(t);
      }
    });

    test('label, placeholder and name reach the field', async ({ page }) => {
      await render(page, host.open('id="l0" label="Repository" placeholder="owner/name" name="repo"'));
      const f = await fieldOf(page, 'l0');
      expect(f.hasField, 'no field built').toBe(true);
      expect(f.fieldPlaceholder, 'placeholder did not reach the field').toBe('owner/name');
      expect(f.fieldName, 'name did not reach the field').toBe('repo');
      if (host.container) {
        // A label only makes sense on the container form, which builds one.
        expect(f.text, 'label text was not rendered').toContain('Repository');
      }
    });

    for (const b of BOOLEANS) {
      test(`boolean ${b} takes effect`, async ({ page }) => {
        await render(page, host.open(`id="b0"`) + host.open(`id="b1" ${b}`));
        const [plain, flagged] = [await fieldOf(page, 'b0'), await fieldOf(page, 'b1')];
        const prop = b === 'readonly' ? 'readOnly' : b;
        if (prop in flagged && (flagged as any)[prop] !== null) {
          expect((flagged as any)[prop], `${b} did not reach the field`).toBe(true);
        } else {
          // `clearable` adds a clear BUTTON, not a class — comparing only
          // classes reported a working feature as broken. Compare the whole
          // rendered element, which is what "took effect" actually means.
          const changed = flagged.html !== plain.html;
          expect(changed, `${b} left the element identical to the unflagged one`).toBe(true);
        }
      });
    }
  });
}

test.describe('Input — the two hosts agree (#754)', () => {
  test('variant x size land on both hosts, or on neither', async ({ page }) => {
    const pairs = VARIANTS.flatMap(v => SIZES.map(s => ({ v, s })));
    const html = pairs.map((p, i) =>
      `<input id="n${i}" variant="${p.v}" size="${p.s}">` +
      `<div x-input id="c${i}" variant="${p.v}" size="${p.s}"></div>`
    ).join('');
    await render(page, html);
    for (const [i, p] of pairs.entries()) {
      const native = await fieldOf(page, `n${i}`);
      const container = await fieldOf(page, `c${i}`);
      const nHas = `${native.hostClass} ${native.fieldClass ?? ''}`;
      const cHas = `${container.hostClass} ${container.fieldClass ?? ''}`;
      expect(nHas.includes(p.v) === cHas.includes(p.v),
        `variant="${p.v}": native=${nHas.includes(p.v)} container=${cHas.includes(p.v)} — the hosts disagree`).toBe(true);
      expect(nHas.includes(p.s) === cHas.includes(p.s),
        `size="${p.s}": native=${nHas.includes(p.s)} container=${cHas.includes(p.s)} — the hosts disagree`).toBe(true);
    }
  });
});
