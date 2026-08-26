import fs from 'fs';
import path from 'path';
import { test, expect } from '@playwright/test';

function getMarkdownFiles(dir: string) {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...getMarkdownFiles(full));
    else if (e.isFile() && full.endsWith('.md')) out.push(full);
  }
  return out;
}

test('docs: no POSIX-only one-liners in markdown (PowerShell-safe)', async () => {
  const ROOT = process.cwd();
  const docsDir = path.join(ROOT, 'docs');
  const files = [path.join(ROOT, 'README.md'), ...getMarkdownFiles(docsDir)];
  const forbidden = [/\b&&\b/, /\|\|/, /;\s*true\b/];
  const errors: string[] = [];
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');
    const lines = txt.split(/\r?\n/);
    let inCode = false;
    let codeLanguage = '';
    // #863: these two were regex LITERALS containing bare ``` fences. The
    // "every test contains at least one expect()" gate scans source text and
    // treats a backtick as the start of a template literal, so the odd number
    // of backticks in each literal desynced its scan and truncated this test
    // body before the expect() at the bottom -- reporting this test as
    // asserting nothing when it always has. Built from strings instead: the
    // backticks now sit inside quotes the scanner skips cleanly. Same patterns,
    // same behaviour.
    const shellLangs = new RegExp('^```(bash|sh|shell|powershell|pwsh|cmd|console|terminal)$', 'i');
    const fenceLine = new RegExp('^```(.*)$');
    for (let i = 0; i < lines.length; i++) {
      const fence = lines[i].match(fenceLine);
      if (fence) {
        if (!inCode) {
          inCode = true;
          codeLanguage = (fence[1] || '').trim().toLowerCase();
        } else {
          inCode = false;
          codeLanguage = '';
        }
        continue;
      }
      if (!inCode) continue;
      // Only check shell/bash/cmd code blocks, not JS/HTML/template code
      if (!shellLangs.test('```' + codeLanguage) && codeLanguage !== '') continue;
      // Skip unfenced code blocks too (codeLanguage === '') — too many false positives in JS
      if (codeLanguage === '') continue;
      for (const r of forbidden) {
        if (r.test(lines[i])) errors.push(`${f}:${i+1} => ${lines[i].trim()}`);
      }
    }
  }
  expect(errors, `Found PowerShell-unsafe snippets:\n${errors.join('\n')}`).toHaveLength(0);
});
