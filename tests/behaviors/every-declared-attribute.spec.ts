/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EVERY declared attribute must reach the element (#768)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John: "x-avatar and probably many more are not supporting size attributes.
 * we need to test every single x-example to support all params."
 *
 * He is right that it is "probably many more" — that is the whole problem.
 * Four separate reports this month were the same defect found one behavior at
 * a time: #697 fieldset `collapsible`, #751 form `ajax`, #752 fieldset again,
 * #754 input `variant`/`size`. Each was fixed where it was reported. Nothing
 * ever asked the general question.
 *
 * This asks it: for every attribute declared in every schema — 727 across 128
 * behaviors — set it and check the rendered element actually changed.
 *
 * WHAT COUNTS AS "REACHED"
 *
 * The rendered outerHTML differs from the same element with the attribute
 * absent. Deliberately not "has class wb-x--y": behaviors legitimately express
 * an attribute as a class, an inline style, a built child, an ARIA attribute
 * or a property, and pinning one mechanism would fail correct code. The bug
 * being hunted is the attribute doing NOTHING, and nothing is unambiguous.
 *
 * WHY IT REPORTS INSTEAD OF FAILING FAST
 *
 * One assertion per behavior would stop at the first break and hide the rest.
 * The value here is the inventory, so each behavior reports every attribute it
 * ignores, and the summary test carries the total.
 */

import { test, expect, Page } from '@playwright/test';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const MODELS = join(ROOT, 'src/wb-models');

interface Attr { name: string; sample: string; bare: boolean; }
interface Behavior { name: string; attrs: Attr[]; }

/** kebab-case is what the DOM sees: iconPosition -> icon-position. */
const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

/** A value worth setting: a real enum member, or something type-appropriate. */
function sampleFor(def: any): { value: string; bare: boolean } | null {
  if (!def || typeof def !== 'object') return null;
  if (Array.isArray(def.enum) && def.enum.length) {
    // Prefer a value that is NOT the default — setting the default can
    // legitimately render identically to omitting it, which would be a false
    // failure rather than a real one.
    const notDefault = def.enum.find((v: any) => v !== def.default);
    return { value: String(notDefault ?? def.enum[0]), bare: false };
  }
  if (def.type === 'boolean') return { value: '', bare: true };
  if (def.type === 'number' || def.type === 'integer') return { value: '3', bare: false };
  return { value: 'wbtest', bare: false };
}

function loadBehaviors(): Behavior[] {
  const out: Behavior[] = [];
  for (const file of readdirSync(MODELS)) {
    if (!file.endsWith('.schema.json')) continue;
    let schema: any;
    try { schema = JSON.parse(readFileSync(join(MODELS, file), 'utf8')); } catch { continue; }
    const props = schema?.properties;
    if (!props || typeof props !== 'object') continue;

    const attrs: Attr[] = [];
    for (const [prop, def] of Object.entries<any>(props)) {
      const s = sampleFor(def);
      if (!s) continue;
      attrs.push({ name: kebab(prop), sample: s.value, bare: s.bare });
    }
    if (attrs.length) out.push({ name: file.replace('.schema.json', ''), attrs });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

const BEHAVIORS = loadBehaviors();

async function harness(page: Page) {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
}

/**
 * Render the behavior once with no attributes and once per declared attribute,
 * then report which ones left the element unchanged.
 */
async function ignoredAttributes(page: Page, b: Behavior): Promise<string[]> {
  return page.evaluate(async ({ name, attrs }) => {
    const host = document.createElement('div');
    host.id = 'attr-probe';
    host.style.cssText = 'position:absolute;left:-9999px;top:0;width:600px';
    document.body.appendChild(host);

    const mk = (extra: string, id: string) =>
      `<div id="${id}" x-${name}${extra}>probe</div>`;

    host.innerHTML =
      mk('', 'base') +
      attrs.map((a: any, i: number) =>
        mk(a.bare ? ` ${a.name}` : ` ${a.name}="${a.sample}"`, `p${i}`)).join('');

    const WB = (window as any).WB;
    if (WB?.scan) await WB.scan(host, { eager: true });
    await new Promise((r) => setTimeout(r, 120));

    // Compare the rendered element with the attribute REMOVED from the
    // comparison, so the attribute's own presence in outerHTML is not what
    // makes them differ — otherwise every attribute would trivially "pass".
    const normalise = (el: Element | null, drop: string) => {
      if (!el) return '';
      const clone = el.cloneNode(true) as Element;
      clone.removeAttribute(drop);
      clone.removeAttribute('id');
      return clone.outerHTML;
    };

    const baseEl = document.getElementById('base');
    const ignored: string[] = [];
    attrs.forEach((a: any, i: number) => {
      const el = document.getElementById('p' + i);
      const base = normalise(baseEl, a.name);
      const got = normalise(el, a.name);
      if (base === got) ignored.push(a.name);
    });

    host.remove();
    return ignored;
  }, { name: b.name, attrs: b.attrs } as any);
}

test.describe('Every declared attribute reaches the element', () => {
  test('the schema surface is non-empty — the sweep cannot pass vacuously', () => {
    expect(BEHAVIORS.length, 'no schemas with properties found').toBeGreaterThan(50);
    const total = BEHAVIORS.reduce((n, b) => n + b.attrs.length, 0);
    expect(total, 'no declared attributes found').toBeGreaterThan(300);
  });

  for (const b of BEHAVIORS) {
    test(`x-${b.name}: all ${b.attrs.length} declared attributes take effect`, async ({ page }) => {
      await harness(page);
      const ignored = await ignoredAttributes(page, b);
      expect(
        ignored,
        `x-${b.name} ignores ${ignored.length}/${b.attrs.length} declared attributes: ${ignored.join(', ')}\n` +
        `Each is declared in ${b.name}.schema.json, documented from it, and written in examples — ` +
        `setting it changed nothing in the rendered element.`,
      ).toEqual([]);
    });
  }
});
