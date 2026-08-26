import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Does every behavior have a default GUI?
 *
 * John asked directly. This measures it rather than reasoning about it: mount
 * every behavior with NO attributes and NO author content -- `<tag x-name>` --
 * and record what a user would actually see.
 *
 * Three honest outcomes, because "renders nothing" is not automatically a bug:
 *
 *   BUILDS      the behavior created child DOM. A default GUI.
 *   PAINTS      no children, but the host itself is visibly styled (a box with
 *               size and a background, border or text). Also a default GUI.
 *   INVISIBLE   nothing. Either a decorator that legitimately needs a host to
 *               act on (x-ripple on a button), or a control that silently does
 *               nothing until configured -- which IS a bug, because the docs
 *               and showcase present it as a thing you can drop in.
 *
 * The census is written to data/default-gui-census.json so the split can be
 * argued about with numbers.
 */

const MODELS = 'src/wb-models';

type Row = { name: string; tag: string; verdict: string; children: number; w: number; h: number; note: string };

function behaviors(): { name: string; tag: string }[] {
  const out: { name: string; tag: string }[] = [];
  for (const file of readdirSync(MODELS)) {
    if (!file.endsWith('.schema.json')) continue;
    let s: any;
    try { s = JSON.parse(readFileSync(join(MODELS, file), 'utf8')); } catch { continue; }
    if (s?.schemaType === 'definition' || s?.schemaType === 'page' || s?.isBase) continue;
    const declared = String(s.schemaFor || file.replace('.schema.json', ''));
    const name = declared.startsWith('x-') ? declared : `x-${declared}`;
    if (!/^x-[a-z0-9][a-z0-9-]*$/.test(name)) continue;
    out.push({ name, tag: String(s?.semanticElement?.tagName || 'div').toLowerCase() });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

const ALL = behaviors();

test('census: which behaviors render a default GUI with no attributes', async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });

  const rows: Row[] = await page.evaluate(async (list) => {
    const WB = (window as any).WB;
    const results: any[] = [];

    for (const b of list) {
      const host = document.createElement('div');
      host.style.cssText = 'position:absolute;left:0;top:0;width:400px';
      document.body.appendChild(host);

      // A replaced element cannot host built DOM; give it nothing else either.
      host.innerHTML = `<${b.tag} ${b.name}></${b.tag}>`;
      const el = host.firstElementChild as HTMLElement;

      let note = '';
      try {
        await WB.scan(host);
      } catch (e: any) {
        note = 'scan threw: ' + (e?.message || e);
      }
      // Let a frame settle so built DOM and CSS both land.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const cs = el ? getComputedStyle(el) : null;
      const r = el ? el.getBoundingClientRect() : { width: 0, height: 0 };
      const children = el ? el.children.length : 0;
      const text = (el?.textContent || '').trim();

      const painted =
        !!cs &&
        r.width > 0 &&
        r.height > 0 &&
        (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
          parseFloat(cs.borderTopWidth) > 0 ||
          text.length > 0);

      results.push({
        name: b.name,
        tag: b.tag,
        verdict: children > 0 ? 'BUILDS' : painted ? 'PAINTS' : 'INVISIBLE',
        children,
        w: Math.round(r.width),
        h: Math.round(r.height),
        note,
      });

      host.remove();
    }
    return results;
  }, ALL);

  const by = (v: string) => rows.filter((r) => r.verdict === v);
  const builds = by('BUILDS');
  const paints = by('PAINTS');
  const invisible = by('INVISIBLE');

  writeFileSync(
    'data/default-gui-census.json',
    JSON.stringify({ total: rows.length, builds: builds.length, paints: paints.length, invisible: invisible.length, rows }, null, 2),
  );

  const lines = [
    '',
    `DEFAULT GUI CENSUS — ${rows.length} behaviors mounted with no attributes`,
    `  BUILDS    ${String(builds.length).padStart(3)}  created child DOM`,
    `  PAINTS    ${String(paints.length).padStart(3)}  no children, but visibly styled`,
    `  INVISIBLE ${String(invisible.length).padStart(3)}  nothing rendered`,
    '',
    'INVISIBLE:',
    ...invisible.map((r) => `  ${r.name.padEnd(22)} <${r.tag}>  ${r.w}x${r.h}${r.note ? '  ' + r.note : ''}`),
    '',
  ];
  console.log(lines.join('\n'));

  // The census must actually have run. Everything else is reported, not gated:
  // a decorator with no default GUI is correct, and deciding which of these are
  // decorators is a judgement to make with the numbers in hand, not a threshold
  // to guess at now.
  expect(rows.length, 'no behaviors were mounted').toBeGreaterThan(100);
  expect(builds.length + paints.length, 'not one behavior rendered anything').toBeGreaterThan(0);
});
