#!/usr/bin/env node
/**
 * Refuse a commit whose STAGED source carries a stray control byte (#1162).
 *
 * Runs in the fast part of .husky/pre-commit. Before this, the only check was
 * tests/compliance/no-control-characters-in-source.spec.ts, which runs inside the
 * 10th-commit gate: on 2026-09-14 a literal ESC written into
 * scripts/lib/batch-verdict.mjs:183 was found 59 minutes after it was written,
 * as one of 14 "new failures".
 *
 * It reads the INDEX, not the working tree (#1065): the commit is what gets
 * checked, so a byte fixed on disk but still staged is still refused, and a
 * byte only in an unstaged edit is not this commit's problem.
 *
 * Which files and which bytes come from scripts/lib/control-bytes.mjs, the same
 * definition the compliance spec uses.
 *
 * Usage: node scripts/check-staged-control-bytes.mjs     (exit 1 on any finding)
 */
import { execFileSync } from 'node:child_process';
import { findControlBytes, isScannedPath } from './lib/control-bytes.mjs';

const NUL = String.fromCharCode(0);

// The inherited environment is kept ON PURPOSE, unlike the suite (#1161). Inside
// the hook, GIT_DIR / GIT_INDEX_FILE name the index being committed, which is
// exactly the index this must read. A caller that runs this against some other
// repo (the guard's throwaway repos) strips them itself. cwd is the repo root.
const git = (args, opts = {}) =>
  execFileSync('git', args, { maxBuffer: 64 * 1024 * 1024, ...opts });

const staged = git(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'], { encoding: 'utf8' })
  .split(NUL)
  .filter(Boolean)
  .filter(isScannedPath);

const findings = [];
for (const file of staged) {
  const blob = git(['show', `:${file}`]);
  for (const hit of findControlBytes(blob)) {
    findings.push(`${file}:${hit.line}:${hit.column} ${hit.name}`);
  }
}

if (findings.length) {
  console.error(`\n❌ Control bytes in staged source (#1162) — ${findings.length} found:`);
  for (const f of findings.slice(0, 40)) console.error(`   ${f}`);
  if (findings.length > 40) console.error(`   ...and ${findings.length - 40} more`);
  console.error(
    '\n   These are invisible in an editor and in git diff. The usual cause is an\n' +
    '   escape (\\b, an ANSI escape) decoded into its byte when the file was written.\n' +
    '   Build the character from its code instead: String.fromCharCode(27).\n'
  );
  process.exit(1);
}

console.log(`✅ Control bytes: ${staged.length} staged source file(s) clean.`);
