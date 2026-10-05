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
 * WHAT IT DOES NOT COVER: every case is hosted on a <div x-behavior>. A
 * behavior that only builds on its native host (<input>, <textarea>, ...)
 * builds nothing here in either spelling and compares equal. Switching the
 * Behaviors page to camelCase broke exactly those: input inputType, switch
 * labelPosition, progress showValue, cardhorizontal imagePosition and 17
 * behaviors' variants -- the #1125 migration, which is why #1526 stays open.
 */
const root = process.cwd();
const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

type Case = { behavior: string; prop: string; value: string | null };

function cases(): Case[] {
  const dir = path.join(root, 'src', 'wb-models');
  const out: Case[] = [];
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.schema.json')).sort()) {
    let s: any;
    try { s = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { continue; }
    if (!s.schemaFor || s.schemaFor === 'behaviors') continue;
    for (const [prop, def] of Object.entries<any>(s.properties || {})) {
      if (!/[A-Z]/.test(prop)) continue;
      if (def.type === 'array' || def.type === 'object') continue;
      let value: string | null;
      if (def.type === 'boolean') value = def.default === true ? 'false' : null; // null = bare attribute
      else if (Array.isArray(def.enum)) value = String(def.enum.find((v: unknown) => v !== def.default) ?? def.enum[0]);
      else if (def.type === 'number' || def.type === 'integer') value = '3';
      else if (/href|url|src/i.test(prop)) value = 'https://example.com/x';
      else value = 'Sample';
      out.push({ behavior: s.schemaFor, prop, value });
    }
  }
  return out;
}

test('every multi-word option builds the same in camelCase as dashed (#1526)', async ({ page }) => {
  test.setTimeout(120_000);
  const all = cases();
  expect(all.length, 'no multi-word options found -- the scan is looking in the wrong place').toBeGreaterThan(20);

  const attr = (name: string, value: string | null) => (value === null ? ` ${name}` : ` ${name}="${value}"`);
  // The dashed form twice: if those two differ, the behavior's output is not
  // deterministic (random particles, timestamps) and a camelCase difference
  // would prove nothing, so it is reported separately rather than as a gap.
  const html = all.map((c, i) => [
    `<div id="k${i}"><div x-${c.behavior}${attr(kebab(c.prop), c.value)}>Content</div></div>`,
    `<div id="r${i}"><div x-${c.behavior}${attr(kebab(c.prop), c.value)}>Content</div></div>`,
    `<div id="c${i}"><div x-${c.behavior}${attr(c.prop, c.value)}>Content</div></div>`,
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
    for (let i = 0; i < n; i++) if ((document.getElementById(`k${i}`)!.firstElementChild as Element).hasAttribute('x-ready')) ok++;
    return ok;
  }, all.length);
  expect(built, 'most cases must actually be built before they are compared').toBeGreaterThan(all.length * 0.75);

  const differing = await page.evaluate((n: number) => {
    // Generated ids differ by construction, and so does the option's own
    // attribute name: show-close vs showclose (HTML lowercases showClose).
    // Fold every attribute name to lowercase-without-dashes; everything else
    // the behavior built must match.
    const norm = (el: Element) => el.innerHTML
      .replace(/\s(id|for|aria-[a-z]+|data-[a-z-]*id)="[^"]*"/g, '')
      .replace(/\s([a-zA-Z][a-zA-Z-]*)(?=[=\s>/])/g, (_m, name: string) => ' ' + name.toLowerCase().replace(/-/g, ''));
    const gaps: number[] = [];
    const unstable: number[] = [];
    for (let i = 0; i < n; i++) {
      const k = norm(document.getElementById(`k${i}`)!);
      if (k !== norm(document.getElementById(`r${i}`)!)) { unstable.push(i); continue; }
      if (k !== norm(document.getElementById(`c${i}`)!)) gaps.push(i);
    }
    return { gaps, unstable };
  }, all.length);

  const name = (i: number) => `${all[i].behavior}.${all[i].prop}`;
  // Not a failure: the comparison cannot speak for these. Printed so the
  // coverage this test does NOT have is visible.
  if (differing.unstable.length) console.log(`#1526: not comparable (non-deterministic build): ${differing.unstable.map(name).join(', ')}`);
  expect(differing.unstable.length, 'most options must be comparable, or this test proves nothing').toBeLessThan(all.length / 4);
  const report = differing.gaps.map(name);
  expect(report, 'these options build differently when written camelCase -- the behavior reads only the dashed spelling').toEqual([]);
});
