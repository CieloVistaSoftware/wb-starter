/**
 * EVERY REACHABLE BEHAVIOR HAS A DOC THAT NAMES ITS x- TOKEN
 * ==========================================================
 * #1093. John: "I want to make sure all our behaviors have documentation — all
 * up to date and all listed as x-behavior."
 *
 * Three guarantees, none previously enforced anywhere:
 *   1. a reachable behavior has a doc
 *   2. that doc names `x-<behavior>`, so the authoring form is findable
 *   3. the doc says what an attribute DOES, not that it is read
 *
 * WHY "REACHABLE" AND NOT "ALL"
 * -----------------------------
 * `npm run audit:behavior-registry` reports 221 behavior names across SIX
 * selector maps, of which 63 ship with a module and/or schema but no selector —
 * nothing in markup can trigger them. Documenting those would document something
 * a reader cannot use. So this asserts over what is reachable, and #831 (one
 * registry, not six) is the prerequisite for "all" to have a single meaning.
 *
 * Measured while writing this: `tag-map.js` alone holds 146 names. Reading one
 * registry and calling it the inventory is exactly how #1056 happened — the
 * showcase reads one of two, so 35 working behaviours have no row.
 *
 * WHY IT STARTS RED
 * -----------------
 * 6 behaviors have no doc, 19 docs carry 135 `Read by foo()` filler rows, and 13
 * teach `<tag x-tag>` — a form #746 proved can SUPPRESS the behavior. This gate
 * cannot go green today. It lands with those in
 * data/test-baseline-failures.json and shrinks as they are fixed: a ratchet
 * (#1044), not a wall. A gate introduced over pre-existing debt is either a
 * ratchet or it is bypassed, and a bypassed gate is #743's lesson.
 *
 * Each failure names the behavior and the missing piece. A count is not
 * actionable; a list is.
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DOCS = path.join(ROOT, 'docs', 'behaviors');

/**
 * Reachable behaviors as { token, name } — and the distinction is the whole
 * point.
 *
 * tag-map.js maps a SELECTOR to a BEHAVIOR:
 *
 *   'x-progressbar':   'progress'        <- an alias
 *   'x-drawer-layout': 'drawerLayout'    <- kebab selector, camelCase module
 *   'button':          'button'
 *
 * The doc file is named for the behavior (the VALUE); the authoring token comes
 * from the selector (the KEY). The first draft of this gate looked docs up by
 * key and reported `x-progressbar` and `x-drawer-layout` as undocumented. Both
 * are documented — in progress.md and drawerLayout.md. Two false accusations,
 * caught by opening the files instead of trusting the count.
 */
function reachableBehaviors(): Array<{ token: string; name: string; autoInjected: boolean }> {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'core', 'tag-map.js'), 'utf8');
  const out = new Map<string, { token: string; name: string; autoInjected: boolean }>();
  for (const m of src.matchAll(/^\s*'([^']+)'\s*:\s*'([^']+)'/gm)) {
    const [, key, value] = m;
    // A typed input variant is a host selector, not a behavior with its own doc.
    if (key.includes('[type=')) continue;
    // A key WITHOUT the x- prefix is a tag: <button> injects `button` on its own.
    // A key WITH it is opted into by attribute and has no tag that implies it.
    const autoInjected = !/^\[?x-/.test(key);
    const token = key.replace(/^\[/, '').replace(/\]$/, '').replace(/^x-/, '').toLowerCase();
    const name = value.trim();
    if (!/^[a-z][a-z0-9-]*$/.test(token)) continue;
    if (!/^[a-zA-Z][a-zA-Z0-9.-]*$/.test(name)) continue;
    out.set(`${token}|${name}`, { token, name, autoInjected });
  }
  return [...out.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fenced code blocks only — what a doc TEACHES, not what it discusses.
 *
 * Six of the seven "redundant form" findings in the first run were the WARNING
 * against it:
 *
 *   > Do not write `<button x-button>`. The element already injects it, and the
 *   > redundant attribute can suppress the behavior (#746).
 *
 * The gate flagged the sentence telling readers not to do the thing, as the
 * thing. That is #1041, #1049, #1085 and #1090 again — prose read as source
 * truth, this time inside the gate written to enforce documentation quality.
 */
function codeBlocks(md: string): string {
  return (md.match(/```[\s\S]*?```/g) || []).join('\n');
}

const behaviors = reachableBehaviors();
const docFor = (n: string) => path.join(DOCS, `${n}.md`);
const read = (n: string) => {
  try { return fs.readFileSync(docFor(n), 'utf8'); } catch { return null; }
};

test.describe('#1093 — behavior documentation coverage', () => {
  test('the inventory is real, not an empty list', () => {
    // Without this the three checks below pass over nothing — the #1091 shape,
    // where a gate reports success for having examined no subjects.
    expect(behaviors.length, 'read no behaviors out of tag-map.js').toBeGreaterThan(100);
    expect(fs.existsSync(DOCS), 'docs/behaviors is missing').toBe(true);
  });

  test('every reachable behavior has a doc', () => {
    const missing = behaviors.filter((b) => read(b.name) === null)
      .map((b) => `x-${b.token} -> docs/behaviors/${b.name}.md`);
    expect(
      missing,
      `${missing.length} behavior(s) reachable from markup with no docs/behaviors/<name>.md:\n  `
        + missing.join('\n  '),
    ).toEqual([]);
  });

  test('every doc names its x- token', () => {
    // The token a reader must TYPE, not the module name: x-drawer-layout is the
    // selector, drawerLayout is the file. A doc naming only the latter teaches an
    // attribute HTML can never match, which is #620's bug.
    const silent = behaviors
      .filter((b) => read(b.name) !== null)
      .filter((b) => !new RegExp(`x-${b.token}\\b`, 'i').test(read(b.name)!))
      .map((b) => `docs/behaviors/${b.name}.md (never says x-${b.token})`);
    expect(
      silent,
      `${silent.length} doc(s) never mention their x- token, so a reader cannot find the `
        + `authoring form:\n  ` + silent.join('\n  '),
    ).toEqual([]);
  });

  test('no attribute is described as "Read by foo()"', () => {
    const filler: string[] = [];
    for (const { name: n } of behaviors) {
      const src = read(n);
      if (!src) continue;
      const rows = (src.match(/Read by \w+\(\)/g) || []).length;
      if (rows) filler.push(`docs/behaviors/${n}.md (${rows} attribute row${rows === 1 ? '' : 's'})`);
    }
    expect(
      filler,
      'These say an attribute IS READ, not what it does, what its values mean, or '
        + `where the effect shows (#749):\n  ${filler.join('\n  ')}`,
    ).toEqual([]);
  });

  test('no doc teaches the redundant <tag x-tag> form', () => {
    const redundant = behaviors.filter((b) => {
      // Only where the TAG already injects it. `x-span` is attribute-only —
      // nothing about <span> implies a ripple — so <span x-span> is required,
      // not redundant. Flagging it would have told a reader to delete the one
      // thing making the example work.
      if (!b.autoInjected) return false;
      const src = read(b.name);
      if (src === null) return false;
      return new RegExp(`<${b.token}[^>]*\\sx-${b.token}\\b`, 'i').test(codeBlocks(src));
    }).map((b) => `docs/behaviors/${b.name}.md`);
    expect(
      redundant,
      'autoInject already applies the behavior from the tag, and #746 proved the '
        + 'redundant attribute can SUPPRESS it — <button x-button> was dead for three '
        + `releases:\n  ${redundant.join('\n  ')}`,
    ).toEqual([]);
  });
});
