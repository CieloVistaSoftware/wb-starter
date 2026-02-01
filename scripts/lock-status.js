#!/usr/bin/env node
/*
  scripts/lock-status.js
  - Summarize and query Lock/*.md files with structured metadata support.
  - Detects owner, reason, status, expires, related-PR and outputs JSON or a human table.

  Examples:
    node scripts/lock-status.js            # human summary
    node scripts/lock-status.js --json     # machine-readable JSON
    node scripts/lock-status.js --age 30   # show locks older than 30 days
    node scripts/lock-status.js --owner @alice

  Lock metadata supported (simple K: V anywhere in the file):
    owner: @github-username
    reason: short reason text
    status: active|released|resolved
    expires: 2026-02-10  (ISO date)
    related-pr: #123
*/

import fs from 'fs/promises';
import path from 'path';

const ARGV = process.argv.slice(2);
const opts = { json: false, age: null, owner: null };
for (let i = 0; i < ARGV.length; i++) {
  const a = ARGV[i];
  if (a === '--json') opts.json = true;
  if (a === '--age' && ARGV[i + 1]) opts.age = Number(ARGV[++i]);
  if (a === '--owner' && ARGV[i + 1]) opts.owner = ARGV[++i];
  if (a === '--help' || a === '-h') { console.log('Usage: lock-status.js [--json] [--age N] [--owner @name]'); process.exit(0); }
}

const LOCK_DIR = path.join(process.cwd(), 'Lock');

function parseMeta(text) {
  const meta = {};
  // YAML frontmatter
  const fm = text.match(/^---\s*\n([\s\S]*?)\n---/);
  const body = fm ? fm[1] : text.slice(0, 8192);
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_\-]+)\s*:\s*(.+)$/);
    if (m) meta[m[1].toLowerCase()] = m[2].trim();
  }
  return meta;
}

async function listLocks() {
  try {
    const names = await fs.readdir(LOCK_DIR);
    const out = [];
    const now = Date.now();
    for (const n of names) {
      if (!n.toLowerCase().startsWith('locked-') || !n.endsWith('.md')) continue;
      const full = path.join(LOCK_DIR, n);
      const stat = await fs.stat(full);
      const txt = await fs.readFile(full, 'utf8');
      const meta = parseMeta(txt);
      const ageDays = Math.round(((now - stat.mtimeMs) / 86400000) * 10) / 10;
      out.push({ name: n, path: full, mtime: stat.mtime.toISOString(), ageDays, size: stat.size, meta, preview: txt.split(/\r?\n/).slice(0,6).join(' | ') });
    }
    return out.sort((a,b) => a.name.localeCompare(b.name));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function filter(list) {
  return list.filter((l) => {
    if (opts.age != null && l.ageDays < opts.age) return false;
    if (opts.owner && (!l.meta.owner || l.meta.owner.toLowerCase() !== opts.owner.toLowerCase())) return false;
    return true;
  });
}

(async function main(){
  const locks = await listLocks();
  const candidates = filter(locks);
  if (opts.json) { console.log(JSON.stringify(candidates, null, 2)); return; }
  if (!locks.length) { console.log('No lock files found in /Lock'); return; }
  console.log('Lock files summary (use --json for machine-readable):\n');
  for (const l of locks) {
    const s = `${l.name.padEnd(48)} mtime=${l.mtime} age=${String(l.ageDays).padStart(5)}d status=${(l.meta.status||'n/a').padEnd(8)} owner=${(l.meta.owner||'n/a')}`;
    console.log(s);
    if (opts.age != null && l.ageDays >= opts.age) console.log('  > candidate (age >= ' + opts.age + 'd) — preview: ' + l.preview);
    if (opts.owner && l.meta.owner && l.meta.owner.toLowerCase() === opts.owner.toLowerCase()) console.log('  > matched owner');
  }
})();
