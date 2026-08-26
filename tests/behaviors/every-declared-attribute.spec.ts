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
 * This asks it: for every attribute declared in every behavior schema, set it
 * and check it actually reached the behavior.
 *
 * WHAT COUNTS AS "REACHED"  (#861)
 *
 * The first version of this sweep asked one question — "did `outerHTML`
 * change?" — and reported 104 of its 130 behaviors as broken. It stayed red
 * for months. Instrumenting the probe showed roughly 60% of that red was the
 * sweep measuring the wrong thing, and the noise was burying the ~154
 * attributes that really are dead.
 *
 * `outerHTML` alone is unsound in three directions, all of which the original
 * header comment already admitted ("behaviors legitimately express an
 * attribute as a class, an inline style, a built child, an ARIA attribute or a
 * property"):
 *
 *   1. CSS-only options. `[x-cardprofile][align]` is styled by an attribute
 *      selector. Nothing in the markup changes and the option works fine.
 *   2. Event-time options. `target` is only read inside the click handler;
 *      `axis`/`snap-to-grid` only matter mid-drag; `volume`/`bass`/`treble`
 *      are AudioContext parameters. None of them can change markup, by design.
 *   3. Combination options. `icon-position` is consumed only when `icon` or
 *      `loading` is also set, and this sweep sets each attribute ALONE.
 *
 * So "reached" is the union of three sound detectors — rendered markup
 * changed, OR computed style changed, OR the behavior actually read the
 * attribute off the host. The union can only ever turn a red case green, never
 * the reverse, so it cannot mask a real gap. The third detector is also the
 * exact contract the generated schemas state for themselves:
 * "every property here is one the code actually reads".
 *
 * WHAT COUNTS AS A BEHAVIOR SCHEMA  (#861)
 *
 * `src/wb-models/` also holds the meta-schema that validates schema files, a
 * page schema, a views registry and a search index. Sweeping those rendered
 * `<div x-schema $schema="wbtest">` and asserted it re-render. They are
 * excluded by their own `schemaType`/`isBase`, and `$`/`_`/`x-` prefixed
 * properties are excluded too — those are meta-fields and behavior tokens, not
 * attributes.
 *
 * The behavior token and the host tag come from the schema's own `schemaFor`
 * and `semanticElement.tagName`. Deriving the token from the FILENAME rendered
 * `<div x-drawerLayout>` (the real token is `x-drawer-layout`),
 * `<div x-x-effects>` and `<div x-card.base>` — none of which any behavior is
 * registered under, so nothing ran and every attribute "failed". Using a
 * hard-coded `<div>` host skipped every tag-gated path, e.g. button's
 * `href` (semantics/button.js: `if (href && element.tagName === 'BUTTON')`).
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
interface Behavior { name: string; token: string; tag: string; attrs: Attr[]; }

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

    // Not a behavior: the schema meta-schema, the views registry, the search
    // index, the page schema, and the abstract card base nothing instantiates.
    const kind = schema?.schemaType;
    if (kind === 'definition' || kind === 'page' || schema?.isBase) continue;

    const props = schema?.properties;
    if (!props || typeof props !== 'object') continue;

    // The token the behavior is actually registered under, not the filename.
    const declared = String(schema.schemaFor || file.replace('.schema.json', ''));
    const token = declared.startsWith('x-') ? declared : `x-${declared}`;
    if (!/^x-[a-z0-9][a-z0-9-]*$/.test(token)) continue;

    const attrs: Attr[] = [];
    for (const [prop, def] of Object.entries<any>(props)) {
      // `$schema`/`_metadata` are schema plumbing; a property named `x-…` is a
      // sibling BEHAVIOR token (x-effects declares x-animate, x-fadeout), not
      // an attribute of this one.
      if (prop.startsWith('$') || prop.startsWith('_') || prop.startsWith('x-')) continue;
      const s = sampleFor(def);
      if (!s) continue;
      attrs.push({ name: kebab(prop), sample: s.value, bare: s.bare });
    }
    if (!attrs.length) continue;

    const tag = String(schema?.semanticElement?.tagName || 'div').toLowerCase();
    out.push({ name: file.replace('.schema.json', ''), token, tag, attrs });
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
 * then report which ones never reached the behavior at all.
 */
async function ignoredAttributes(page: Page, b: Behavior): Promise<string[]> {
  return page.evaluate(async ({ token, tag, attrs }) => {
    // A broad-but-fixed slice of computed style. Behaviors that express an
    // option purely through a CSS attribute selector change nothing in the
    // markup, so `outerHTML` cannot see them — this is what does.
    const STYLE_KEYS = [
      'width', 'height', 'borderRadius', 'display', 'backgroundColor', 'color', 'padding',
      'margin', 'flexDirection', 'position', 'fontSize', 'fontWeight', 'textAlign',
      'borderWidth', 'borderColor', 'opacity', 'gap', 'gridTemplateColumns', 'overflow',
      'maxWidth', 'minHeight', 'boxShadow', 'transform', 'visibility', 'order', 'alignItems',
      'justifyContent', 'textTransform', 'letterSpacing', 'lineHeight', 'cursor',
      'borderStyle', 'backgroundImage', 'animationName', 'filter', 'zIndex', 'float',
      'listStyleType', 'whiteSpace', 'flexWrap',
    ];
    const snapStyle = (el: Element) => {
      const cs = getComputedStyle(el);
      return STYLE_KEYS.map((k) => (cs as any)[k]).join('|');
    };

    /**
     * Record every attribute name the behavior looks up on this element.
     * The shared helpers in src/core/read-attr.js (readFlag/readAttr) go
     * through getAttribute/hasAttribute too, so wrapping those two plus
     * `dataset` covers every documented way a behavior reads an option.
     */
    const spy = (el: HTMLElement, seen: Set<string>) => {
      const getAttr = Element.prototype.getAttribute.bind(el);
      const hasAttr = Element.prototype.hasAttribute.bind(el);
      (el as any).getAttribute = (n: string) => { seen.add(String(n).toLowerCase()); return getAttr(n); };
      (el as any).hasAttribute = (n: string) => { seen.add(String(n).toLowerCase()); return hasAttr(n); };
      const realDataset = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'dataset')!.get!.call(el);
      const note = (p: string) => seen.add('data-' + p.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()));
      Object.defineProperty(el, 'dataset', {
        configurable: true,
        get: () => new Proxy(realDataset, {
          get(t, p) { if (typeof p === 'string') note(p); return (t as any)[p]; },
          has(t, p) { if (typeof p === 'string') note(p); return p in t; },
        }),
      });
    };

    const host = document.createElement('div');
    host.id = 'attr-probe';
    host.style.cssText = 'position:absolute;left:-9999px;top:0;width:600px';
    document.body.appendChild(host);

    const mk = (extra: string, id: string) =>
      `<${tag} id="${id}" ${token}${extra}>probe</${tag}>`;

    host.innerHTML =
      mk('', 'base') +
      attrs.map((a: any, i: number) =>
        mk(a.bare ? ` ${a.name}` : ` ${a.name}="${a.sample}"`, `p${i}`)).join('');

    // Instrument BEFORE the behaviors run — that is the only window in which
    // the reads happen.
    const seenBy: Set<string>[] = attrs.map((_: any, i: number) => {
      const seen = new Set<string>();
      const el = document.getElementById('p' + i);
      if (el) spy(el as HTMLElement, seen);
      return seen;
    });

    const WB = (window as any).WB;
    // `eager: true` is load-bearing: the live WB.scan is the lazy one
    // (src/core/wb-lazy.js), and this probe host is parked off-screen at
    // left:-9999px, so without it the IntersectionObserver never fires and
    // NOTHING is ever injected.
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
    const baseStyle = baseEl ? snapStyle(baseEl) : '';
    const ignored: string[] = [];
    attrs.forEach((a: any, i: number) => {
      const el = document.getElementById('p' + i);
      const name = a.name.toLowerCase();
      const seen = seenBy[i];

      const renderedDiffers = normalise(baseEl, a.name) !== normalise(el, a.name);
      const styleDiffers = !!el && snapStyle(el) !== baseStyle;
      // `iconPosition` authored with no hyphen lowercases to `iconposition`,
      // and several behaviors accept the data-* spelling as well (#632).
      const wasRead = seen.has(name) || seen.has(name.replace(/-/g, '')) || seen.has('data-' + name);

      if (!renderedDiffers && !styleDiffers && !wasRead) ignored.push(a.name);
    });

    host.remove();
    return ignored;
  }, { token: b.token, tag: b.tag, attrs: b.attrs } as any);
}

test.describe('Every declared attribute reaches the element', () => {
  test('the schema surface is non-empty — the sweep cannot pass vacuously', () => {
    expect(BEHAVIORS.length, 'no behavior schemas with properties found').toBeGreaterThan(50);
    const total = BEHAVIORS.reduce((n, b) => n + b.attrs.length, 0);
    expect(total, 'no declared attributes found').toBeGreaterThan(300);
  });

  for (const b of BEHAVIORS) {
    test(`${b.token}: all ${b.attrs.length} declared attributes take effect`, async ({ page }) => {
      await harness(page);
      const ignored = await ignoredAttributes(page, b);
      expect(
        ignored,
        `${b.token} ignores ${ignored.length}/${b.attrs.length} declared attributes: ${ignored.join(', ')}\n` +
        `Each is declared in ${b.name}.schema.json, documented from it, and written in examples — ` +
        `setting it on <${b.tag} ${b.token}> changed no markup, changed no computed style, and was ` +
        `never read off the host.`,
      ).toEqual([]);
    });
  }
});
