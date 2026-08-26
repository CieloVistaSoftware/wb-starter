/**
 * Rename the `wb-` class prefix to `x-`, in code and docs together.
 *
 * WHY CODE AND DOCS IN ONE PASS
 *
 * Docs name the classes the framework actually emits. Renaming the docs alone
 * would make every one of them a lie; renaming the code alone would leave 883
 * doc references pointing at classes that no longer exist. There is no order
 * in which these can be done separately and be correct in between.
 *
 * WHY THIS IS THE DANGEROUS ONE
 *
 * A component tag could only ever be a tag -- the leading `<` gave it away.
 * A class name has no such marker: as a class and as a selector it is the
 * same characters, distinguished only by the call around it. An earlier
 * blanket pass ignored that and prepended a dot to the class name inside
 * every `classList.add(...)` it touched, across 203 sites in 27 files,
 * adding a class that no stylesheet matches. Nothing threw. The styling just
 * stopped.
 *
 * This pass avoids that failure mode by construction: it rewrites the
 * PREFIX only, never the punctuation around it. A selector stays a selector
 * and a class name stays a class name, because the only substitution ever
 * made is of the prefix itself.
 *
 * (This file describes the prefixes obliquely on purpose -- it is itself in
 * scope of the sweep it performs, and spelling them out meant the tool
 * rewrote its own documentation into a tautology.)
 *
 * WHAT IT MUST NOT TOUCH
 *
 *   wb-viewmodels/ wb-models/ wb-lazy wb-views wb-bootstrap wb-parts wb-tests
 *     Real directory and file names. Renaming these breaks every import.
 *   wb-starter, create-wb-starter
 *     The package, the repo, the dependency Ultrasonic pins.
 *   data-x-*, --x-*
 *     Runtime attributes and CSS custom properties -- their own decision.
 *     Excluded by a lookbehind: a `wb-` preceded by `-` or a word character
 *     is part of a longer name, not a class of its own.
 *
 * Usage:
 *   node scripts/migrate-wb-classes.mjs                 dry run
 *   node scripts/migrate-wb-classes.mjs --sample        dry run + before/after lines
 *   node scripts/migrate-wb-classes.mjs --apply         write
 *   node scripts/migrate-wb-classes.mjs --apply --dir X
 */
import fs from 'fs';
import path from 'path';

const ARGS = process.argv.slice(2);
const APPLY = ARGS.includes('--apply');
const SAMPLE = ARGS.includes('--sample');
const ROOT = (() => {
  const i = ARGS.indexOf('--dir');
  return i >= 0 && ARGS[i + 1] ? path.resolve(ARGS[i + 1]) : process.cwd();
})();

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'out', 'dist', 'coverage', 'test-results',
  'playwright-report', '.claude', 'vendor', 'lib',
]);
const EXT = /\.(js|mjs|cjs|ts|tsx|css|html|json|md|yml|yaml)$/;

/** Names after `wb-` that are modules or the package, never classes. */
const RESERVED = new Set([
  'viewmodels', 'models', 'views', 'lazy', 'bootstrap', 'core', 'parts',
  'tests', 'starter',
]);

/**
 * `wb-` starting a fresh identifier, capturing the whole BEM name.
 *
 * The lookbehind is what protects `data-x-ready` and `--x-audio-play-size`:
 * in both, `wb-` is preceded by `-`, so it is part of a longer name rather
 * than a class in its own right.
 */
const RE = /(?<![\w-])wb-([a-z0-9]+(?:[-_][a-z0-9]+)*)/g;

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

/** The first segment decides: `wb-models/foo` is reserved, `x-card__x` is not. */
function isReserved(name) {
  return RESERVED.has(name.split(/[-_]/)[0]);
}

let files = 0, hits = 0, skipped = 0;
const perToken = new Map();
const perFile = [];
const samples = [];

for (const file of walk(ROOT)) {
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch { continue; }
  if (!raw.includes('wb-')) continue;

  let n = 0;
  const s = raw.replace(RE, (whole, name) => {
    if (isReserved(name)) { skipped++; return whole; }
    n++; hits++;
    perToken.set(whole, (perToken.get(whole) || 0) + 1);
    return `x-${name}`;
  });

  if (s !== raw) {
    files++;
    perFile.push([path.relative(ROOT, file).split(path.sep).join('/'), n]);

    if (SAMPLE && samples.length < 14) {
      const before = raw.split(/\r?\n/);
      const after = s.split(/\r?\n/);
      for (let i = 0; i < before.length && samples.length < 14; i++) {
        if (before[i] !== after[i]) {
          samples.push([
            path.relative(ROOT, file).split(path.sep).join('/') + ':' + (i + 1),
            before[i].trim().slice(0, 96),
            after[i].trim().slice(0, 96),
          ]);
        }
      }
    }

    if (APPLY) {
      const crlf = /\r\n/.test(raw);
      fs.writeFileSync(file, crlf ? s.replace(/(?<!\r)\n/g, '\r\n') : s);
    }
  }
}

console.log(`\n${APPLY ? 'APPLIED' : 'DRY RUN'} — ${hits} rename(s) in ${files} file(s)`);
console.log(`${skipped} reserved occurrence(s) left alone (modules, package name)\n`);

console.log('TOP TOKENS');
[...perToken].sort((a, b) => b[1] - a[1]).slice(0, 18)
  .forEach(([t, n]) => console.log(`  ${String(n).padStart(5)}  ${t.padEnd(26)} -> x-${t.slice(3)}`));

console.log('\nWORST FILES');
perFile.sort((a, b) => b[1] - a[1]).slice(0, 12)
  .forEach(([f, n]) => console.log(`  ${String(n).padStart(5)}  ${f}`));

if (SAMPLE) {
  console.log('\nSAMPLE LINES');
  for (const [where, before, after] of samples) {
    console.log(`\n  ${where}`);
    console.log(`    -  ${before}`);
    console.log(`    +  ${after}`);
  }
}
