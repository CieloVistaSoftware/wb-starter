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
import { sourceFiles } from './lib/source-files.mjs';

const ARGS = process.argv.slice(2);
const flag = (n) => ARGS.includes(n);
const ROOT = (() => {
  const i = ARGS.indexOf('--dir');
  return i >= 0 && ARGS[i + 1] ? path.resolve(ARGS[i + 1]) : process.cwd();
})();

const EXT = /\.(js|mjs|cjs|ts|tsx|css|html|json|md|yml|yaml)$/;

// #1300: the file list is git's, not the filesystem's. Six generated files had
// been added to a per-name deny-list one at a time as each one broke this gate
// (#960, #1027), and data/fixes-cache.json + data/issues-cache.json broke it
// again -- 700 "surviving component tags" that were GitHub issue text quoting
// the tags this audit removed. The repo already says what source is: the files
// git tracks, minus data/ (output, by TIER1-LAWS §12 -- which is where all six
// lived, including the one that is tracked on purpose).
//
// The first pass at this (94a4226b) listed `--cached` alone and kept a
// three-name deny-list. Both are fixed here, in scripts/lib/source-files.mjs,
// so any other scanner can ask for "source" instead of growing its own list.
const { files: FILES, source: FILE_SOURCE } = sourceFiles({ root: ROOT, ext: EXT });

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

let filesRead = 0;

for (const file of FILES) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
  filesRead++;
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
// The scan's own size, reported in the machine-readable block, so a gate can
// assert a floor on it. An audit that read nothing reports TAG 0 and every
// ceiling met -- a perfect score that means the scanner broke, which is how
// the zeroed site-generator-result.json kept 57 tests dormant (#837).
console.log(`${pad('SCANNED', 10)} ${pad(filesRead, 8)} files, listed by ${FILE_SOURCE}`);
console.log('');
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

// A scan that read nothing is a broken scanner, not a clean repo. Fail loudly
// rather than hand back TAG 0 and let every ceiling pass vacuously.
if (filesRead === 0) {
  console.error(
    `audit-wb-prefix.mjs read 0 files under ${ROOT} (listed by ${FILE_SOURCE}).\n`
    + 'Nothing was scanned, so the counts above mean nothing. If this is a git\n'
    + 'work tree, check that `git ls-files` works here; if it is not, check that\n'
    + '--dir points at a directory that actually holds source.',
  );
  process.exit(2);
}

// A component tag is a defect, not a style preference.
process.exit(counts.TAG > 0 ? 1 : 0);
