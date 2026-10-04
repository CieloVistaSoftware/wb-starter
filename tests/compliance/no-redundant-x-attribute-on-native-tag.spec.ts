import { test, expect } from '../fixtures/offline';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';

/**
 * COMPLIANCE GATE: no duplicate x-behaviors on any tag (#1141).
 *
 * John: "No duplicate x-behaviors on any tag." A native element that
 * src/core/tag-map.js's nativeMap already maps to behavior B must not ALSO
 * carry `x-B`: `<input type="range" x-range>`, `<article x-card>`,
 * `<button x-button>`, `<form x-form>`. The tag already says it, and writing
 * it twice teaches readers they must spell out what HTML already says.
 *
 * The rule is READ from nativeMap, first matching selector wins, exactly as
 * getNativeBehavior() resolves it. The old gate compared `x-<tagname>` with
 * the tag name, so every entry whose behavior is not the tag name was
 * invisible to it: input[type=range|password|checkbox|radio] and
 * article -> card. And it scanned demos/ and pages/ only, while docs, README,
 * the JSON models and the create-wb-starter template held most of the 65
 * duplicates measured on 2026-09-13.
 *
 * What counts as markup:
 *   - .html: everything outside <!-- comments -->
 *   - .md: ```html fenced blocks only -- what readers copy. Prose and ```text
 *     blocks that QUOTE the anti-pattern to explain it are not instances of it.
 *   - .js/.mjs: everything outside comments (several comments quote
 *     `<button x-button>` precisely to say it must never be emitted)
 *   - .json: every string value
 *
 * An `x-<tagname>` on a tag nativeMap does NOT map (`<ul x-ul>`, `<dl x-dl>`)
 * is the only way to opt that tag in, so it is not a duplicate.
 */
const ROOT = process.cwd();
const SCOPES: Record<string, string[]> = {
  'demos and pages': ['demos', 'pages', 'index.html'],
  'docs and README': ['docs', 'README.md'],
  'src markup strings and JSON models': ['src'],
  'create-wb-starter template': ['packages/create-wb-starter/template'],
};
const SKIP_DIRS = new Set(['node_modules', '.git', 'archive', 'test-results', 'coverage', 'dist', 'out']);
const EXT = /\.(html|md|js|mjs|json)$/;

type Rule = { tag: string; type: string | null; behavior: string };

async function loadRules(): Promise<Rule[]> {
  const mod: any = await import(pathToFileURL(path.join(ROOT, 'src/core/tag-map.js')).href);
  return Object.entries(mod.nativeMap as Record<string, string>).map(([selector, behavior]) => {
    const m = selector.match(/^([a-z0-9]+)(?:\[type="([a-z-]+)"\])?$/);
    if (!m) throw new Error(`nativeMap selector this gate cannot read: ${selector} -- teach the gate, never skip it`);
    return { tag: m[1], type: m[2] || null, behavior };
  });
}

function walk(rel: string, out: string[]): void {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return;
  if (fs.statSync(abs).isFile()) { if (EXT.test(rel)) out.push(rel); return; }
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const child = `${rel}/${e.name}`;
    if (e.isDirectory()) walk(child, out);
    else if (EXT.test(e.name)) out.push(child);
  }
}

const blank = (s: string) => s.replace(/[^\n]/g, ' ');

/** The text that counts as markup, with everything else blanked (line numbers survive). */
function markupOf(rel: string, text: string): string {
  if (rel.endsWith('.md')) {
    let out = blank(text);
    const fence = /^```html[^\n]*\n([\s\S]*?)^```/gm;
    let m;
    while ((m = fence.exec(text))) {
      const start = m.index + m[0].indexOf('\n') + 1;
      out = out.slice(0, start) + m[1] + out.slice(start + m[1].length);
    }
    return out.replace(/<!--[\s\S]*?-->/g, blank);
  }
  if (rel.endsWith('.json')) {
    // JSON strings carry markup escaped: \" -> ".
    return text.replace(/\\"/g, ' "');
  }
  // .js, and .html with inline <script>s: comments quoting the anti-pattern are not instances.
  return stripScriptComments(text.replace(/<!--[\s\S]*?-->/g, blank));
}

/** `//` only after start-of-line or whitespace, so `https://` survives. */
function stripScriptComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|\s)\/\/.*$/gm, (c, lead) => lead + blank(c.slice(lead.length)));
}

function findDuplicates(rel: string, text: string, rules: Rule[]): string[] {
  const markup = markupOf(rel, text);
  const found: string[] = [];
  const TAG = /<([a-z][a-z0-9]*)(\s[^<>]*?)?\/?>/gi;
  const ATTR = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m;
  while ((m = TAG.exec(markup))) {
    const tag = m[1].toLowerCase();
    const attrs = new Map<string, string>();
    let a;
    ATTR.lastIndex = 0;
    while ((a = ATTR.exec(m[2] || ''))) attrs.set(a[1].toLowerCase(), a[2] ?? a[3] ?? a[4] ?? '');
    const type = (attrs.get('type') || '').toLowerCase();
    const rule = rules.find((r) => r.tag === tag && (!r.type || r.type === type));
    if (!rule || !attrs.has(`x-${rule.behavior}`)) continue;
    const line = markup.slice(0, m.index).split('\n').length;
    found.push(`${rel}:${line}  <${tag}${rule.type ? ` type="${rule.type}"` : ''}> already IS ${rule.behavior}; drop x-${rule.behavior}`);
  }
  return found;
}

test.describe('#1141 no duplicate x-behaviors on any tag', () => {
  let rules: Rule[] = [];
  test.beforeAll(async () => { rules = await loadRules(); });

  test('the rule is read from nativeMap, typed inputs and article included', () => {
    const sample = (html: string) => findDuplicates('probe.html', html, rules);
    expect(sample('<input type="range" x-range>')).toHaveLength(1);
    expect(sample('<input x-password type="password">')).toHaveLength(1);
    expect(sample('<article x-card>')).toHaveLength(1);
    expect(sample('<button x-button>')).toHaveLength(1);
    expect(sample('<input type="range" x-colorpicker>'), 'a different behavior is an opt-in, not a duplicate').toHaveLength(0);
    expect(sample('<article x-cardimage>'), 'a variant is not a duplicate').toHaveLength(0);
    expect(sample('<ul x-ul>'), 'ul is not in nativeMap; x-ul is how it opts in').toHaveLength(0);
    expect(sample('<!-- <button x-button> --><button>'), 'a comment quoting the anti-pattern is not an instance').toHaveLength(0);
  });

  for (const [scope, roots] of Object.entries(SCOPES)) {
    test(`${scope}: no tag carries the x-behavior it already is`, () => {
      const files: string[] = [];
      for (const r of roots) walk(r, files);
      expect(files.length, `${scope}: nothing scanned -- a scope moved and this gate went vacuous`).toBeGreaterThan(0);
      const bad = files.flatMap((rel) => findDuplicates(rel, fs.readFileSync(path.join(ROOT, rel), 'utf8'), rules));
      expect(bad, `duplicate x-behaviors (tag-map.js nativeMap already applies these):\n  ${bad.join('\n  ')}`).toEqual([]);
    });
  }
});
