#!/usr/bin/env node
/**
 * create-wb-starter -- make a new website that USES wb-starter (#813, #771).
 *
 * John, 2026-09-29: "I want a cli that allows me to create a website which uses
 * wb-starter", with wb-starter as an npm dependency. This used to copy the
 * whole wb-starter repo (45 MB: its demos, docs, tests and release tooling)
 * into the new folder: a fork of the framework, not a site built on it (#771).
 *
 * Now a new site holds only what is its own -- index.html, config/site.json,
 * pages/, styles/ -- and depends on the `wb-starter` package, whose CLI
 * (`wb-starter serve` / `wb-starter build`) runs and publishes it.
 *
 *   npm create wb-starter my-site
 *   npx create-wb-starter my-site [--name "My Site"] [--wb-starter <version or path>]
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, cpSync, renameSync, statSync } from 'node:fs';
import { join, dirname, resolve, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = join(HERE, '..', 'template');
const OWN_VERSION = JSON.parse(readFileSync(join(HERE, '..', 'package.json'), 'utf8')).version;

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) out[a.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    else out._.push(a);
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const rawTarget = args._[0];
if (!rawTarget || args.help) {
  console.log(`
Usage: npm create wb-starter <project-directory> [--name "My Site"]

Example:
  npm create wb-starter my-site
  cd my-site
  npm install
  npm start
`);
  process.exit(rawTarget ? 0 : 1);
}

const targetDir = resolve(process.cwd(), rawTarget);
if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
  fail(`"${rawTarget}" already exists and is not empty. Choose a new directory or empty it first.`);
}
if (!existsSync(TEMPLATE_DIR)) fail(`Bundled template missing at ${TEMPLATE_DIR} -- this package was not built correctly.`);

const dirName = basename(targetDir);
const packageName = dirName.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'my-site';
const siteName = typeof args.name === 'string' ? args.name
  : dirName.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
// The same major as this scaffolder, so a new site starts on the release it
// was written for. --wb-starter overrides it: a version, or a path to a local
// checkout (how the end-to-end test installs the repo it is testing).
let wbStarter = typeof args['wb-starter'] === 'string' ? args['wb-starter'] : `^${OWN_VERSION.split('.')[0]}.0.0`;
if (existsSync(wbStarter)) wbStarter = `file:${resolve(wbStarter)}`;

const TOKENS = {
  __PROJECT_NAME__: packageName,
  __SITE_NAME__: siteName,
  __YEAR__: String(new Date().getFullYear()),
  __WB_STARTER_VERSION__: wbStarter,
};
// JSON-escaped where the value lands inside a JSON string.
const fill = (text, json) => text.replace(/__[A-Z_]+__/g, (t) => {
  if (!(t in TOKENS)) return t;
  return json ? JSON.stringify(TOKENS[t]).slice(1, -1) : TOKENS[t];
});

console.log(`\nCreating ${siteName} in ./${relative(process.cwd(), targetDir) || '.'} ...`);
mkdirSync(targetDir, { recursive: true });
cpSync(TEMPLATE_DIR, targetDir, { recursive: true });

// npm drops .gitignore from published packages, so the template ships it as
// _gitignore and it is renamed here.
if (existsSync(join(targetDir, '_gitignore'))) renameSync(join(targetDir, '_gitignore'), join(targetDir, '.gitignore'));

const walk = (dir) => readdirSync(dir).flatMap((e) => {
  const p = join(dir, e);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
for (const file of walk(targetDir)) {
  if (!/\.(html|json|md|css)$/.test(file)) continue;
  const before = readFileSync(file, 'utf8');
  const after = fill(before, file.endsWith('.json'));
  if (after !== before) writeFileSync(file, after);
}

const cd = targetDir === process.cwd() ? '' : `  cd ${rawTarget}\n`;
console.log(`
✓ Done.

Next steps:
${cd}  npm install
  npm start

Edit pages/*.html and config/site.json, and reload. When it is ready:
  npm run build     (writes dist/ for any static host)
`);
