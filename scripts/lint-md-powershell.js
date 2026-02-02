#!/usr/bin/env node
/* eslint-disable no-console */
// Scan markdown files for POSIX-only one-liners that break in PowerShell
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DOCS = path.join(ROOT, 'docs');
const GLOB = ['**/*.md', 'README.md'];
const forbidden = [/\b&&\b/, /\|\|/, /;\s*true\b/];

function findMarkdownFiles(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...findMarkdownFiles(full));
    else if (e.isFile() && e.name.endsWith('.md')) out.push(full);
  }
  return out;
}

function scanFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const hits = [];
  let inCode = false;
  let fenceLang = '';

  const shellLikeLang = /^(?:bash|sh|shell|console|text|zsh|cmd|powershell|pwsh)$/i;
  const jsLikeTokens = /\b(const |let |var |function\b|=>|\{|\}|\.|dataset|<\w|\{\{)/;
  const commonShellCmd = /\b(git|npx|npm|curl|docker|scp|ssh|ls|cp|mv|systemctl|sed|awk)\b/;

  function looksLikeShellLine(line, lang) {
    if (lang && shellLikeLang.test(lang)) return true;
    // unlabeled code fences: only treat as shell if they look like shell (commands or prompt)
    if (!lang) {
      if (/^\s*[$#>]/.test(line)) return true; // prompt
      if (commonShellCmd.test(line)) return true;
      // avoid false positives for JS/HTML template snippets
      if (jsLikeTokens.test(line)) return false;
    }
    return false;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(/^```\s*(\S*)/);
    if (fence) {
      inCode = !inCode;
      fenceLang = inCode ? (fence[1] || '') : '';
      continue;
    }
    if (!inCode) continue;

    // Only inspect code-fence contents that look like shell snippets
    if (!looksLikeShellLine(line, fenceLang)) continue;

    for (const re of forbidden) {
      if (re.test(line)) hits.push({ line: i + 1, text: line.trim(), pattern: re.toString(), lang: fenceLang });
    }
  }
  return hits;
}

const mdFiles = [path.join(ROOT, 'README.md'), ...findMarkdownFiles(DOCS)];
let total = 0;
for (const f of mdFiles) {
  if (!fs.existsSync(f)) continue;
  const hits = scanFile(f);
  if (hits.length) {
    console.error(`
Forbidden PowerShell-unsafe snippets found in: ${f}`);
    for (const h of hits) console.error(`  L${h.line}: ${h.text}    (${h.pattern})`);
    total += hits.length;
  }
}
if (total > 0) {
  console.error(`\nFound ${total} PowerShell-unsafe snippet(s). See docs/POWERSHELL.md for correct patterns.`);
  process.exit(1);
}
console.log('No PowerShell-unsafe snippets found.');
process.exit(0);
