#!/usr/bin/env node
/*
  scripts/lock-prune.js
  - Detects stale lock files in /Lock and (optionally) removes them.
  - Default: detect-only and exit 1 if any stale locks older than --age (days) are found.
  - CI-friendly: use `--age 30` to find locks older than 30 days.

  Usage:
    node scripts/lock-prune.js --age 30        # detect-only (non-zero exit if found)
    node scripts/lock-prune.js --age 7 --apply # actually delete matching locks
    node scripts/lock-prune.js --help

  Behavior safety:
  - Only deletes files that explicitly contain RELEASED|UNLOCKED or contain the string "ready-for-unlock".
  - Always performs a dry-run unless `--apply` is provided.
*/

import fs from 'fs/promises';
import path from 'path';

const ARGV = process.argv.slice(2);
const opts = {
  age: 30,
  apply: false,
};
for (let i = 0; i < ARGV.length; i++) {
  const a = ARGV[i];
  if (a === '--apply') opts.apply = true;
  if (a === '--age' && ARGV[i + 1]) opts.age = Number(ARGV[++i]);
  if (a === '--help' || a === '-h') {
    console.log(await usage());
    process.exit(0);
  }
}

const LOCK_DIR = path.join(process.cwd(), 'Lock');
const STALE_MS = opts.age * 24 * 60 * 60 * 1000;
const SAFE_PATTERNS = /\b(RELEASED|UNLOCKED|ready-for-unlock)\b/i;

async function usage() {
  return (`lock-prune.js — detect and optionally remove released/stale locks\n\n` +
    `Usage:\n  node scripts/lock-prune.js --age 30 [--apply]\n\n` +
    `Options:\n  --age <days>   Consider locks older than this many days (default: 30)\n` +
    `  --apply        Actually delete matching lock files (dangerous)\n\n` +
    `Behavior:\n  Will only delete lock files that match SAFE_PATTERNS (contains RELEASED/UNLOCKED or ready-for-unlock).\n`);
}

async function findCandidates() {
  try {
    const names = await fs.readdir(LOCK_DIR);
    const now = Date.now();
    const candidates = [];
    for (const name of names) {
      if (!name.toLowerCase().startsWith('locked-') || !name.endsWith('.md')) continue;
      const full = path.join(LOCK_DIR, name);
      const st = await fs.stat(full);
      const age = now - st.mtimeMs;
      if (age < STALE_MS) continue;
      const txt = (await fs.readFile(full, 'utf8')).slice(0, 16 * 1024);
      if (SAFE_PATTERNS.test(txt)) {
        candidates.push({ name, full, ageDays: Math.round(age / 864000) / 10 });
      }
    }
    return candidates;
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function run() {
  const c = await findCandidates();
  if (!c.length) {
    console.log(`[lock-prune] no released locks older than ${opts.age} days found`);
    return 0;
  }

  console.log(`[lock-prune] found ${c.length} candidate(s) older than ${opts.age} days:`);
  for (const it of c) console.log(`  - ${it.name}  (~${it.ageDays}d)`);

  if (!opts.apply) {
    console.log('\nDRY-RUN (no files deleted). Re-run with --apply to remove these files.');
    return 2; // non-zero to signal CI failure if desired
  }

  // Safety: refuse to delete if running in a git repo with uncommitted changes (avoid data loss)
  try {
    const gitStatus = await import('child_process');
    const res = gitStatus.execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    if (res) {
      console.warn('[lock-prune] repository has uncommitted changes — aborting deletion to avoid surprises');
      return 3;
    }
  } catch (err) {
    // ignore — proceed
  }

  for (const it of c) {
    try {
      await fs.unlink(it.full);
      console.log(`[lock-prune] deleted ${it.name}`);
    } catch (err) {
      console.warn(`[lock-prune] failed to delete ${it.name}: ${err.message}`);
    }
  }
  console.log('[lock-prune] deletion complete — please open a PR to record the removals');
  return 0;
}

run().then((code) => process.exit(code)).catch((err) => { console.error(err); process.exit(4); });
