#!/usr/bin/env node
/**
 * Where the word "component" still appears, and what kind of appearance it is.
 *
 * John: "Get rid of the word components, rename to behaviors in entire
 * project." And, when asked whether the platform term was an exception:
 * "We are not using web components in this project any more did you forget
 * that?" -- 4.0.0 removed them. There are no custom elements and no Shadow
 * DOM, so "Web Components" is not a term this project has any claim to.
 *
 * Classified, because the fix differs per kind and a blind
 * search-and-replace across 2,365 occurrences would rename URLs, break links
 * and rewrite history:
 *
 *   VISIBLE   text a reader sees -- titles, headings, nav, prose
 *   PATH      a filename or directory; renaming needs every link updated too
 *   CODE      an identifier: variable, key, class name, schema field
 *   HISTORY   changelogs and release notes describing what 4.0.0 removed --
 *             these must KEEP the old word or they stop making sense
 *
 *   node scripts/audit-component-word.mjs           summary
 *   node scripts/audit-component-word.mjs --visible the reader-facing list
 */
import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'test-results', 'playwright-report', 'out', 'dist',
  '.claude', 'coverage',
]);
const EXTS = ['.html', '.md', '.js', '.mjs', '.ts', '.json', '.css'];

/** Files whose whole purpose is to record what changed. */
const HISTORY = /(?:whats-new|changelog|release|migration|history|baseline|_today)/i;

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (EXTS.some((x) => p.endsWith(x))) out.push(p);
  }
  return out;
}

const files = walk('.');
const counts = { VISIBLE: 0, PATH: 0, CODE: 0, HISTORY: 0 };
const byKind = { VISIBLE: [], PATH: [], CODE: [], HISTORY: [] };

// Reader-facing surfaces. Everything else is treated as code until proven otherwise.
const isMarkup = (f) => f.endsWith('.html') || f.endsWith('.md');

for (const file of files) {
  const rel = file.replace(/\\/g, '/').replace(/^\.\//, '');
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
  if (!/component/i.test(text) && !/component/i.test(rel)) continue;

  if (/component/i.test(path.basename(rel))) {
    counts.PATH++;
    byKind.PATH.push(rel);
  }

  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (!/component/i.test(line)) return;
    const kind = HISTORY.test(rel) ? 'HISTORY' : (isMarkup(rel) ? 'VISIBLE' : 'CODE');
    counts[kind]++;
    if (byKind[kind].length < 400) {
      byKind[kind].push(`${rel}:${i + 1}  ${line.trim().slice(0, 100)}`);
    }
  });
}

const arg = process.argv[2];
if (arg === '--visible' || arg === '--path' || arg === '--code' || arg === '--history') {
  const k = arg.slice(2).toUpperCase();
  console.log(`${k} (${counts[k]})\n`);
  console.log(byKind[k].join('\n'));
  process.exit(0);
}

console.log('THE WORD "component" ACROSS THE PROJECT');
console.log('  VISIBLE  ' + String(counts.VISIBLE).padStart(5) + '   reader-facing text in .html / .md');
console.log('  CODE     ' + String(counts.CODE).padStart(5) + '   identifiers, keys, class names');
console.log('  HISTORY  ' + String(counts.HISTORY).padStart(5) + '   changelogs describing the removal — KEEP');
console.log('  PATH     ' + String(counts.PATH).padStart(5) + '   files/dirs named for it');
console.log('  ---------------');
console.log('  TOTAL    ' + String(counts.VISIBLE + counts.CODE + counts.HISTORY).padStart(5));
console.log('');
console.log('Detail:  --visible | --code | --history | --path');

fs.writeFileSync('data/component-word-audit.json', JSON.stringify({ counts, byKind }, null, 2));
