#!/usr/bin/env node
// scripts/clean-issues.mjs (ESM)
import fs from 'fs/promises';
import { existsSync, copyFileSync } from 'fs';
import path from 'path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const pendingPath = path.join(root, 'data', 'pending-issues.json');
const issuesPath = path.join(root, 'data', 'issues.json');
const out = (...a) => console.log('[clean-issues]', ...a);

function backupSync(src) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const destDir = path.join(root, 'data', 'backups');
  if (!existsSync(destDir)) fs.mkdir(destDir, { recursive: true });
  const dest = path.join(destDir, path.basename(src) + '.' + stamp + '.bak');
  copyFileSync(src, dest);
  return dest;
}

async function keepOnlyBugsInPending() {
  if (!existsSync(pendingPath)) return { removed: 0 };
  const raw = await fs.readFile(pendingPath, 'utf8');
  const json = JSON.parse(raw);
  const before = (json.issues || []).length;
  const filtered = (json.issues || []).filter(i => typeof (i.description || i.id || '') === 'string' && /\[bug\]/i.test(i.description || i.id || ''));
  json.issues = filtered;
  json.lastUpdated = new Date().toISOString();
  await fs.writeFile(pendingPath, JSON.stringify(json, null, 2), 'utf8');
  return { before, after: filtered.length, removed: before - filtered.length };
}

async function keepOnlyBugsInSubmissions() {
  if (!existsSync(issuesPath)) return { removed: 0 };
  const raw = await fs.readFile(issuesPath, 'utf8');
  const json = JSON.parse(raw);
  const subs = json.submissions || [];
  const before = subs.length;
  const filtered = subs.filter(s => /\[bug\]/i.test(String(s.content || s.description || '')));
  json.submissions = filtered;
  json.lastUpdated = new Date().toISOString();
  await fs.writeFile(issuesPath, JSON.stringify(json, null, 2), 'utf8');
  return { before, after: filtered.length, removed: before - filtered.length };
}

(async function main(){
  out('starting');
  if (existsSync(pendingPath)) out('backing up', pendingPath, '->', backupSync(pendingPath));
  if (existsSync(issuesPath)) out('backing up', issuesPath, '->', backupSync(issuesPath));

  const r1 = await keepOnlyBugsInPending();
  out(`pending-issues.json: before=${r1.before} after=${r1.after} removed=${r1.removed}`);

  const r2 = await keepOnlyBugsInSubmissions();
  out(`issues.json.submissions: before=${r2.before} after=${r2.after} removed=${r2.removed}`);

  out('done');
})();
