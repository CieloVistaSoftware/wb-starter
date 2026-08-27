#!/usr/bin/env node
/**
 * Rename the word "component" to "behavior".
 *
 * John: "Get rid of the word components, rename to behaviors in entire
 * project." 4.0.0 removed components -- no custom elements, no Shadow DOM --
 * so the word describes nothing that still exists, including "Web Components".
 *
 *   node scripts/migrate-component-word.mjs --dry pages index.html
 *   node scripts/migrate-component-word.mjs pages index.html config
 *
 * CASE IS PRESERVED, because these are sentences a person reads:
 *   Web Components -> Behaviors      Components -> Behaviors
 *   Component      -> Behavior       components -> behaviors
 *
 * TWO THINGS ARE DELIBERATELY LEFT ALONE, and neither is laziness:
 *
 *   history   whats-new / changelog / release notes / migration guides exist
 *             to record that 4.0.0 REMOVED components. Rewriting them to say
 *             "removed behaviors" makes them describe something that never
 *             happened, and deletes the reason the rename exists.
 *   articles/ long-form essays about software design generally. "One
 *             component misbehaves while the rest keep working" is a sentence
 *             about architecture, not about this library's API; swapping the
 *             noun there changes what the author said.
 */
import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry');
const targets = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!targets.length) {
  console.error('Give at least one file or directory. Use --dry first.');
  process.exit(2);
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'test-results', 'playwright-report', 'out', 'dist', '.claude', 'coverage', 'articles']);
const EXTS = ['.html', '.md', '.js', '.mjs', '.ts', '.json', '.css'];
const HISTORY = /(?:whats-new|changelog|release|migration|history|baseline|_today)/i;

/** Longest first: "Web Components" must win before "Components". */
const RULES = [
  [/\bWeb Components\b/g, 'Behaviors'],
  [/\bWeb Component\b/g, 'Behavior'],
  [/\bweb components\b/g, 'behaviors'],
  [/\bweb component\b/g, 'behavior'],
  [/\bComponents\b/g, 'Behaviors'],
  [/\bComponent\b/g, 'Behavior'],
  [/\bcomponents\b/g, 'behaviors'],
  [/\bcomponent\b/g, 'behavior'],
  [/\bCOMPONENTS\b/g, 'BEHAVIORS'],
  [/\bCOMPONENT\b/g, 'BEHAVIOR'],
];

function walk(p, out = []) {
  let st;
  try { st = fs.statSync(p); } catch { return out; }
  if (st.isDirectory()) {
    if (SKIP_DIRS.has(path.basename(p))) return out;
    for (const e of fs.readdirSync(p)) walk(path.join(p, e), out);
  } else if (EXTS.some((x) => p.endsWith(x))) {
    out.push(p);
  }
  return out;
}

let changedFiles = 0;
let changedWords = 0;
const skipped = [];

for (const target of targets) {
  for (const file of walk(target)) {
    const rel = file.replace(/\\/g, '/');
    if (HISTORY.test(rel)) { skipped.push(rel); continue; }

    let text;
    try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
    if (!/component/i.test(text)) continue;

    const before = text;
    let hits = 0;
    for (const [re, to] of RULES) {
      text = text.replace(re, () => { hits++; return to; });
    }
    if (text === before) continue;

    changedFiles++;
    changedWords += hits;
    console.log(`  ${rel.padEnd(56)} ${hits}`);
    if (!DRY) fs.writeFileSync(file, text);
  }
}

console.log('');
console.log(`${DRY ? 'WOULD RENAME' : 'RENAMED'}: ${changedWords} occurrence(s) in ${changedFiles} file(s)`);
if (skipped.length) {
  console.log(`kept as history (${skipped.length}): ${skipped.slice(0, 6).join(', ')}${skipped.length > 6 ? ' …' : ''}`);
}
