#!/usr/bin/env node
// scripts/verify-today-mentions.js
// ESM-converted from scripts/verify-today-mentions.cjs
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
function run(cmd){
  try { return execSync(cmd, { encoding: 'utf8' }).trim(); }
  catch (err) { return ''; }
}
// Ensure we have an up-to-date main to diff against
run('git fetch origin main --quiet');
const diffRange = process.env.GITHUB_BASE_REF && process.env.GITHUB_HEAD_REF
  ? `${process.env.GITHUB_BASE_REF}...${process.env.GITHUB_HEAD_REF}`
  : 'origin/main...HEAD';
const changedRaw = run(`git diff --name-only ${diffRange}`);
if (!changedRaw) {
  console.log('No changed files detected (diff empty) — skipping docs/_today verification.');
  process.exit(0);
}
const changed = changedRaw.split(/\r?\n/).filter(Boolean);
const docsChanged = changed.filter(f => f.startsWith('docs/') && !f.startsWith('docs/_today/'));
if (docsChanged.length === 0) {
  console.log('No docs/ changes (outside docs/_today/) detected — OK.');
  process.exit(0);
}
const todayFiles = ['docs/_today/TODO.md','docs/_today/CURRENT-STATUS.md'];
for (const tf of todayFiles) {
  if (!fs.existsSync(path.resolve(tf))) {
    console.error(`Missing ${tf} — create it or ensure docs/_today exists.`);
    process.exit(2);
  }
}
const todayText = todayFiles.map(f => fs.readFileSync(path.resolve(f), 'utf8')).join('\n');
const missing = [];
for (const f of docsChanged) {
  const basename = path.basename(f);
  const short = f.replace(/^docs\//, '');
  const matched = todayText.includes(basename) || todayText.includes(short) || todayText.includes(`#${process.env.GITHUB_REF_NAME || ''}`);
  if (!matched) missing.push(f);
}
if (missing.length) {
  console.error('\nERROR: docs/_today does not reference the following changed docs files:');
  for (const m of missing) console.error(`  - ${m}`);
  console.error('\nPolicy: when you change files under docs/, add a short entry to docs/_today/TODO.md or CURRENT-STATUS.md mentioning the file and a 1-line summary.');
  console.error('Example: "- [ ] docs/guide/xyz.md — update API example for v2"');
  process.exit(1);
}
console.log('docs/_today verification: all changed docs are referenced — OK');
process.exit(0);
