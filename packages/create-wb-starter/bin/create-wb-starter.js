#!/usr/bin/env node
/**
 * create-wb-starter -- scaffolds a full copy of wb-starter (pages, demos,
 * docs, src, config, tests, everything) into a new project directory, the
 * same way `npm create vite` works: no live network fetch at scaffold time,
 * the template ships bundled inside this package.
 *
 * Usage: npx create-wb-starter <project-directory>
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = join(__dirname, '..', 'template');

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

const rawTarget = process.argv[2];
if (!rawTarget) {
  console.log(`
Usage: npx create-wb-starter <project-directory>

Example:
  npx create-wb-starter my-site
  cd my-site
  npm install
  npm start
`);
  process.exit(1);
}

const targetDir = resolve(process.cwd(), rawTarget);
const targetIsCwd = targetDir === process.cwd();

if (existsSync(targetDir)) {
  const entries = readdirSync(targetDir);
  if (entries.length > 0) {
    fail(`"${rawTarget}" already exists and is not empty. Choose a new directory or empty it first.`);
  }
} else {
  mkdirSync(targetDir, { recursive: true });
}

if (!existsSync(TEMPLATE_DIR)) {
  fail(`Bundled template missing at ${TEMPLATE_DIR} -- this package was not built correctly.`);
}

console.log(`\nScaffolding wb-starter into ${targetIsCwd ? 'the current directory' : `./${rawTarget}`} ...`);

cpSync(TEMPLATE_DIR, targetDir, { recursive: true });

// The template ships package.json with a __PROJECT_NAME__ placeholder --
// swap it for a valid, derived-from-the-target-directory npm package name
// (lowercase, spaces/invalid chars replaced) rather than making the user
// hand-edit it immediately after scaffolding.
const pkgPath = join(targetDir, 'package.json');
const pkgName = basename(targetDir)
  .toLowerCase()
  .replace(/[^a-z0-9-]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'wb-site';
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.name = pkgName;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

console.log(`
✓ Done.

Next steps:
${targetIsCwd ? '' : `  cd ${rawTarget}\n`}  npm install
  npm start

This copied the full site -- pages/, demos/, docs/, src/, config/, tests/,
everything -- as your own editable project. It's zero-build: no bundler, no
compile step. Edit any file and reload.
`);
