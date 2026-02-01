#!/usr/bin/env node
/*
  scripts/lock-restore.js
  - Restore Lock/*.md files that exist in git history and create RESTORED placeholders
    for disk-only locks mentioned in the cleanup audit.

  Usage:
    node scripts/lock-restore.js --dry
    node scripts/lock-restore.js --apply

  Safety:
  - By default runs in dry-run mode and prints actions.
  - Will not overwrite existing files on disk unless --force is provided.
*/

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const ARGV = process.argv.slice(2);
const opts = { apply: false, force: false, dry: true };
for (let i = 0; i < ARGV.length; i++) {
  const a = ARGV[i];
  if (a === '--apply') { opts.apply = true; opts.dry = false; }
  if (a === '--dry') { opts.dry = true; }
  if (a === '--force') opts.force = true;
  if (a === '--help' || a === '-h') { console.log('Usage: lock-restore.js [--dry|--apply] [--force]'); process.exit(0); }
}

const ROOT = process.cwd();
const LOCK_DIR = path.join(ROOT, 'Lock');
const CLEANUP_DOC = path.join(ROOT, 'docs', 'LOCK-CLEANUP-2026-02-01.md');

function sh(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (err) {
    return '';
  }
}

async function gitHistoryLockNames() {
  const raw = sh("git log --pretty=format: --name-only -- Lock || true");
  if (!raw) return [];
  const names = new Set();
  for (const line of raw.split(/\r?\n/)) {
    const s = line.trim();
    if (!s) continue;
    if (s.startsWith('Lock/') || s.toLowerCase().startsWith('lock/')) {
      names.add(path.basename(s));
    }
  }
  return Array.from(names).sort();
}

async function docListedNames() {
  try {
    const txt = await fs.readFile(CLEANUP_DOC, 'utf8');
    const names = [];
    const re = /-\s+Lock\/(LOCKED[-A-Za-z0-9_.+]+\.md)/g;
    let m;
    while ((m = re.exec(txt))) names.push(m[1]);
    // also try simple list in text
    const re2 = /Lock\/(LOCKED[-A-Za-z0-9_.+]+\.md)/g;
    while ((m = re2.exec(txt))) if (!names.includes(m[1])) names.push(m[1]);
    return names.sort();
  } catch (err) {
    return [];
  }
}

function lastGitRevFor(pathName) {
  const cmd = `git rev-list -n 1 --all -- ${pathName} 2>/dev/null`;
  return sh(cmd) || null;
}

function gitShow(rev, pathName) {
  try {
    return sh(`git show ${rev}:${pathName}`);
  } catch (err) {
    return null;
  }
}

async function ensureLockDir() {
  try { await fs.stat(LOCK_DIR); } catch (err) { await fs.mkdir(LOCK_DIR, { recursive: true }); }
}

function restoredHeader(kind, source) {
  const now = new Date().toISOString();
  return `# RESTORED: ${kind}\n\nrestored_at: ${now}\nrestored_by: GitHub Copilot\nsource: ${source}\n\n---\n\n`;
}

async function run() {
  const historyNames = await gitHistoryLockNames();
  const docNames = await docListedNames();
  const diskNames = (await fs.readdir(LOCK_DIR).catch(()=>[])).filter(n=>n.endsWith('.md'));

  const namesSet = new Set([...historyNames, ...docNames]);
  const candidates = Array.from(namesSet).sort();

  const toRecover = [];
  const toPlaceholder = [];

  for (const name of candidates) {
    const diskPath = path.join(LOCK_DIR, name);
    const onDisk = diskNames.includes(name);
    const histRev = lastGitRevFor(path.posix.join('Lock', name));
    if (!onDisk && histRev) {
      toRecover.push({ name, rev: histRev });
      continue;
    }
    if (!onDisk && !histRev) {
      // mentioned in doc but not in git history — create placeholder
      toPlaceholder.push({ name });
      continue;
    }
  }

  // REPORT
  if (toRecover.length === 0 && toPlaceholder.length === 0) {
    console.log('[lock-restore] nothing to restore (no missing lock files found)');
    return 0;
  }

  console.log('[lock-restore] candidates to recover from git:');
  for (const c of toRecover) console.log('  -', c.name, '@', c.rev.slice(0,12));
  if (toPlaceholder.length) {
    console.log('\n[lock-restore] candidates to recreate as RESTORED placeholders (no git history, mentioned in cleanup doc):');
    for (const p of toPlaceholder) console.log('  -', p.name);
  }

  if (!opts.apply) {
    console.log('\nDRY-RUN only — re-run with --apply to actually write files.');
    return 2;
  }

  // WRITE
  await ensureLockDir();
  const created = [];
  for (const c of toRecover) {
    const target = path.join(LOCK_DIR, c.name);
    if (!opts.force) {
      try { await fs.access(target); console.log('[lock-restore] skipping (exists):', c.name); continue; } catch {}
    }
    const content = gitShow(c.rev, path.posix.join('Lock', c.name));
    const out = restoredHeader('from-git', `${c.rev}`) + (content || '') + '\n';
    await fs.writeFile(target, out, 'utf8');
    created.push(target);
    console.log('[lock-restore] restored:', c.name);
  }

  for (const p of toPlaceholder) {
    const target = path.join(LOCK_DIR, p.name);
    if (!opts.force) {
      try { await fs.access(target); console.log('[lock-restore] skipping placeholder (exists):', p.name); continue; } catch {}
    }
    const out = restoredHeader('placeholder', 'docs/LOCK-CLEANUP-2026-02-01.md') +
      `This lock file was recreated as a placeholder because it was mentioned in the cleanup audit but had no committed history.\n\nSee: docs/LOCK-CLEANUP-2026-02-01.md for context.\n`;
    await fs.writeFile(target + '.RESTORED.md', out, 'utf8');
    created.push(target + '.RESTORED.md');
    console.log('[lock-restore] created placeholder:', p.name + '.RESTORED.md');
  }

  console.log('\n[lock-restore] done — created', created.length, 'file(s)');
  console.log('Next: create a branch, commit Lock/ files, and open a PR referencing docs/LOCK-CLEANUP-2026-02-01.md');
  return 0;
}

run().then((c)=>process.exit(Number(c))).catch((err)=>{ console.error(err); process.exit(4); });
