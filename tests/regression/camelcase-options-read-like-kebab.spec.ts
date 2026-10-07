import { test, expect } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';
import fs from 'node:fs';
import path from 'node:path';

/**
 * #1526: the Behaviors page wrote every multi-word option dashed
 * (show-close="false") because its comment said behaviors never read the
 * camelCase name. #1125 makes camelCase canonical and the page is the most
 * copied markup in the repo, so it must write showClose -- which is only safe
 * if every behavior reads the camelCase spelling exactly as it reads the
 * dashed one.
 *
 * This renders every multi-word schema option both ways and compares what
 * the behavior builds. Any difference is a behavior that reads only the
 * dashed spelling.
 *
 * NATIVE HOSTS (#1125): it first rendered every case on a <div x-behavior>
 * only. A behavior that builds on its native host (<input>, <textarea>,
 * <progress>, ...) built nothing there in either spelling and compared
 * equal, which is how switching the page to camelCase broke input inputType,
 * switch labelPosition, progress showValue and cardhorizontal imagePosition
 * while this test stayed green. Every case is now ALSO rendered on each
 * native host src/core/tag-map.js's nativeMap gives its behavior, written the
 * way that host is authored: the bare tag, no x- attribute, auto-injected.
 *
 * HTML lowercases attribute names, so the camelCase spelling reaches the
 * behavior as `showclose`. readAttr/readFlag look it up as `showClose`, which
 * getAttribute lower-cases on an HTML element; that is what makes it found.
 */
const root = process.cwd();
const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const camel = (s: string) => s.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
// Platform attributes keep their dashes; the x- prefix is a behavior's name.
const PLATFORM = /^(aria|data|x)-/;

type Case = { behavior: string; prop: string; value: string | null; host: string };

/**
 * behavior -> its native host selectors, read from tag-map.js's nativeMap.
 * Parsed as text rather than imported: it is the browser module the runtime
 * itself loads, and this spec only needs its keys and values.
 */
function nativeHosts(): Map<string, string[]> {
  const src = fs.readFileSync(path.join(root, 'src', 'core', 'tag-map.js'), 'utf8');
  const start = src.indexOf('export const nativeMap');
  const block = src.slice(start, src.indexOf('};', start));
  const out = new Map<string, string[]>();
  for (const m of block.matchAll(/^\s*'([^']+)':\s*'([^']+)'/gm)) {
    out.set(m[2], [...(out.get(m[2]) || []), m[1]]);
  }
  return out;
}

function cases(): Case[] {
  const dir = path.join(root, 'src', 'wb-models');
  const hosts = nativeHosts();
  const out: Case[] = [];
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.schema.json')).sort()) {
    let s: any;
    try { s = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { continue; }
    if (!s.schemaFor || s.schemaFor === 'behaviors') continue;
    for (const [declared, def] of Object.entries<any>(s.properties || {})) {
      if (PLATFORM.test(declared)) continue;
      // A dashed declaration is swept under its camelCase name, so a schema
      // that still declares one is exercised, not skipped -- and is failed on
      // its own by the declaration test below.
      const prop = camel(declared);
      if (!/[A-Z]/.test(prop)) continue;
      if (def.type === 'array' || def.type === 'object') continue;
      let value: string | null;
      if (def.type === 'boolean') value = def.default === true ? 'false' : null; // null = bare attribute
      else if (Array.isArray(def.enum)) value = String(def.enum.find((v: unknown) => v !== def.default) ?? def.enum[0]);
      else if (def.type === 'number' || def.type === 'integer') value = '3';
      else if (/href|url|src/i.test(prop)) value = 'https://example.com/x';
      else value = 'Sample';
      for (const host of ['div', ...(hosts.get(s.schemaFor) || [])]) out.push({ behavior: s.schemaFor, prop, value, host });
    }
  }
  return out;
}

// What goes inside a native host so its behavior has something to build on.
const BODY: Record<string, string> = {
  select: '<option>One</option><option>Two</option>',
  table: '<thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr><tr><td>2</td></tr></tbody>',
  details: '<summary>Summary</summary>Content',
  textarea: '',
};
const VOID = new Set(['input', 'img']);

/** One case's markup, with the option under test spelled `name`. */
function markup(c: Case, name: string): string {
  const opt = c.value === null ? ` ${name}` : ` ${name}="${c.value}"`;
  if (c.host === 'div') return `<div x-${c.behavior}${opt}>Content</div>`;
  const [, tag, typeAttr] = c.host.match(/^([a-z]+)(?:\[(type="[^"]*")\])?$/) || [];
  if (!tag) throw new Error(`nativeMap selector this spec cannot author: ${c.host}`);
  const open = `<${tag}${typeAttr ? ' ' + typeAttr : ''}${opt}>`;
  return VOID.has(tag) ? open : `${open}${BODY[tag] ?? 'Content'}</${tag}>`;
}

test('no schema declares a multi-word property with a dash (#1125)', () => {
  // ATTRIBUTE-NAMING-STANDARD.md: camelCase is the one spelling. A dashed
  // schema key (per-page) is a second name for the concept that the camelCase
  // schemas beside it do not use; #1125 found 38 across 24 schemas.
  const dir = path.join(root, 'src', 'wb-models');
  const dashed: string[] = [];
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.schema.json')).sort()) {
    let s: any;
    try { s = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { continue; }
    if (!s.schemaFor) continue;
    for (const k of Object.keys(s.properties || {})) if (k.includes('-') && !PLATFORM.test(k)) dashed.push(`${f}: ${k}`);
  }
  expect(dashed, 'declare these under their camelCase name').toEqual([]);
});

test('every multi-word option builds the same in camelCase as dashed, on every host (#1526, #1125)', async ({ page }) => {
  test.setTimeout(180_000);
  const all = cases();
  expect(all.length, 'no multi-word options found -- the scan is looking in the wrong place').toBeGreaterThan(20);
  expect(all.filter((c) => c.host !== 'div').length, 'no native-host cases -- nativeMap was not read').toBeGreaterThan(10);

  // The dashed form twice: if those two differ, the behavior's output is not
  // deterministic (random particles, timestamps) and a camelCase difference
  // would prove nothing, so it is reported separately rather than as a gap.
  const html = all.map((c, i) => [
    `<div id="k${i}">${markup(c, kebab(c.prop))}</div>`,
    `<div id="r${i}">${markup(c, kebab(c.prop))}</div>`,
    `<div id="c${i}">${markup(c, c.prop)}</div>`,
  ].join('')).join('');
  await injectAndScan(page, html);
  // Build every case now. The lazy runtime builds only what is near the
  // viewport, and two UNBUILT copies compare equal -- which passed the very
  // gap this test exists to catch (navbar.brandHref) on one run and not the next.
  const built = await page.evaluate(async (n: number) => {
    const WB = (window as any).WB;
    for (let i = 0; i < n; i++) {
      for (const p of ['k', 'r', 'c']) await WB.scan(document.getElementById(`${p}${i}`), { eager: true });
    }
    await WB.settled?.();
    let ok = 0;
    // A native host may be wrapped by what it builds, so the ready mark is
    // looked for anywhere in the case, not only on its first child.
    for (let i = 0; i < n; i++) if (document.getElementById(`k${i}`)!.querySelector('[x-ready]')) ok++;
    return ok;
  }, all.length);
  expect(built, 'most cases must actually be built before they are compared').toBeGreaterThan(all.length * 0.75);

  const differing = await page.evaluate((n: number) => {
    // Generated ids differ by construction, and so does the option's own
    // attribute name: show-close vs showclose (HTML lowercases showClose).
    // Fold every attribute name to lowercase-without-dashes; everything else
    // the behavior built must match. Each element's attributes are compared
    // as a SET: on a native host the camelCase spelling can BE the platform
    // attribute (<textarea maxLength> is `maxlength`), which the behavior then
    // also sets, so the dashed case carries max-length AND maxlength while the
    // camelCase one carries one maxlength -- the same element, folded.
    const norm = (root: Element) => {
      const out: string[] = [];
      const walk = (n: Node) => {
        if (n.nodeType === Node.TEXT_NODE) { out.push(n.textContent || ''); return; }
        if (n.nodeType !== Node.ELEMENT_NODE) return;
        const el = n as Element;
        const attrs = new Set<string>();
        for (const a of Array.from(el.attributes)) {
          if (/^(id|for|aria-[a-z]+|data-[a-z-]*id)$/.test(a.name)) continue;
          attrs.add(`${a.name.toLowerCase().replace(/-/g, '')}=${a.value}`);
        }
        out.push(`<${el.tagName} ${[...attrs].sort().join(' ')}>`);
        el.childNodes.forEach(walk);
        out.push(`</${el.tagName}>`);
      };
      root.childNodes.forEach(walk);
      return out.join('');
    };
    const gaps: number[] = [];
    const unstable: number[] = [];
    const detail: Record<number, { dashed: string; camel: string }> = {};
    for (let i = 0; i < n; i++) {
      const k = norm(document.getElementById(`k${i}`)!);
      if (k !== norm(document.getElementById(`r${i}`)!)) { unstable.push(i); continue; }
      const c = norm(document.getElementById(`c${i}`)!);
      if (k !== c) { gaps.push(i); detail[i] = { dashed: k, camel: c }; }
    }
    return { gaps, unstable, detail };
  }, all.length);

  const name = (i: number) => `${all[i].behavior}.${all[i].prop}${all[i].host === 'div' ? '' : ` on <${all[i].host}>`}`;
  // Not a failure: the comparison cannot speak for these. Printed so the
  // coverage this test does NOT have is visible.
  if (differing.unstable.length) console.log(`#1526: not comparable (non-deterministic build): ${differing.unstable.map(name).join(', ')}`);
  expect(differing.unstable.length, 'most options must be comparable, or this test proves nothing').toBeLessThan(all.length / 4);
  // #1670: a gap that shows only on CI cannot be diagnosed from its name
  // alone, so print what each spelling actually built.
  for (const i of differing.gaps) {
    console.log(`#1526 gap ${name(i)}:\n  dashed: ${differing.detail[i].dashed}\n  camel:  ${differing.detail[i].camel}`);
  }
  const report = differing.gaps.map(name);
  expect(report, 'these options build differently when written camelCase -- the behavior reads only the dashed spelling').toEqual([]);
});
