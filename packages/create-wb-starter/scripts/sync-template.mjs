#!/usr/bin/env node
/**
 * Copies the allowlisted parts of the wb-starter repo (its parent, three
 * levels up from this file) into ./template, so `create-wb-starter` ships a
 * real, working copy of the site -- not a live clone/fetch at scaffold time.
 * Run this before publishing a new version of the create-wb-starter package.
 *
 * Deliberately excludes this repo's OWN dev/CI/session cruft: .claude/,
 * .git/, .github/, .husky/, node_modules/, test-result/compliance-result
 * dumps, verify-*.log debugging artifacts, the vscode/ extension subproject,
 * status/ and articles/ (CieloVista's own internal reports/marketing), and
 * the duplicate server/server.js (root server.js is the one package.json's
 * start script actually runs).
 */
import { existsSync, mkdirSync, rmSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const TEMPLATE_DIR = join(__dirname, '..', 'template');

const DIRS = [
  'pages', 'demos', 'docs', 'src', 'config', 'public', 'scripts',
  'tests', 'templates', 'files', 'images', 'assets',
];

const FILES = [
  'index.html', 'project-index.html', 'server.js', 'manifest.json',
  'favicon.png', 'favicon.svg', 'sw.js', '.gitignore', 'LICENSE',
  'playwright.config.ts', 'eslint.config.js', 'global.d.ts',
];

rmSync(TEMPLATE_DIR, { recursive: true, force: true });
mkdirSync(TEMPLATE_DIR, { recursive: true });

let copiedDirs = 0;
let copiedFiles = 0;
let skipped = [];

for (const dir of DIRS) {
  const src = join(REPO_ROOT, dir);
  if (!existsSync(src)) { skipped.push(dir); continue; }
  cpSync(src, join(TEMPLATE_DIR, dir), { recursive: true });
  copiedDirs++;
}

for (const file of FILES) {
  const src = join(REPO_ROOT, file);
  if (!existsSync(src)) { skipped.push(file); continue; }
  cpSync(src, join(TEMPLATE_DIR, file));
  copiedFiles++;
}

// package.json is generated fresh, not copied verbatim -- the target
// project isn't the wb-starter repo itself, so its name/version/repository
// shouldn't claim to be.
const sourcePkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'));
const templatePkg = {
  name: '__PROJECT_NAME__',
  version: '0.1.0',
  type: sourcePkg.type,
  description: 'A website built with wb-starter -- zero-build behaviors, schema-first MVVM.',
  main: sourcePkg.main,
  scripts: sourcePkg.scripts,
  'scripts-info': sourcePkg['scripts-info'],
  keywords: sourcePkg.keywords,
  license: sourcePkg.license,
  dependencies: sourcePkg.dependencies,
  customElements: sourcePkg.customElements,
  devDependencies: sourcePkg.devDependencies,
};
writeFileSync(join(TEMPLATE_DIR, 'package.json'), JSON.stringify(templatePkg, null, 2) + '\n');

console.log(`Synced ${copiedDirs} directories, ${copiedFiles} files (+ generated package.json) into template/`);
if (skipped.length) console.log(`Skipped (not found in repo root): ${skipped.join(', ')}`);
