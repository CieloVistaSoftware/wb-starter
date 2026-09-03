import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * REWRITTEN (#910).
 *
 * pages/behaviors.html once used `data-*` attributes on ~20 demo elements -- a
 * Law 11 violation. Every one of those behaviours reads the PLAIN attribute, so
 * each demo silently rendered with defaults. This spec is the gate that keeps
 * that fixed.
 *
 * WHAT IT USED TO DO, AND WHY THAT STOPPED WORKING
 *
 * It drove the page: reveal a behaviour, then assert on its demo. That was
 * written when /?page=behaviors rendered every demo at once with hand-authored
 * copy, so the assertions latched onto that copy -- ">= 4 inline [x-alert]",
 * a dialog containing "Modal Dialog", a badge labelled "Pill Badge".
 *
 * The page is a searchable browser now, showing ONE schema-generated example at
 * a time. `reveal()` was adapted; the assertions under it were not. They kept
 * asserting furniture that no longer exists, and 15 of 23 tests failed while the
 * rule they were meant to guard was perfectly satisfied:
 *
 *   grep -o 'data-[a-z-]*=' pages/behaviors.html | wc -l   ->   0
 *
 * A gate that fails when the rule HOLDS teaches people to ignore it.
 *
 * WHAT IT DOES NOW
 *
 * Asserts the rule, not the furniture: no behaviour-config `data-*` attribute
 * survives anywhere on this page, in source or after rendering. That is immune
 * to the page changing shape again, which it already has once.
 *
 * The static half of this also runs in tests/compliance/no-data-attributes.spec.ts.
 * That gate had `behaviors.html` on an ARCHIVED skip list matched by BASENAME,
 * so the live page was excluded through a filename collision -- fixed alongside
 * this rewrite (#910).
 */

/** Framework state hooks, not behaviour config. Same set no-data-attributes.spec.ts ratifies. */
const ALLOWED = new Set(['data-theme', 'data-code-width', 'data-x-expected-errors', 'data-browse-token']);

test.describe('Behaviors page: no data-* behaviour config (#910)', () => {
  test('the page source carries no behaviour-config data-* attribute', () => {
    const file = path.join(process.cwd(), 'pages', 'behaviors.html');
    const src = fs.readFileSync(file, 'utf8');
    const found = [...src.matchAll(/\s(data-[a-z0-9-]+)\s*=/gi)]
      .map((m) => m[1].toLowerCase())
      .filter((a) => !ALLOWED.has(a));
    expect(
      [...new Set(found)],
      'pages/behaviors.html must configure behaviours with plain attributes (Law 11). ' +
      'Each of these has a plain equivalent the behaviour actually reads; a data-* ' +
      'spelling renders the demo with defaults and looks like the behaviour is broken.',
    ).toEqual([]);
  });

  test('nothing on the RENDERED page configures a behaviour through data-*', async ({ page }) => {
    await page.goto('/?page=behaviors');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
    await page.waitForFunction(() => (window as any).WBSite?.currentPage, { timeout: 20000 });

    // Reveal a spread of behaviours so generated examples are actually in the DOM.
    // The source check above cannot see these -- they are built at runtime.
    for (const token of ['x-alert', 'x-badge', 'x-tooltip', 'x-toast', 'x-truncate']) {
      await page.fill('#behaviors-search', token);
      const row = `.behaviors-search-results__row[data-browse-token="${token}"]`;
      const found = await page.locator(row).first().waitFor({ state: 'attached', timeout: 8000 })
        .then(() => true).catch(() => false);
      if (found) await page.locator(row).first().click();
      await page.waitForTimeout(200);
    }

    // Scoped to what #910 is actually about: an element that CARRIES a behaviour,
    // wearing a `data-*` whose name is a property that behaviour declares. That
    // is the failure -- `data-dismissible` instead of `dismissible` renders the
    // demo with defaults.
    //
    // A blanket "no data-* on any rendered element" check was tried first and is
    // wrong: it flags framework internals that are not behaviour config at all --
    // `data-page` (router state), `data-language` (code blocks),
    // `data-wb-behavior-css` (the JIT stylesheet loader), and the search rows'
    // own `data-label`/`data-form` browse metadata. Those names are set BY the
    // framework, not by an author configuring a behaviour through the wrong
    // spelling, and failing on them would make this gate noise.
    const declared = await page.evaluate(async () => {
      const res = await fetch('/data/schema-index.json').catch(() => null);
      if (!res || !res.ok) return null;
      const idx = await res.json().catch(() => null);
      if (!idx) return null;
      const out: Record<string, string[]> = {};
      for (const [name, entry] of Object.entries<any>(idx.schemas || idx)) {
        const props = entry && entry.properties ? Object.keys(entry.properties) : [];
        if (props.length) out[name] = props.map((p) => p.toLowerCase());
      }
      return out;
    });
    test.skip(!declared, 'schema-index.json unavailable; nothing to check against');

    const offenders = await page.evaluate((decl: Record<string, string[]>) => {
      const out: string[] = [];
      document.querySelectorAll('*').forEach((el) => {
        const behaviors = Array.from(el.attributes)
          .map((a) => a.name)
          .filter((n) => n.startsWith('x-') && !['x-schema', 'x-ignore', 'x-behavior'].includes(n))
          .map((n) => n.slice(2));
        if (!behaviors.length) return;
        const props = new Set(behaviors.flatMap((b) => decl[b] || []));
        if (!props.size) return;
        for (const a of Array.from(el.attributes)) {
          if (!a.name.startsWith('data-')) continue;
          const bare = a.name.slice(5).replace(/-/g, '').toLowerCase();
          const hit = [...props].some((pr) => pr.replace(/-/g, '') === bare);
          if (hit) out.push(`<${el.tagName.toLowerCase()} ${behaviors.map((b) => 'x-' + b).join(' ')} ${a.name}>`);
        }
      });
      return [...new Set(out)];
    }, declared as any);

    expect(
      offenders,
      'A rendered element is configured through data-*. Behaviours read the plain ' +
      'attribute, so this renders with defaults -- the failure mode #910 exists to catch.',
    ).toEqual([]);
  });
});
