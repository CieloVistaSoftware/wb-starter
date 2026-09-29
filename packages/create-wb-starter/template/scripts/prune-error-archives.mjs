#!/usr/bin/env node
/**
 * Prune archived error logs — 30-day retention, opt-in, never silent.
 * =============================================================================
 * John, 2026-09-05: "all of our error logs must stay on the system for 30 days."
 *
 * Nothing in this repo deletes an error log on its own any more. The test
 * reporter and the server both ARCHIVE before they clear (#1027), so
 * data/error-log-archive/ only grows. This script is the one place that removes
 * anything, and it is deliberately awkward to use by accident:
 *
 *   node scripts/prune-error-archives.mjs                 # report only, deletes nothing
 *   node scripts/prune-error-archives.mjs --confirm       # delete >30d, naming each file
 *   node scripts/prune-error-archives.mjs --days 90 --confirm
 *
 * Without --confirm it is a dry run. With it, every file removed is printed
 * with its age and entry count, and anything inside the retention window is
 * refused outright rather than skipped quietly.
 */
import { readdirSync, statSync, readFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ARCHIVE_DIR = join('data', 'error-log-archive');
const argv = process.argv.slice(2);
const confirm = argv.includes('--confirm');
const daysIdx = argv.indexOf('--days');
const days = daysIdx >= 0 ? Number(argv[daysIdx + 1]) : 30;

if (!Number.isFinite(days) || days < 30) {
  console.error(`Refusing to prune with a ${days}-day window: the retention rule is 30 days minimum.`);
  process.exit(2);
}

if (!existsSync(ARCHIVE_DIR)) {
  console.log(`No archive directory at ${ARCHIVE_DIR} — nothing to prune.`);
  process.exit(0);
}

const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
const files = readdirSync(ARCHIVE_DIR).filter((f) => f.endsWith('.json'));

let kept = 0;
const stale = [];
for (const name of files) {
  const full = join(ARCHIVE_DIR, name);
  const mtime = statSync(full).mtimeMs;
  if (mtime >= cutoff) { kept += 1; continue; }
  let count = '?';
  try {
    count = String((JSON.parse(readFileSync(full, 'utf8')).errors || []).length);
  } catch {
    count = 'unreadable';
  }
  stale.push({ name, full, ageDays: Math.floor((Date.now() - mtime) / 86_400_000), count });
}

console.log(`${files.length} archived error log(s) in ${ARCHIVE_DIR}`);
console.log(`  within the ${days}-day retention window : ${kept}  (kept, always)`);
console.log(`  older than ${days} days                 : ${stale.length}`);

if (!stale.length) process.exit(0);

for (const f of stale) {
  console.log(`    ${f.name}  —  ${f.ageDays} days old, ${f.count} entr${f.count === '1' ? 'y' : 'ies'}`);
}

if (!confirm) {
  console.log('');
  console.log('Dry run: nothing was deleted. Re-run with --confirm to remove the files listed above.');
  process.exit(0);
}

for (const f of stale) {
  unlinkSync(f.full);
  console.log(`  deleted ${f.name} (${f.ageDays} days old, ${f.count} entries)`);
}
console.log(`\n${stale.length} archive(s) older than ${days} days deleted. ${kept} kept.`);
