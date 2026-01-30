#!/usr/bin/env node
/* Check for changes to protected paths (Lock/, tmp/) and fail when found.
   Usage:
     - Local precommit (no args): checks staged files
     - CI (provide --base-ref or rely on GITHUB_BASE_REF): checks diff against base ref
*/
import { execSync } from 'child_process';
import fs from 'fs';

function run(cmd) {
  try { return execSync(cmd, { encoding: 'utf8' }).trim(); }
  catch (err) { return ''; }
}

const PROTECTED = ['Lock/', 'tmp/'];
const args = process.argv.slice(2);
let paths = [];

// If a base ref is provided (CI), compare against it
const baseRefArgIndex = args.indexOf('--base-ref');
let baseRef = process.env.GITHUB_BASE_REF || null;
if (baseRefArgIndex !== -1 && args[baseRefArgIndex + 1]) baseRef = args[baseRefArgIndex + 1];

if (baseRef) {
  // Ensure base ref is available
  // Use git to list changed files between baseRef and HEAD
  // Fetching is expected to be handled by CI (actions/checkout with fetch-depth: 0)
  const diff = run(`git diff --name-only origin/${baseRef}...HEAD`);
  paths = diff ? diff.split(/\r?\n/).filter(Boolean) : [];
} else {
  // Default to staged files for local pre-commit
  const staged = run('git diff --name-only --cached');
  paths = staged ? staged.split(/\r?\n/).filter(Boolean) : [];
}

const violations = paths.filter(p => PROTECTED.some(prot => p.startsWith(prot)));
if (violations.length) {
  console.error('\nERROR: Changes detected in protected paths (blocked):');
  for (const v of violations) console.error('  -', v);
  console.error('\nGuidance:');
  console.error('  - Do NOT commit files under `Lock/` (use the lock protocol instead).');
  console.error('  - Do NOT commit build or temporary artifacts under `tmp/`.');
  console.error('\nIf you believe this is a false positive, explain the reason in the PR and ask a maintainer to override.');
  process.exitCode = 2;
  process.exit(2);
}

console.log('OK — no changes to protected paths detected.');
process.exit(0);
