/**
 * NO STOCK PROSE IN THE DOCS
 * ==========================
 * John, on docs/behaviors/error.md: "remove all generic text like this from all
 * .md docs. replace with proper text." The text was
 *
 *   `x-error` adds behavior that no HTML element implies. Nothing about a tag
 *   says "ripple" or "tooltip", so this is always opted into by attribute, on
 *   whatever element you already chose.
 *
 * pasted by scripts/generate-behavior-docs.mjs into 89 docs with only the token
 * swapped, under a summary line that read "Schema for x-error behavior (error
 * message)". A sentence that fits every behavior says nothing about any of them,
 * and because it LOOKS like documentation nobody writes the real thing.
 *
 * Three checks:
 *   1. No sentence of 8+ words appears in more than 3 behavior docs once the
 *      doc's own name/token is normalised away. That is the shape of a template,
 *      whatever its wording.
 *   2. The known filler never comes back anywhere in docs/ — including the
 *      "Schema for x-…" / "Behavior applied with x-…" summaries the schema
 *      generator used to emit.
 *   3. No `<wb-…>` tag syntax in docs/. Component tags were removed in 4.0.0; a
 *      doc that still says "every `<wb-*>` behavior renders into light DOM"
 *      teaches markup that parses as an unknown element (John: "why does this
 *      still show wb-* tags?").
 */
import { test, expect } from '../fixtures/offline';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const DOCS = join(ROOT, 'docs');
const BEHAVIOR_DOCS = join(DOCS, 'behaviors');
const MIN_WORDS = 8;
const MAX_DOCS = 3;

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

const rel = (p: string) => relative(ROOT, p).split('\\').join('/');
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Prose sentences only: no code, no raw HTML, no tables, no headings. */
function sentences(md: string, name: string): string[] {
  const text = md
    .replace(/\r\n/g, '\n')
    .replace(/```[\s\S]*?```/g, '\n\n')
    .replace(/<!--[\s\S]*?-->/g, '');
  // The doc's own name in any of its spellings: x-drawer-layout, drawerLayout, drawer-layout.
  const kebab = name.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
  const own = new RegExp(`\\b(?:x-)?(?:${escape(name)}|${escape(kebab)})\\b`, 'gi');
  const out: string[] = [];
  for (const para of text.split(/\n\s*\n/)) {
    const lines = para.split('\n').filter((l) => {
      const t = l.trim();
      return t && !t.startsWith('|') && !t.startsWith('#') && !t.startsWith('<');
    });
    // A list item is its own unit; a wrapped paragraph is one.
    const units: string[] = [];
    for (const l of lines) {
      if (/^\s*([-*]|\d+\.)\s/.test(l) || !units.length) units.push(l.trim());
      else units[units.length - 1] += ' ' + l.trim();
    }
    for (const u of units) {
      for (const s of u.split(/(?<=[.!?])\s+/)) {
        const norm = s.trim().replace(own, 'TOKEN').replace(/\s+/g, ' ');
        const words = norm.split(' ').filter((w) => /[a-z0-9]/i.test(w));
        if (words.length >= MIN_WORDS) out.push(norm);
      }
    }
  }
  return out;
}

test.describe('docs carry no stock prose', () => {
  test(`no ${MIN_WORDS}+ word sentence is shared by more than ${MAX_DOCS} behavior docs`, () => {
    const files = walk(BEHAVIOR_DOCS);
    expect(files.length, 'no behavior docs found — the check would pass over nothing').toBeGreaterThan(100);

    const seen = new Map<string, Set<string>>();
    for (const f of files) {
      const name = f.split(/[\\/]/).pop()!.replace(/\.md$/, '');
      for (const s of new Set(sentences(readFileSync(f, 'utf8'), name))) {
        if (!seen.has(s)) seen.set(s, new Set());
        seen.get(s)!.add(rel(f));
      }
    }
    const repeated = [...seen]
      .filter(([, docs]) => docs.size > MAX_DOCS)
      .sort((a, b) => b[1].size - a[1].size)
      .map(([s, docs]) => `${docs.size} docs: "${s}"\n      e.g. ${[...docs].slice(0, 3).join(', ')}`);
    expect(
      repeated,
      `A sentence that fits this many behaviors describes none of them. Write what THIS behavior does:\n  `
        + repeated.join('\n  '),
    ).toEqual([]);
  });

  test('the known filler does not come back', () => {
    const FILLER: Array<[string, RegExp]> = [
      ['stock "new capability" paragraph', /adds behavior that no HTML element implies/i],
      ['stock "decorates" sentence', /the element you would have reached for anyway/i],
      ['schema-generated summary', /^Schema for x-/m],
      ['schema-generated summary', /^Behavior applied with x-/m],
    ];
    const hits: string[] = [];
    for (const f of walk(DOCS)) {
      const src = readFileSync(f, 'utf8');
      for (const [what, re] of FILLER) if (re.test(src)) hits.push(`${rel(f)}: ${what}`);
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });

  test('no <wb-…> component tag syntax in docs', () => {
    // Components were removed in 4.0.0. The forms are an x-* attribute on any
    // element (<div x-tooltip>) or the semantic element itself (<details>).
    const TAG = /<\/?wb-(?:[a-z][a-z0-9-]*|\*)/g;
    const hits: string[] = [];
    for (const f of walk(DOCS)) {
      readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
        const m = line.match(TAG);
        if (m) hits.push(`${rel(f)}:${i + 1}  ${m.join(' ')}`);
      });
    }
    expect(hits, `wb-* component tags are gone; rewrite these as the x-* attribute or the semantic element:\n  ${hits.join('\n  ')}`).toEqual([]);
  });
});
