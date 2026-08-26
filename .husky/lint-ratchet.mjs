#!/usr/bin/env node
/**
 * Lint ratchet — issue #840.
 *
 * WHY A RATCHET AND NOT A PASS/FAIL GATE
 * --------------------------------------
 * Type-aware linting had never run on this repo. Switching it on surfaces a pile
 * of pre-existing problems that nobody introduced today and nobody can fix in one
 * sitting. A gate that fails on non-zero would therefore fail on the very first
 * commit after landing, every commit after that, and for everyone.
 *
 * That is not a strict gate, it is a broken one. The observed behavior in this
 * repo is already on record: when the pre-commit hook bumped the version on every
 * commit, 16 commits in a single day used --no-verify purely to dodge it — and
 * every one of those skipped ALL the other checks with it. A gate too strict to
 * pass gets bypassed, and a bypassed gate is worse than no gate, because it also
 * takes the checks that WERE working down with it.
 *
 * So the rule here is: never fail on the count being non-zero. Fail only on the
 * count going UP. Existing debt is recorded, frozen, and allowed through. New
 * debt is refused. The count can only fall.
 *
 * HOW IT RATCHETS
 * ---------------
 * .husky/lint-baseline.json holds a per-file problem count. Per-file, not one
 * repo-wide total, for two reasons: a single total makes the pre-commit check
 * lint all 839 files (~67s, too slow to run every time), and a single total lets
 * someone add errors in one file while deleting another file's and net to zero.
 *
 * On commit we lint only the STAGED files and compare each against its own
 * baseline entry. Untouched files are irrelevant — they cannot have changed.
 *
 * When a file's count DROPS, the baseline is lowered automatically and re-staged.
 * That is the ratchet actually tightening: debt you pay off can never be
 * re-borrowed. Without this the baseline would stay at its landing value forever
 * and the whole thing would just be a very slow no-op.
 *
 * MODES
 *   --baseline   Re-measure everything, rewrite the baseline. Run this when
 *                intentionally accepting a new floor (e.g. after adding a rule).
 *   --staged     Pre-commit path: check staged files only. Fast.
 *   --all        Check every file against the baseline. For CI / manual audit.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const BASELINE_PATH = join(HERE, 'lint-baseline.json');
const LINT_ROOTS = ['src', 'scripts', 'tests'];

const mode =
  process.argv.includes('--baseline') ? 'baseline'
  : process.argv.includes('--staged') ? 'staged'
  : 'all';

/** Repo-relative POSIX path — the baseline must not encode Windows separators. */
const key = (abs) => relative(REPO, abs).split('\\').join('/');

function runEslint(targets) {
  if (targets.length === 0) return [];
  // ESLint exits 1 when it finds problems. That is the normal case here, not a
  // failure — the whole point is that problems exist and are tolerated up to the
  // baseline. Only a crash (exit >= 2, or unparseable output) is a real error.
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
    // look like introducing a defect, and the only ways past the ratchet were
    // to revert the edit or invent config for a file nobody lints. A file with
    // no rules applied to it cannot have broken one.
    const real = (f.messages || []).filter(
      (m) => !(m.ruleId === null && /File ignored/.test(m.message || '')),
    );
    if (real.length > 0) counts[key(f.filePath)] = real.length;
  }
  return counts;
}

function loadBaseline() {
  if (!existsSync(BASELINE_PATH)) {
    console.error(`\n❌ ${key(BASELINE_PATH)} is missing.`);
    console.error('   Regenerate it with:  npm run lint:baseline');
    process.exit(1);
  }
  return JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
}

function saveBaseline(counts, note) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const payload = {
    _comment: [
      'Generated by .husky/lint-ratchet.mjs — do not hand-edit.',
      'Per-file lint problem counts (errors + warnings) frozen as the ceiling.',
      'Pre-commit fails only if a STAGED file exceeds its number here.',
      'Numbers fall automatically when you fix things; they never rise on their own.',
      'To raise a number you must run `npm run lint:baseline` deliberately and say why.',
      note,
    ].filter(Boolean),
    generated: new Date().toISOString().slice(0, 10),
    totalProblems: total,
    filesWithProblems: Object.keys(counts).length,
    files: Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))),
  };
  writeFileSync(BASELINE_PATH, JSON.stringify(payload, null, 2) + '\n');
  return total;
}

// ── baseline ────────────────────────────────────────────────────────────────
if (mode === 'baseline') {
  console.log('📏 Measuring lint baseline across', LINT_ROOTS.join(', '), '…');
  const counts = tally(runEslint(LINT_ROOTS));
  const total = saveBaseline(counts);
  console.log(`✅ Baseline written: ${total} problems across ${Object.keys(counts).length} files.`);
  console.log(`   ${key(BASELINE_PATH)} — commit this file.`);
  process.exit(0);
}

// ── staged / all ────────────────────────────────────────────────────────────
const baseline = loadBaseline();
const base = baseline.files || {};

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
    console.log('   (lint ratchet: no staged JS/TS files under src, scripts or tests — skipped)');
    process.exit(0);
  }
  targets = staged;
  console.log(`🔎 Lint ratchet: checking ${staged.length} staged file(s)…`);
} else {
  targets = LINT_ROOTS;
  console.log('🔎 Lint ratchet: checking all of', LINT_ROOTS.join(', '), '…');
}

const counts = tally(runEslint(targets));

const regressions = [];
const improvements = [];
const checked = mode === 'staged' ? targets : Object.keys({ ...base, ...counts });

for (const file of checked) {
  const now = counts[file] || 0;
  const was = base[file] || 0;
  if (now > was) regressions.push({ file, was, now });
  else if (now < was) improvements.push({ file, was, now });
}

if (regressions.length > 0) {
  const added = regressions.reduce((a, r) => a + (r.now - r.was), 0);
  console.error('');
  console.error(`❌ LINT RATCHET — ${added} new problem(s) in ${regressions.length} file(s).`);
  console.error('');
  console.error('   Pre-existing problems are fine. These are NEW, in files you just changed:');
  console.error('');
  for (const r of regressions) {
    console.error(`     ${r.file}   ${r.was} → ${r.now}   (+${r.now - r.was})`);
  }
  console.error('');
  console.error('   See exactly what they are:');
  console.error(`     npx eslint ${regressions.map((r) => r.file).join(' ')}`);
  console.error('');
  console.error('   The usual cause is an unawaited async call:');
  console.error('       page.evaluate(() => { WB.scan(el); });   // returns before scan finishes');
  console.error('       page.evaluate(async () => { await WB.scan(el); });   // correct');
  console.error('   If a promise is genuinely fire-and-forget, say so explicitly with `void`.');
  console.error('');
  console.error('   Do NOT raise the baseline to get past this. It is the ceiling, not a dial.');
  console.error('   Fix the finding. If it is a false positive, disable that one line with a');
  console.error('   comment explaining why, so the next reader can see the reasoning.');
  console.error('');
  process.exit(1);
}

if (improvements.length > 0) {
  const removed = improvements.reduce((a, r) => a + (r.was - r.now), 0);
  for (const file of Object.keys(base)) {
    if (checked.includes(file)) {
      const now = counts[file] || 0;
      if (now === 0) delete base[file];
      else base[file] = now;
    }
  }
  saveBaseline(base, `Auto-lowered by ${removed} on ${new Date().toISOString().slice(0, 10)}.`);
  // Re-stage so the tightened ceiling travels with the commit that earned it.
  // Same pattern the version stamp above it in the hook already uses.
  try {
    execFileSync('git', ['add', relative(REPO, BASELINE_PATH).split('\\').join('/')], { cwd: REPO });
  } catch { /* not in a commit context (e.g. `--all` run by hand) — nothing to stage */ }
  console.log(`✅ Lint ratchet tightened: ${removed} problem(s) fixed, baseline lowered and staged.`);
  process.exit(0);
}

console.log('✅ Lint ratchet: no new problems.');
process.exit(0);
