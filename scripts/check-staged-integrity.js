#!/usr/bin/env node
/* eslint-disable no-console */
// Lightweight integrity check for staged HTML/JS files (fast pre-commit alternative).
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function gitStagedFiles() {
  try {
    const out = execSync('git diff --name-only --cached', { encoding: 'utf8' });
    return out.split(/\r?\n/).filter(Boolean);
  } catch (err) { return []; }
}

function checkHtml(file, ROOT) {
  const content = fs.readFileSync(file, 'utf8');
  const linkRegex = /(?:src|href)=['"]([^'"]+)['"]/g;
  let m; const issues = [];
  while ((m = linkRegex.exec(content)) !== null) {
    const linkPath = m[1];
    if (linkPath.startsWith('http') || linkPath.startsWith('#') || linkPath.startsWith('data:') || linkPath.includes('${') || linkPath.includes('{{')) continue;
    const target = linkPath.startsWith('/') ? path.join(ROOT, linkPath) : path.join(path.dirname(file), linkPath);
    const real = target.split('?')[0].split('#')[0];
    if (!fs.existsSync(real)) issues.push({file, link: linkPath, target: real});
  }
  return issues;
}

function checkJsImports(file, ROOT) {
  const content = fs.readFileSync(file, 'utf8');
  const importRegex = /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]/g;
  let m; const issues = [];
  while ((m = importRegex.exec(content)) !== null) {
    const p = m[1];
    if (!p.startsWith('.') && !p.startsWith('/')) continue;
    const target = p.startsWith('/') ? path.join(ROOT, p) : path.join(path.dirname(file), p);
    if (!fs.existsSync(target) && !fs.existsSync(target + '.js') && !fs.existsSync(path.join(target, 'index.js'))) issues.push({file, import: p, target});
  }
  return issues;
}

const ROOT = process.cwd();
const staged = gitStagedFiles().filter(f => f.endsWith('.html') || f.endsWith('.js'));
if (staged.length === 0) { console.log('No staged HTML/JS files to check.'); process.exit(0); }
let jsIssues = [], htmlIssues = [];
for (const f of staged) {
  if (!fs.existsSync(f)) continue;
  if (f.endsWith('.html')) htmlIssues.push(...checkHtml(f, ROOT));
  if (f.endsWith('.js')) jsIssues.push(...checkJsImports(f, ROOT));
}
if (jsIssues.length || htmlIssues.length) {
  console.error('Staged integrity issues:');
  for (const i of jsIssues) console.error(`  JS import missing in ${i.file}: ${i.import} -> ${i.target}`);
  for (const h of htmlIssues) console.error(`  HTML link missing in ${h.file}: ${h.link} -> ${h.target}`);
  process.exit(1);
}
console.log('Staged HTML/JS integrity checks passed.');
process.exit(0);
