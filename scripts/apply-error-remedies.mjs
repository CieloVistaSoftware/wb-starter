/**
 * APPLY THE REMEDIES THE ERROR LOG ALREADY KNOWS ABOUT
 * ===================================================
 * #1051. John: "if error log says Fixable why isn't it automatically fixed?"
 *
 * Because nothing ran it. data/fix-registry.json records, per error signature,
 * an analysis, a solution, a `fixable` flag, a `remedy` — a runnable command —
 * and a `verify`. error-logger.js copies `fixable` and `remedy` onto the logged
 * error so the UI can show them, and that was the end of the chain. "Fixable"
 * was a label, not an action.
 *
 * WHERE A REMEDY IS ALLOWED TO COME FROM
 * --------------------------------------
 * The registry, and only the registry. The error log is written by page
 * runtime: its contents are DATA, produced by whatever the page happened to
 * log. Taking a command out of a log entry and running it would mean executing
 * a string supplied by the thing being diagnosed. So the log is read for one
 * purpose — which SIGNATURES are currently occurring — and the command is then
 * looked up in the checked-in registry by that signature. A signature with no
 * registry entry does nothing at all.
 *
 * WHY THE VERIFY IS NOT OPTIONAL
 * ------------------------------
 * The registry's own notes on the one auto-fixable signature record that the
 * pre-2026-09-05 version of that same `--fix` DAMAGED 13 FILES, because it was
 * trusted without a verify. So: run the remedy, then run the verify, and if the
 * verify does not pass, say so loudly and report the fix as NOT applied. An
 * entry that is `fixable` but carries no `verify` is skipped — it is not
 * eligible, whatever the flag says.
 *
 *   node scripts/apply-error-remedies.mjs            # apply
 *   node scripts/apply-error-remedies.mjs --dry-run  # say what would run
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry-run');

// The log this reads can be pointed elsewhere, so the runner can be proven
// against a fixture instead of only against whatever happens to be in today's
// log — which is usually empty, and an empty log makes a broken runner look
// exactly like a working one.
const logArg = process.argv.find((a) => a.startsWith('--log='));
const LOG_PATH = logArg ? logArg.slice('--log='.length) : 'data/errors.json';

function readJson(rel) {
  const full = path.isAbsolute(rel) ? rel : path.join(root, rel);
  if (!existsSync(full)) return null;
  try {
    return JSON.parse(readFileSync(full, 'utf8'));
  } catch (err) {
    console.error(`[remedies] ${rel} is not readable JSON: ${err.message}`);
    return null;
  }
}

/**
 * A stamp per file, so the remedy's edits are visible whatever state the tree
 * was already in.
 *
 * This used to diff `git status --porcelain` membership before and after. That
 * only sees a file whose git STATUS changes, and a file that was already
 * modified — or already untracked — keeps the same status when a remedy
 * rewrites it. Demonstrated against the #1051 acceptance fixture: the remedy
 * removed `x-card` from an untracked file and the runner reported "no files
 * changed", because the fixture was in the `before` set too. In a tree with
 * dirty files (this repo routinely has 25) a remedy could rewrite any of them
 * invisibly, which is precisely the blindness that let the 13-file damage go
 * unnoticed.
 *
 * mtime+size is enough to see an edit and costs one stat per file.
 */
const STAMP_SKIP = new Set(['node_modules', '.git', 'test-results', 'coverage', 'dist', '.playwright-artifacts']);

function fileStamps(dir = root, out = new Map()) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (STAMP_SKIP.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { fileStamps(full, out); continue; }
    try {
      const s = statSync(full);
      out.set(path.relative(root, full).split('\\').join('/'), `${s.mtimeMs}:${s.size}`);
    } catch { /* vanished mid-walk */ }
  }
  return out;
}

/** Paths whose content stamp differs between two snapshots. */
function diffStamps(before, after) {
  const changed = [];
  for (const [file, stamp] of after) {
    if (before.get(file) !== stamp) changed.push(file);
  }
  for (const file of before.keys()) if (!after.has(file)) changed.push(`${file} (deleted)`);
  return changed.sort();
}

function run(command) {
  try {
    const out = execSync(command, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, out };
  } catch (err) {
    return { ok: false, out: `${err.stdout || ''}${err.stderr || ''}`.trim() || String(err.message) };
  }
}

const registry = readJson('data/fix-registry.json');
if (!registry || !registry.entries) {
  console.error('[remedies] data/fix-registry.json has no entries — nothing can be applied.');
  process.exit(1);
}

const log = readJson(LOG_PATH);
const entries = (log && log.errors) || [];

// Which signatures are currently occurring. The log contributes IDENTITY only.
const occurring = new Set(
  entries
    .filter((e) => e && typeof e.signature === 'string' && !e.testOrigin)
    .map((e) => e.signature),
);

if (!occurring.size) {
  console.log(`[remedies] ${entries.length} error(s) in the log, none with a signature to act on. Nothing to do.`);
  process.exit(0);
}

const eligible = [];
const skipped = [];
for (const signature of occurring) {
  const known = registry.entries[signature];
  if (!known) {
    skipped.push([signature, 'no registry entry — needs analysis first']);
    continue;
  }
  if (!known.fixable) {
    skipped.push([signature, 'not mechanically fixable — a human has to choose']);
    continue;
  }
  if (!known.remedy) {
    skipped.push([signature, 'marked fixable but carries no remedy command']);
    continue;
  }
  if (!known.verify) {
    // Deliberately refused, not warned about. See the header: a remedy without
    // a verify is exactly what damaged 13 files.
    skipped.push([signature, 'marked fixable but carries no verify — refusing to run it blind']);
    continue;
  }
  eligible.push([signature, known]);
}

for (const [sig, why] of skipped) console.log(`[remedies] skip  ${sig}\n            ${why}`);

if (!eligible.length) {
  console.log(`[remedies] Nothing eligible to apply (${skipped.length} signature(s) skipped).`);
  process.exit(0);
}

let failures = 0;
for (const [signature, known] of eligible) {
  console.log(`\n[remedies] ${signature}`);
  console.log(`            remedy: ${known.remedy}`);
  console.log(`            verify: ${known.verify}`);
  if (known.issue) console.log(`            issue:  #${known.issue}`);

  if (DRY) {
    console.log('            (dry run — not executed)');
    continue;
  }

  const before = fileStamps();
  const applied = run(known.remedy);
  if (!applied.ok) {
    console.error(`[remedies] FAILED to apply — the remedy exited non-zero:\n${applied.out}`);
    failures++;
    continue;
  }

  const touched = diffStamps(before, fileStamps());
  const verified = run(known.verify);

  if (!verified.ok) {
    // The remedy ran and the verify says the fault is still there. That is the
    // 13-file scenario. Report it as unfixed and name what was touched, so the
    // damage is visible rather than discovered later.
    console.error(`[remedies] NOT FIXED — the remedy ran but its verify failed.`);
    if (touched.length) console.error(`            files it changed: ${touched.join(', ')}`);
    console.error(`            check these before committing anything.`);
    console.error(verified.out.split('\n').slice(0, 12).map((l) => `            ${l}`).join('\n'));
    failures++;
    continue;
  }

  console.log(`[remedies] FIXED — verify passes.`);
  console.log(touched.length
    ? `            files changed: ${touched.join(', ')}`
    : `            no files changed (the fault was already gone)`);
}

if (failures) {
  console.error(`\n[remedies] ${failures} remedy/remedies did not end in a verified fix.`);
  process.exit(1);
}
console.log(DRY
  ? `\n[remedies] ${eligible.length} signature(s) WOULD run. Nothing was executed or verified.`
  : `\n[remedies] ${eligible.length} signature(s) handled, all verified.`);
