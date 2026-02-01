#!/usr/bin/env node
/* lock-prune.js — detect (and optionally remove) released/stale locks */
import fs from 'fs/promises';
import path from 'path';

const ARGV = process.argv.slice(2);
const opts = { age: 30, apply: false };
for (let i = 0; i < ARGV.length; i++) {
  if (ARGV[i] === '--apply') opts.apply = true;
  if (ARGV[i] === '--age' && ARGV[i + 1]) opts.age = Number(ARGV[++i]);
}

const LOCK_DIR = path.join(process.cwd(), 'Lock');
const STALE_MS = opts.age * 24 * 60 * 60 * 1000;
const SAFE_PATTERNS = /\b(RELEASED|UNLOCKED|ready-for-unlock)\b/i;

async function findCandidates() {
  try {
    const names = await fs.readdir(LOCK_DIR);
    const now = Date.now();
    const out = [];

    for (const n of names) {
      if (!n.toLowerCase().startsWith('locked-') || !n.endsWith('.md')) continue;
      const full = path.join(LOCK_DIR, n);
      const st = await fs.stat(full);
      if (now - st.mtimeMs < STALE_MS) continue;
      const txt = (await fs.readFile(full, 'utf8')).slice(0, 16 * 1024);
      if (SAFE_PATTERNS.test(txt)) out.push({ name: n, ageDays: Math.round((now - st.mtimeMs) / 86400000) });
    }

    return out;
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

  console.log(`[lock-prune] found ${c.length} candidate(s):`);
  c.forEach((x) => console.log(' -', x.name));

  if (!opts.apply) {
    console.log('\nDRY-RUN (no files deleted). Re-run with --apply to remove these files.');
    return 2;
  }

  try {
    const gitStatus = require('child_process').execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    if (gitStatus) {
      console.warn('[lock-prune] repository has uncommitted changes — aborting deletion to avoid surprises');
      return 3;
    }
  } catch (err) {
    // ignore and proceed
  }

  for (const it of c) {
    try {
      await fs.unlink(path.join(LOCK_DIR, it.name));
      console.log('[lock-prune] deleted', it.name);
    } catch (e) {
      console.warn('[lock-prune] failed to delete', it.name, e.message);
    }
  }

  return 0;
}

run().then((c) => process.exit(c)).catch((e) => { console.error(e); process.exit(4); });
