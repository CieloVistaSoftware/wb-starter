/**
 * Audit every `wb-` string in the project and classify it.
 *
 * "wb-" is not one thing. Removing it is not one job, and treating it as one
 * is how a rename turns into a corrupted tree -- a blanket search-and-replace
 * over every string literal rewrote `classList.add('x-card')` into
 * `classList.add('.x-card')` across 203 sites once already.
 *
 * So this classifies before it counts. Each category has a different owner, a
 * different risk, and a different answer to "should this go at all":
 *
 *   TAG        <wb-card>, <wb-*>  components are gone; any hit is a live defect,
 *                             including the generic `<wb-*>` a doc uses to talk about them
 *   CLASS      .x-foo        the styling system -- the big one, and the only
 *                             category where "remove" means a real migration
 *   MODULE     wb-lazy.js     file and directory names (src/wb-models/ ...)
 *   PACKAGE    wb-starter     the project's own name -- keep
 *   DATA       data-x-*      runtime attributes
 *   PROSE      docs/comments  text, cheap to change, worthless to change alone
 *
 * Usage:
 *   node scripts/audit-wb-prefix.mjs            summary
 *   node scripts/audit-wb-prefix.mjs --detail   per-token counts
 *   node scripts/audit-wb-prefix.mjs --files    worst files per category
 *   node scripts/audit-wb-prefix.mjs --dir X    audit a downstream site
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const ARGS = process.argv.slice(2);
const flag = (n) => ARGS.includes(n);
const ROOT = (() => {
  const i = ARGS.indexOf('--dir');
  return i >= 0 && ARGS[i + 1] ? path.resolve(ARGS[i + 1]) : process.cwd();
})();

// #1300: the audit counts SOURCE, and the repo already defines source: the
// files git tracks. It used to walk the disk and exclude generated files by
// name, one deny-list entry per file that broke the gate (#960 added four).
// Every new cache broke it again -- data/fixes-cache.json and
// data/issues-cache.json (gitignored copies of GitHub issue text quoting
// <wb-select> and friends) pushed TAG to 700 in a local tree while CI, on a
// fresh checkout, passed. The answer depended on what earlier runs left on disk.
// Listing tracked files instead makes every gitignored artifact invisible,
// including the ones nobody has written yet.
//
// What remains below excludes TRACKED content on purpose:
//   .claude/             agent configuration (CLAUDE.md, settings), not project source
//   lib/                 scripts/lib and src/lib (vendored highlight.js etc.), excluded
//                        since the audit was written in 4.0.0
//   priority-gate.json   data/priority-gate.json is committed, but it is a snapshot of
//                        open GitHub issue text written by build-priority-gate.mjs;
//                        issues ABOUT the removed tags quote them, and it changes on
//                        every refresh with no source change at all
const EXCLUDE_DIRS = new Set(['.claude', 'lib']);
const EXCLUDE_FILES = new Set(['priority-gate.json']);

// Only for the no-git fallback (a downstream site passed with --dir that is not
// a repo): there is no .gitignore answer, so skip what is never source.
const WALK_SKIP_DIRS = new Set(['node_modules', '.git', 'out', 'dist', 'coverage', 'vendor']);

const EXT = /\.(js|mjs|cjs|ts|tsx|css|html|json|md|yml|yaml)$/;

const excluded = (rel) => {
  const parts = rel.split('/');
  return EXCLUDE_FILES.has(parts[parts.length - 1])
    || parts.slice(0, -1).some((d) => EXCLUDE_DIRS.has(d));
};

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (WALK_SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (EXT.test(e.name)) out.push(p);
  }
  return out;
}

// Tracked plus staged files, relative to ROOT. null when git is missing or ROOT
// is not inside a work tree -- only then does the audit fall back to the walk.
function trackedFiles() {
  let raw;
  try {
    raw = execFileSync('git', ['ls-files', '-z', '--cached'], {
      cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch { return null; }
  return raw.split('\0').filter((f) => f && EXT.test(f)).map((f) => path.join(ROOT, f));
}

function sourceFiles() {
  const all = trackedFiles() ?? walk(ROOT);
  return all.filter((f) => !excluded(path.relative(ROOT, f).split(path.sep).join('/')));
}

// Order matters: first match wins, most specific first.
const CATEGORIES = [
  ['TAG',     /<\/?wb-[a-z0-9-]+/g],
  ['PACKAGE', /wb-starter|create-wb-starter/g],
  ['MODULE',  /wb-(?:models|viewmodels|views|lazy|bootstrap|core|parts|tests|starter)\b/g],
  ['DATA',    /data-x-[a-z0-9-]+/g],
  ['CLASS',   /\bwb-[a-z0-9]+(?:__[a-z0-9-]+)?(?:--[a-z0-9-]+)?\b/g],
];

const counts = Object.fromEntries(CATEGORIES.map(([c]) => [c, 0]));
const tokens = Object.fromEntries(CATEGORIES.map(([c]) => [c, new Map()]));
const files = Object.fromEntries(CATEGORIES.map(([c]) => [c, new Map()]));
const tagSites = [];

for (const file of sourceFiles()) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
  if (!text.includes('wb-')) continue;
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const IS_CODE = /\.(js|mjs|cjs|ts|tsx)$/.test(file);
  // In prose, the generic `<wb-*>` is a tag too: it is how docs/claude/TIER1-LAWS.md
  // kept teaching the removed tags ("Every `<wb-*>` behavior renders directly into
  // Light DOM"), and [a-z0-9-] never matched the asterisk, so the audit said 0.
  // Code keeps the narrow pattern: there `<wb-*>` is a comment or a log line
  // ABOUT the removal, not markup anyone copies.
  const categories = /\.md$/.test(file)
    ? CATEGORIES.map(([c, re]) => (c === 'TAG' ? [c, /<\/?wb-(?:[a-z0-9-]+|\*)/g] : [c, re]))
    : CATEGORIES;

  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    // A component tag named in a COMMENT is documentation, not markup.
    // Explaining this migration requires naming the tags it removed --
    // the fix for #848 has to say the old tag was rewritten to <progress>
    // to be comprehensible at all. Counting that as a surviving tag makes
    // the gate unpassable for anyone who documents their work, which is
    // the opposite of what it is for.
    //
    // Only JS/TS comment openers are recognised. HTML and Markdown are
    // left alone: there a tag in prose is normally escaped anyway, and a
    // real tag on a commented-out line is still shipped markup.
    if (IS_CODE && /^\s*(\/\/|\*|\/\*)/.test(line)) return;

    let rest = line;
    for (const [cat, re] of categories) {
      re.lastIndex = 0;
      const found = rest.match(re);
      if (!found) continue;
      for (const hit of found) {
        counts[cat]++;
        tokens[cat].set(hit, (tokens[cat].get(hit) || 0) + 1);
        files[cat].set(rel, (files[cat].get(rel) || 0) + 1);
        if (cat === 'TAG' && tagSites.length < 40) tagSites.push(`${rel}:${i + 1}  ${hit}`);
      }
      rest = rest.split(re).join(' ');  // consumed -- do not double-count
    }
  });
}

const total = Object.values(counts).reduce((a, b) => a + b, 0);
const pad = (s, n) => String(s).padEnd(n);

console.log(`\nwb- prefix audit — ${ROOT}\n`);
console.log(`${pad('CATEGORY', 10)} ${pad('HITS', 8)} ${pad('DISTINCT', 9)} FILES`);
console.log('-'.repeat(52));
for (const [cat] of CATEGORIES) {
  console.log(`${pad(cat, 10)} ${pad(counts[cat], 8)} ${pad(tokens[cat].size, 9)} ${files[cat].size}`);
}
console.log('-'.repeat(52));
console.log(`${pad('TOTAL', 10)} ${total}\n`);

if (tagSites.length) {
  console.log(`COMPONENT TAGS STILL PRESENT (${counts.TAG}) — components were removed in 4.0.0,`);
  console.log(`so each of these parses as HTMLUnknownElement: inline, unstyled, no behavior.\n`);
  tagSites.forEach((s) => console.log('  ' + s));
  console.log('');
}

if (flag('--detail')) {
  for (const [cat] of CATEGORIES) {
    if (!tokens[cat].size) continue;
    console.log(`\n${cat} — top tokens`);
    [...tokens[cat]].sort((a, b) => b[1] - a[1]).slice(0, 25)
      .forEach(([t, n]) => console.log(`  ${pad(n, 6)} ${t}`));
  }
}

if (flag('--files')) {
  for (const [cat] of CATEGORIES) {
    if (!files[cat].size) continue;
    console.log(`\n${cat} — worst files`);
    [...files[cat]].sort((a, b) => b[1] - a[1]).slice(0, 15)
      .forEach(([f, n]) => console.log(`  ${pad(n, 6)} ${f}`));
  }
}

// A component tag is a defect, not a style preference.
process.exit(counts.TAG > 0 ? 1 : 0);
