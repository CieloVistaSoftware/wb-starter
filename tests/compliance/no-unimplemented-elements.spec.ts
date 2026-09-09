import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Every custom element in the markup must actually be implemented.
 *
 * WHY THIS DID NOT EXIST, AND WHAT IT COST
 *
 * Removing the component tags turned up 94 distinct `<wb-*>` tags written
 * across pages/, docs/, demos/ and the project template that were registered
 * NOWHERE — `<div>`, `<code>`, `<div>`, `<div>`,
 * `<div>`, `<div>` and 88 more. They had never done anything. They
 * parse as HTMLUnknownElement, render inline with no styling and no behavior,
 * and throw nothing.
 *
 * John: "I'm surprised we had so many unfinished work in there. That means our
 * unit tests had gaps."
 *
 * The gap is a direction, not a missing assertion. The suite tested behaviors
 * it already knew about: take `x-tooltip`, apply it, check the tooltip
 * appears. Nothing ever went the other way — enumerate what the markup
 * actually USES and ask whether each of those things exists. So markup could
 * reference an element nobody had built, in a file nobody tested, and every
 * test still passed. Worse, it spread: `packages/create-wb-starter/template/`
 * carried these tags too, so every new project was scaffolded with a
 * vocabulary that does nothing.
 *
 * The mirrored direction — behaviors that ship but nothing can reach — is
 * covered by scripts/audit-behavior-registry.mjs, which currently reports 69.
 * Together they close the loop: nothing used-but-missing, nothing
 * present-but-unusable.
 *
 * WHAT COUNTS AS A CUSTOM ELEMENT
 *
 * Any tag containing a hyphen. That is the HTML rule for a valid custom
 * element name, so it needs no allowlist of prefixes — `[x-cardhero]` was as
 * much a component as `.x-card`, and a `wb-`-shaped check would have missed
 * all 33 unprefixed aliases.
 */

const ROOT = process.cwd();
const SCAN = ['pages', 'src', 'demos', 'public', 'docs', 'packages', 'index.html'];
const EXT = new Set(['.html', '.md']);
// docs/_today holds dated working notes and audits. They are a record of what
// was true on a given day, so rewriting their markup would falsify the record.
const SKIP = new Set(['node_modules', '.git', 'out', 'dist', 'lib', 'vendor', '_today']);

/**
 * Tags that contain a hyphen but are not custom elements, or are supplied by
 * something other than this project's registries.
 */
const ALLOWED = new Set<string>([
  // Standard HTML that happens to contain a hyphen in some specs/polyfills.
  'font-face',
  // ANGULAR's component selector, not ours (#922). demos/frameworks.html
  // JIT-bootstraps a real Angular app whose component declares
  // `selector: 'angular-demo'`, and Angular registers and replaces the element
  // at runtime -- so this gate's premise (an unregistered hyphenated tag is an
  // inert HTMLUnknownElement) does not hold for it. Covered by this set's own
  // remit: tags "supplied by something other than this project's registries".
  //
  // This is the OPPOSITE case to <button-tooltip>, which sat here until #921:
  // that was OUR element, dead and unused, allowlisted to quiet the gate.
  // Allowlisting hid a real finding there. Here it states a true fact about
  // scope -- we neither own nor can register another framework's components.
  'angular-demo',
]);

function walk(target: string, out: string[] = []): string[] {
  let st: fs.Stats;
  try { st = fs.statSync(target); } catch { return out; }
  if (st.isFile()) {
    if (EXT.has(path.extname(target))) out.push(target);
    return out;
  }
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    walk(path.join(target, entry.name), out);
  }
  return out;
}

/** Read a named object literal out of a source file and evaluate it. */
function readObjectLiteral(file: string, name: string): Record<string, string> {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const decl = new RegExp(`(?:export\\s+)?const\\s+${name}\\s*=\\s*\\{`).exec(src);
  if (!decl) return {};
  const start = decl.index + decl[0].length - 1;
  let depth = 0, inString: string | null = null, inLine = false, inBlock = false;
  for (let i = start; i < src.length; i++) {
    const c = src[i], next = src[i + 1];
    if (inLine) { if (c === '\n') inLine = false; continue; }
    if (inBlock) { if (c === '*' && next === '/') { inBlock = false; i++; } continue; }
    if (inString) {
      if (c === '\\') { i++; continue; }
      if (c === inString) inString = null;
      continue;
    }
    if (c === '/' && next === '/') { inLine = true; i++; continue; }
    if (c === '/' && next === '*') { inBlock = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inString = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      // eslint-disable-next-line no-new-func
      if (depth === 0) return new Function(`return (${src.slice(start, i + 1)});`)();
    }
  }
  return {};
}

/**
 * Every registry, not just the obvious one. Reading `tag-map.js` alone is how
 * the component migration missed 18 tags that `wb-lazy.js` registers on its
 * own — the tool written to find this class of bug had the bug.
 */
function registeredElements(): Set<string> {
  const maps = [
    ['src/core/tag-map.js', 'elementMap'],
    ['src/core/tag-map.js', 'nativeMap'],
    ['src/core/wb-lazy.js', 'WB_LAZY_ONLY_ELEMENTS'],
  ] as const;

  const out = new Set<string>();
  for (const [file, name] of maps) {
    for (const selector of Object.keys(readObjectLiteral(file, name))) {
      out.add(selector.replace(/\[.*\]$/, '').toLowerCase());
    }
  }
  return out;
}

/**
 * #1085 — an element NAME in prose is not an element.
 *
 * This check reported `<x-demo>` as an unregistered element used in markup, and
 * blocked a release with it. There is no such tag anywhere in the repo. The one
 * match was a JavaScript comment in public/doc-viewer.html:
 *
 *   // (<div x-demo>, 415 of them, zero <x-demo>). `pending` is therefore
 *
 * A comment stating that there are ZERO of something was counted as one of it.
 *
 * That is the third time this repo has read prose as source truth: #1041 (any
 * file containing "#1234" counted as pending work on that issue — the state tool
 * misreported three issues because of its own comments about those three issues)
 * and #1049 (a literal 0x08 in a comment killing four checks).
 *
 * DELIBERATELY CONSERVATIVE
 *
 * Only full-line `//` comments are stripped, never a trailing one. `//` also
 * appears inside every absolute URL, and cutting from `https://` to end of line
 * would delete real markup sitting after it on that line — trading a false
 * positive for a false NEGATIVE, which in a gate is the worse direction.
 *
 * Fenced code blocks in .md are NOT stripped, on purpose. A document teaching a
 * tag that does not exist is exactly the defect this check is for (#753): 29 doc
 * files were once teaching `<figure x-figure>` and friends.
 */
export function stripCommentary(src: string, ext: string): string {
  // Blank out rather than delete, so any offset or line number stays truthful.
  const blank = (s: string) => s.replace(/[^\n]/g, ' ');

  let out = src.replace(/<!--[\s\S]*?-->/g, blank);

  if (ext === '.html') {
    // Only inside <script>: elsewhere `/* */` is CSS and `//` is a URL.
    out = out.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, (_m, open, body, close) =>
      open
      + body
        .replace(/\/\*[\s\S]*?\*\//g, blank)
        .replace(/^[ \t]*\/\/[^\n]*/gm, blank)
      + close);
  }

  return out;
}

test.describe('No unimplemented custom elements', () => {
  test('every hyphenated tag in the markup resolves to something real', () => {
    const registered = registeredElements();
    const offenders = new Map<string, { count: number; files: Set<string> }>();

    for (const target of SCAN) {
      for (const file of walk(path.join(ROOT, target))) {
        // #1085: comments blanked first — a tag NAME in prose is not a tag.
        const src = stripCommentary(fs.readFileSync(file, 'utf8'), path.extname(file));
        for (const m of src.matchAll(/<([a-z][a-z0-9]*-[a-z0-9-]*)(?=[\s/>])/gi)) {
          const tag = m[1].toLowerCase();
          if (ALLOWED.has(tag) || registered.has(tag)) continue;
          if (!offenders.has(tag)) offenders.set(tag, { count: 0, files: new Set() });
          const rec = offenders.get(tag)!;
          rec.count++;
          rec.files.add(path.relative(ROOT, file));
        }
      }
    }

    const report = [...offenders.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([tag, r]) => `  <${tag}>  ${r.count}×  e.g. ${[...r.files][0]}`);

    expect(
      report,
      `${offenders.size} custom element(s) appear in markup but are registered nowhere.\n\n` +
      `A hyphenated tag with no registration parses as HTMLUnknownElement: it renders\n` +
      `inline, unstyled, with no behavior, and throws nothing. Tests that exercise known\n` +
      `behaviors cannot see it, because the failure is in markup nobody asserted on.\n\n` +
      `This is how 94 such tags accumulated — including in\n` +
      `packages/create-wb-starter/template/, so every new project inherited them.\n\n` +
      `Either implement it, or write the element it was standing in for.\n\n${report.join('\n')}\n`,
    ).toEqual([]);
  });

  test('the check is not vacuous — it scans real files and knows real elements', () => {
    // A silently-empty scan would report success forever.
    const files = SCAN.flatMap((t) => walk(path.join(ROOT, t)));
    expect(files.length, 'scanned no files').toBeGreaterThan(50);
    expect(registeredElements().size, 'read no registries').toBeGreaterThan(10);
  });

  /**
   * #1085 — both directions, because a fix that only silences findings is worse
   * than the bug it silences. The tag regex is applied to the stripped text
   * exactly as the check above applies it.
   */
  const TAGS = (s: string) => [...s.matchAll(/<([a-z][a-z0-9]*-[a-z0-9-]*)(?=[\s/>])/gi)].map((m) => m[1].toLowerCase());

  test('#1085: a tag named only in a comment is not reported', () => {
    // The exact line that blocked the 4.0.3 release.
    const html = [
      '<script type="module">',
      '  // (<div x-demo>, 415 of them, zero <x-demo>). `pending` is therefore',
      '  /* also <x-block-commented> here */',
      '</script>',
      '<!-- <x-html-commented> -->',
    ].join('\n');
    expect(TAGS(stripCommentary(html, '.html'))).toEqual([]);
  });

  test('#1085: a REAL unregistered tag is still reported', () => {
    // The finding this check exists for must survive the fix.
    const html = '<script>\n  // <x-commented>\n</script>\n<x-really-here>text</x-really-here>';
    expect(TAGS(stripCommentary(html, '.html'))).toEqual(['x-really-here']);
  });

  test('#1085: a URL is not mistaken for a comment', () => {
    // Stripping a trailing `//` would cut from https:// to end of line and take
    // the real tag with it — a false NEGATIVE, the worse direction for a gate.
    const html = '<script>\n  const u = "https://example.invalid"; // <x-after-url>\n</script>\n<x-live>x</x-live>';
    expect(TAGS(stripCommentary(html, '.html'))).toContain('x-live');
  });

  test('#1085: markdown fenced code is NOT stripped', () => {
    // A doc teaching a tag that does not exist is the defect, not noise (#753).
    const md = '```html\n<x-taught-but-unreal></x-taught-but-unreal>\n```';
    expect(TAGS(stripCommentary(md, '.md'))).toContain('x-taught-but-unreal');
  });

  test('#1085: line numbers are preserved, so a report still points somewhere', () => {
    const html = '<script>\n// <x-gone>\n</script>\n<x-kept>k</x-kept>';
    expect(stripCommentary(html, '.html').split('\n').length).toBe(html.split('\n').length);
  });
});
