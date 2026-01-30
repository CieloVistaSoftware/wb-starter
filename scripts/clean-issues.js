#!/usr/bin/env node
// scripts/clean-issues.js
// - Back up data/issues.json and data/pending-issues.json
// - Remove entries that do NOT contain the literal '[BUG]' (case-insensitive)
// - Update lastUpdated timestamps

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pendingPath = path.join(root, 'data', 'pending-issues.json');
const issuesPath = path.join(root, 'data', 'issues.json');
const out = console.log;

function backup(src) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const destDir = path.join(root, 'data', 'backups');
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, path.basename(src) + '.' + stamp + '.bak');
  fs.copyFileSync(src, dest);
  return dest;
}

function keepOnlyBugsInPending() {
  if (!fs.existsSync(pendingPath)) return { removed: 0 };
  const raw = fs.readFileSync(pendingPath, 'utf8');
  const json = JSON.parse(raw);
  const before = (json.issues || []).length;
  const filtered = (json.issues || []).filter(i => typeof (i.description || i.id || '') === 'string' && /\[bug\]/i.test(i.description || i.id || ''));
  json.issues = filtered;
  json.lastUpdated = new Date().toISOString();
  fs.writeFileSync(pendingPath, JSON.stringify(json, null, 2));
  return { before, after: filtered.length, removed: before - filtered.length };
}

function keepOnlyBugsInSubmissions() {
  if (!fs.existsSync(issuesPath)) return { removed: 0 };
  const raw = fs.readFileSync(issuesPath, 'utf8');
  const json = JSON.parse(raw);
  const subs = json.submissions || [];
  const before = subs.length;
  const filtered = subs.filter(s => /\[bug\]/i.test(String(s.content || s.description || '')));
  json.submissions = filtered;
  json.lastUpdated = new Date().toISOString();
  fs.writeFileSync(issuesPath, JSON.stringify(json, null, 2));
  return { before, after: filtered.length, removed: before - filtered.length };
}

(function main() {
  out('[clean-issues] starting');

  if (fs.existsSync(pendingPath)) out('[clean-issues] backing up', pendingPath, '->', backup(pendingPath));
  if (fs.existsSync(issuesPath)) out('[clean-issues] backing up', issuesPath, '->', backup(issuesPath));

  const r1 = keepOnlyBugsInPending();
  out(`[clean-issues] pending-issues.json: before=${r1.before} after=${r1.after} removed=${r1.removed}`);

  const r2 = keepOnlyBugsInSubmissions();
  out(`[clean-issues] issues.json.submissions: before=${r2.before} after=${r2.after} removed=${r2.removed}`);

  out('[clean-issues] done');
})();
