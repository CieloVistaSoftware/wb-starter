#!/usr/bin/env node
/**
 * audit-test-sleeps.mjs -- every fixed sleep in the suite, classified (#1516).
 *
 * See scripts/lib/test-sleeps.mjs for what each class means. In short:
 * `positive` (sleep, then assert something IS true) is the defect to fix by
 * waiting on the condition instead; `marked` is a reviewed negative proof.
 *
 * Usage:
 *   node scripts/audit-test-sleeps.mjs            summary + worst files
 *   node scripts/audit-test-sleeps.mjs --list     every sleep, file:line, class
 *   node scripts/audit-test-sleeps.mjs --class positive --list
 *   node scripts/audit-test-sleeps.mjs --json     machine-readable
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allSleeps, specFiles } from './lib/test-sleeps.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const only = args.includes('--class') ? args[args.indexOf('--class') + 1] : null;

let sleeps = allSleeps(ROOT);
const files = specFiles(ROOT);
if (args.includes('--json')) {
  console.log(JSON.stringify({ specFiles: files.length, sleeps }, null, 2));
  process.exit(0);
}
const total = sleeps.length;
const byClass = {};
for (const s of sleeps) byClass[s.class] = (byClass[s.class] || 0) + 1;
const withSleep = new Set(sleeps.filter((s) => s.class !== 'marked' && s.class !== 'poll').map((s) => s.file));

console.log(`Fixed sleeps in tests/ (#1516)\n`);
console.log(`spec files            ${files.length}`);
console.log(`files with a sleep    ${withSleep.size} (unmarked)`);
console.log(`sleeps                ${total}`);
for (const c of ['positive', 'redundant', 'setup', 'negative', 'poll', 'marked']) console.log(`  ${c.padEnd(19)} ${byClass[c] || 0}`);

if (only) sleeps = sleeps.filter((s) => s.class === only);
if (args.includes('--list')) {
  console.log('');
  for (const s of sleeps) console.log(`${s.file}:${s.line}  ${s.class.padEnd(8)} ${s.kind}(${s.delay})${s.inBrowser ? ' [browser]' : ''}${s.reason ? `  -- ${s.reason}` : ''}`);
} else {
  const per = {};
  for (const s of sleeps.filter((x) => x.class === (only || 'positive'))) per[s.file] = (per[s.file] || 0) + 1;
  const worst = Object.entries(per).sort((a, b) => b[1] - a[1]).slice(0, 15);
  console.log(`\nworst files (${only || 'positive'}):`);
  for (const [f, n] of worst) console.log(`  ${String(n).padStart(3)}  ${f}`);
}
