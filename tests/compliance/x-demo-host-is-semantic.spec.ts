/**
 * #917: a demo is hosted on a semantic element, not a <div>.
 *
 * DEMOS-AND-DOCS-STANDARDS.md §1 -- John: "even examples should attach
 * behaviors to the closest semantic tag, divs are not ideal." An example IS a
 * figure. The 4.0.0 tag migration had put every <wb-demo> on a neutral <div>
 * (scripts/migrate-wb-tags.mjs), and with nothing stopping new ones the count
 * grew: 1,374 when #917 was filed, 1,598 on 2026-10-08. All 1,516 elements
 * moved to <figure x-demo> (scripts/migrate-demo-hosts.mjs), and the parsed
 * DOM of every file came out identical apart from the host tag.
 *
 * Two checks, both shrink-only:
 *
 * 1. No `<div x-demo>` ELEMENT in pages/, demos/ or docs/. Zero, no baseline.
 *    scripts/lib/demo-hosts.mjs decides what is an element: it pairs each open
 *    tag with the </div> that closes it, and skips comments, scripts, inline
 *    code spans and non-HTML fences.
 *
 * 2. The `<div x-demo` STRINGS that remain -- the issue's own measure,
 *    `grep -rn "<div x-demo" pages/ demos/ docs/` -- are each one of the
 *    explained exceptions below, and no file may gain one. Check 1 already
 *    proves none of them is an element.
 */
import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scanDemoHosts } from '../../scripts/lib/demo-hosts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIRS = ['pages', 'demos', 'docs'];

/**
 * The honest remainder: text that NAMES `<div x-demo>` and must keep naming it.
 * Lower a number when a mention goes; never raise one.
 */
const MENTIONS_ALLOWED: Record<string, { max: number; why: string }> = {
  'docs/standards/DEMOS-AND-DOCS-STANDARDS.md': {
    max: 1,
    why: '§1 host vocabulary (a ```text fence): `<div x-demo>` is the last-resort host the standard still allows',
  },
  'docs/archive/architecture/WB-PREFIX-AUDIT.md': { max: 1, why: 'archived (#1239); a measured audit of the 4.0.0 rename: "268 with closers" was true of the tree it measured' },
  'pages/behaviors.html': { max: 2, why: 'code comments recording history: "those 88 <div x-demo> blocks", and what the 4.0.0 rename produced' },
  'demos/playground.html': { max: 1, why: 'a code comment recording history: "53 <div x-demo> blocks used to live here"' },
  // Dated session records. Rewriting them would make them say something that
  // was not true on the day they were written.
  'docs/_today/audit-code-panels-v3-standards.md': { max: 14, why: 'dated audit record' },
  'docs/_today/demos-redo-plan-268.md': { max: 8, why: 'dated plan record' },
  'docs/_today/test-audit-2026-08-14.md': { max: 8, why: 'dated audit record' },
  'docs/_today/CURRENT-STATUS.md': { max: 1, why: 'dated status record' },
  'docs/_today/ROOT-CAUSE-md-double-parse.md': { max: 1, why: 'dated root-cause record' },
  'docs/_today/audit-v3-guide-doc-viewer.md': { max: 1, why: 'dated audit record' },
};

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return /\.(html|md)$/.test(e.name) ? [full] : [];
  });
}

const FILES = DIRS.flatMap((d) => walk(path.join(ROOT, d))).map((f) => ({
  rel: path.relative(ROOT, f).split(path.sep).join('/'),
  text: fs.readFileSync(f, 'utf8'),
}));

const lineOf = (text: string, at: number) => text.slice(0, at).split('\n').length;

test('no <div x-demo> element in pages/, demos/ or docs/ -- use <figure x-demo> (#917)', () => {
  expect(FILES.length, 'the scan found no files -- it would check nothing').toBeGreaterThan(100);
  const offenders: string[] = [];
  let figures = 0;
  for (const { rel, text } of FILES) {
    figures += (text.match(/<figure\s+x-demo/g) || []).length;
    if (!/<div\s+x-demo/.test(text)) continue;
    const { hosts, unmatched } = scanDemoHosts(text, rel.endsWith('.md') ? 'md' : 'html');
    for (const h of hosts) offenders.push(`${rel}:${lineOf(text, h.open.start)}`);
    for (const u of unmatched) offenders.push(`${rel}:${lineOf(text, u.start)} (unclosed)`);
  }
  // A scan that recognised nothing would pass vacuously.
  expect(figures, 'no <figure x-demo> found at all -- the hosts were not recognised').toBeGreaterThan(1000);
  expect(
    offenders,
    'An example is a figure (DEMOS-AND-DOCS-STANDARDS.md §1). Write <figure x-demo>...</figure>, ' +
      'or run `node scripts/migrate-demo-hosts.mjs --apply`:\n  ' + offenders.join('\n  '),
  ).toEqual([]);
});

test('the remaining "<div x-demo" strings are the explained exceptions, and none grows (#917)', () => {
  const over: string[] = [];
  let total = 0;
  for (const { rel, text } of FILES) {
    const n = (text.match(/<div x-demo/g) || []).length;
    total += n;
    const allowed = MENTIONS_ALLOWED[rel]?.max ?? 0;
    if (n > allowed) over.push(`${rel}: ${n} (allowed ${allowed})`);
  }
  expect(
    over,
    'New `<div x-demo` text. In prose say <figure x-demo>; an element must be <figure x-demo>:\n  ' + over.join('\n  '),
  ).toEqual([]);
  const ceiling = Object.values(MENTIONS_ALLOWED).reduce((sum, e) => sum + e.max, 0);
  expect(total, 'grep -rn "<div x-demo" pages/ demos/ docs/').toBeLessThanOrEqual(ceiling);
});
