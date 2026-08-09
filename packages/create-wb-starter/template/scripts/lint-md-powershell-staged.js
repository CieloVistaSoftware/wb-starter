#!/usr/bin/env node
/* eslint-disable no-console */
// Staged-only variant of lint-md-powershell.js — scans only staged markdown files.
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function gitStagedFiles() {
  try {
    const out = execSync('git diff --name-only --cached', { encoding: 'utf8' });
    return out.split(/\r?\n/).filter(Boolean);
  } catch (err) {
    return [];
  }
}

function scanFileText(text, file) {
  const lines = text.split(/\r?\n/);
  const forbidden = [/\b&&\b/, /\|\|/, /;\s*true\b/];
  const shellLikeLang = /^(?:bash|sh|shell|console|text|zsh|cmd|powershell|pwsh)$/i;
  const jsLikeTokens = /\b(const|let|var|function|return)\b|this\.|getAttribute\(|\.dataset\b|\{\{/;
  const commonShellCmd = /\b(git|npx|npm|curl|docker|scp|ssh|ls|cp|mv|systemctl|sed|awk)\b/;

  function looksLikeShellLine(line, lang) {
    if (lang && shellLikeLang.test(lang)) return true;
    if (!lang) {
      if (/^\s*[$#>]/.test(line)) return true;
      if (commonShellCmd.test(line)) return true;
      if (jsLikeTokens.test(line)) return false;
      if (/^\s*<\w+/.test(line)) return false;
    }
    return false;
  }

  let inCode = false;
  let fenceLang = '';
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(/^```\s*(\S*)/);
    if (fence) { inCode = !inCode; fenceLang = inCode ? (fence[1] || '') : ''; continue; }
    if (!inCode) continue;
    if (!looksLikeShellLine(line, fenceLang)) continue;
    if (line.includes('{{') || line.includes('}}') || /^\s*<\w+/.test(line)) continue;
    for (const re of forbidden) if (re.test(line)) hits.push({ line: i + 1, text: line.trim(), pattern: re.toString() });
  }
  return hits;
}

const staged = gitStagedFiles().filter(f => f.endsWith('.md') || f === 'README.md');
if (staged.length === 0) process.exit(0);
let total = 0;
for (const f of staged) {
  if (!fs.existsSync(f)) continue;
  const text = fs.readFileSync(f, 'utf8');
  const hits = scanFileText(text, f);
  if (hits.length) {
    console.error(`\nForbidden PowerShell-unsafe snippets found in staged file: ${f}`);
    for (const h of hits) console.error(`  L${h.line}: ${h.text}    (${h.pattern})`);
    total += hits.length;
  }
}
if (total > 0) { console.error(`\nFound ${total} PowerShell-unsafe snippet(s) in staged files.`); process.exit(1); }
console.log('No PowerShell-unsafe snippets found in staged files.');
process.exit(0);
