#!/usr/bin/env node
/**
 * site-migrate -- propose a WB Starter page for one existing HTML page (#982).
 *
 *   site-migrate <file.html>                  print the review list and the proposed page
 *   site-migrate <file.html> --write          write them to ./site-migrate-out
 *   site-migrate <file.html> --out dir --write
 *
 * Assisted, not autonomous: every change is listed with its reason for a
 * person to review. It writes only with --write, and never over its input.
 */
import { mkdirSync, realpathSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { migrate } from '../lib/migrate.js';

const HELP = `
site-migrate -- propose a WB Starter page for one existing HTML page

Usage: site-migrate <file.html> [--out dir] [--write]

  (no flags)   print the review list and the proposed page; write nothing
  --write      write pages/<name>.html and <name>.migration.md to --out
  --out dir    where --write writes (default: ./site-migrate-out)

Every change is listed with its reason. Nothing is final until a person has
reviewed it. The input file is never changed.
`;

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--write' || a === '--help' || a === '-h') out[a.replace(/^-+/, '')] = true;
    else if (a === '--out') out.out = argv[++i];
    else if (a.startsWith('--')) { console.error(`✖ site-migrate: unknown option ${a}`); process.exit(2); }
    else out._.push(a);
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (args.help || args.h || args._.length !== 1) {
  console.log(HELP);
  process.exit(args._.length === 1 || args.help || args.h ? 0 : 2);
}
const file = resolve(args._[0]);
if (!existsSync(file)) {
  console.error(`✖ site-migrate: ${args._[0]} does not exist.`);
  process.exit(2);
}
if (args.out === undefined && process.argv.includes('--out')) {
  console.error('✖ site-migrate: --out needs a folder.');
  process.exit(2);
}

let result;
try {
  result = await migrate(file);
} catch (err) {
  console.error(`✖ site-migrate: ${err.message}`);
  process.exit(1);
}

if (!args.write) {
  console.log(result.report);
  console.log(`## Proposed page: pages/${result.name}.html\n\n\`\`\`html\n${result.page}\`\`\`\n`);
  console.log('Nothing was written. Add --write to write these files.');
  process.exit(result.checks.ok ? 0 : 1);
}

if (!result.checks.ok) {
  console.log(result.report);
  console.error('✖ site-migrate: the proposed page failed its checks, so nothing was written.');
  process.exit(1);
}

const outDir = resolve(args.out || 'site-migrate-out');
const pagePath = join(outDir, 'pages', `${result.name}.html`);
const reportPath = join(outDir, `${result.name}.migration.md`);
const input = realpathSync(file);
for (const target of [pagePath, reportPath]) {
  if (existsSync(target) && realpathSync(target) === input) {
    console.error(`✖ site-migrate: writing ${relative(process.cwd(), target)} would overwrite the input. Choose another --out.`);
    process.exit(1);
  }
}
mkdirSync(join(outDir, 'pages'), { recursive: true });
writeFileSync(pagePath, result.page);
writeFileSync(reportPath, result.report);
const r = result.result;
console.log(`site-migrate: ${r.findings.length} changes, ${r.unclassified.length} unclassified, ${r.assets.length} assets.
  wrote ${relative(process.cwd(), pagePath) || pagePath}
  wrote ${relative(process.cwd(), reportPath) || reportPath}
Review the report before using the page.`);
