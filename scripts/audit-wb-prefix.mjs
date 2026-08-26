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
 *   TAG        <div>       components are gone; any hit is a live defect
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

const ARGS = process.argv.slice(2);
const flag = (n) => ARGS.includes(n);
const ROOT = (() => {
  const i = ARGS.indexOf('--dir');
  return i >= 0 && ARGS[i + 1] ? path.resolve(ARGS[i + 1]) : process.cwd();
})();

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'out', 'dist', 'coverage', 'test-results',
  'playwright-report', '.claude', 'vendor', 'lib',
  // Captured test-runner output, not source. These files record what a
  // past run PRINTED -- including failure text that quotes the very tags
  // this audit forbids. Counting a recorded quotation as a surviving tag
  // makes the gate fail for reporting a problem accurately.
  'test-single',
]);
const EXT = /\.(js|mjs|cjs|ts|tsx|css|html|json|md|yml|yaml)$/;

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (EXT.test(e.name)) out.push(p);
  }
  return out;
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

for (const file of walk(ROOT)) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
  if (!text.includes('wb-')) continue;
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const IS_CODE = /\.(js|mjs|cjs|ts|tsx)$/.test(file);

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
    for (const [cat, re] of CATEGORIES) {
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
