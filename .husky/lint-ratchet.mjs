#!/usr/bin/env node
/**
 * Lint gate — zero problems, errors and warnings alike (#1932).
 *
 * This was a ratchet (#840): a per-file baseline in .husky/lint-baseline.json
 * froze existing problems and refused only a file whose count went up. That let
 * 225 warnings sit forever. John, 2026-10-16: "no warning allowed". The repo was
 * brought to zero in #1932, so there is nothing left to freeze: any problem, in
 * any file this checks, fails.
 *
 * A warning counts the same as an error: a warning nobody is ever forced to look
 * at is indistinguishable from no rule at all. A genuine false positive gets a
 * one-line eslint-disable comment that says why.
 *
 * MODES
 *   --staged     Pre-commit path: check staged files only. Fast.
 *   --all        Check src, scripts and tests. For a manual audit.
 * tests/compliance/lint-has-no-errors.spec.ts checks the whole repository in CI.
 */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const LINT_ROOTS = ['src', 'scripts', 'tests'];

const mode = process.argv.includes('--staged') ? 'staged' : 'all';

/** Repo-relative POSIX path, for messages. */
const key = (abs) => relative(REPO, abs).split('\\').join('/');

function runEslint(targets) {
  if (targets.length === 0) return [];
  // ESLint exits 1 when it finds problems. That is the normal case here, not a
  // failure — the whole point is that problems are reported as JSON and judged
  // here. Only a crash (exit >= 2, or unparseable output) is a real error.
  // Invoke ESLint's entry script with the running node binary rather than going
  // through `npx`: on Windows `npx.cmd` is a batch file and execFileSync refuses
  // it outright (EINVAL) without a shell, and shelling out just to re-find a
  // local binary we already know the path to is slower and quoting-fragile.
  const ESLINT_BIN = join(REPO, 'node_modules', 'eslint', 'bin', 'eslint.js');
  if (!existsSync(ESLINT_BIN)) {
    console.error('\n❌ ESLint is not installed — nothing was checked. Run: npm install');
    process.exit(1);
  }
  let stdout;
  try {
    stdout = execFileSync(
      process.execPath,
      [ESLINT_BIN, ...targets, '-f', 'json'],
      { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] },
    );
  } catch (err) {
    stdout = err.stdout;
    if (!stdout) {
      console.error('\n❌ ESLint could not run at all — nothing was checked.');
      console.error('   This is not a lint failure; it means the check itself is broken.');
      console.error(String(err.stderr || err.message).trim().split('\n').slice(0, 10).join('\n'));
      process.exit(1);
    }
  }
  try {
    return JSON.parse(stdout);
  } catch {
    console.error('\n❌ ESLint produced output that is not JSON — nothing was verified.');
    console.error(String(stdout).slice(0, 800));
    process.exit(1);
  }
}

/** One number per file. Errors and warnings both count: a warning nobody is ever
 *  forced to look at is indistinguishable from no rule at all. */
function tally(results) {
  const counts = {};
  for (const f of results) {
    // "File ignored because no matching configuration was supplied" is not a
    // lint problem -- it is eslint saying it has no opinion about this path.
    // Counting it made *editing* an unconfigured file (scripts/tools/*.ts)
    // look like introducing a defect, and the only ways past the gate were
    // to revert the edit or invent config for a file nobody lints. A file with
    // no rules applied to it cannot have broken one.
    const real = (f.messages || []).filter(
      (m) => !(m.ruleId === null && /File ignored/.test(m.message || '')),
    );
    if (real.length > 0) counts[key(f.filePath)] = real.length;
  }
  return counts;
}


let targets;
if (mode === 'staged') {
  const staged = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
    cwd: REPO, encoding: 'utf8',
  })
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => /\.(js|mjs|cjs|ts)$/.test(p))
    .filter((p) => LINT_ROOTS.some((r) => p.startsWith(r + '/')))
    // Deleted/renamed-away paths are in the diff but not on disk.
    .filter((p) => existsSync(join(REPO, p)));

  if (staged.length === 0) {
    console.log('   (lint: no staged JS/TS files under src, scripts or tests — skipped)');
    process.exit(0);
  }
  targets = staged;
  console.log(`🔎 Lint: checking ${staged.length} staged file(s)…`);
} else {
  targets = LINT_ROOTS;
  console.log('🔎 Lint: checking all of', LINT_ROOTS.join(', '), '…');
}

const counts = tally(runEslint(targets));

const failing = Object.entries(counts);

if (failing.length > 0) {
  const total = failing.reduce((a, [, n]) => a + n, 0);
  console.error('');
  console.error(`❌ LINT — ${total} problem(s) in ${failing.length} file(s). The rule is zero, warnings included (#1932).`);
  console.error('');
  for (const [file, n] of failing) console.error(`     ${file}   ${n}`);
  console.error('');
  console.error('   See exactly what they are:');
  console.error(`     npx eslint ${failing.map(([file]) => file).join(' ')}`);
  console.error('');
  console.error('   Fix the finding. If it is a false positive, disable that one line with a');
  console.error('   comment explaining why, so the next reader can see the reasoning.');
  console.error('');
  process.exit(1);
}

console.log('✅ Lint: zero problems.');
process.exit(0);
