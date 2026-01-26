#!/usr/bin/env node
// scripts/clean-issues.cjs — CommonJS (works regardless of package type)
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pendingPath = path.join(root, 'data', 'pending-issues.json');
const issuesPath = path.join(root, 'data', 'issues.json');

function backup(src) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const destDir = path.join(root, 'data', 'backups');
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, path.basename(src) + '.' + stamp + '.bak');
  fs.copyFileSync(src, dest);
  return dest;
}

function filterPending() {
  if (!fs.existsSync(pendingPath)) return { before:0, after:0 };
  const json = JSON.parse(fs.readFileSync(pendingPath, 'utf8'));
  const before = (json.issues || []).length;
  const filtered = (json.issues || []).filter(i => {
    const text = String(i.description || i.id || '');
    return /\[bug\]/i.test(text);
  });
  json.issues = filtered;
  json.lastUpdated = new Date().toISOString();
  fs.writeFileSync(pendingPath, JSON.stringify(json, null, 2));
  return { before, after: filtered.length };
}

function filterSubmissions() {
  if (!fs.existsSync(issuesPath)) return { before:0, after:0 };
  const json = JSON.parse(fs.readFileSync(issuesPath, 'utf8'));
  const subs = json.submissions || [];
  const before = subs.length;
  const filtered = subs.filter(s => /\[bug\]/i.test(String(s.content || s.description || '')));
  json.submissions = filtered;
  json.lastUpdated = new Date().toISOString();
  fs.writeFileSync(issuesPath, JSON.stringify(json, null, 2));
  return { before, after: filtered.length };
}

(function main() {
  console.log('[clean-issues] starting');
  if (fs.existsSync(pendingPath)) console.log('[clean-issues] backup', backup(pendingPath));
  if (fs.existsSync(issuesPath)) console.log('[clean-issues] backup', backup(issuesPath));

  const p = filterPending();
  console.log('[clean-issues] pending-issues.json:', p.before, '->', p.after, 'removed=', p.before - p.after);

  const s = filterSubmissions();
  console.log('[clean-issues] issues.json.submissions:', s.before, '->', s.after, 'removed=', s.before - s.after);
  console.log('[clean-issues] done');
})();