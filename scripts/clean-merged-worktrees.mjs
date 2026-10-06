#!/usr/bin/env node
/**
 * clean-merged-worktrees.mjs -- remove the worktrees whose work is merged (#1534).
 *
 * John, 2026-10-05: "I want all the folders cleaned after all the merges are
 * complete, don't leave artifacts on my computer." Every local session works in
 * a sibling worktree (Downloads\AI\wb-1462, ...), and each was left behind when
 * its PR merged -- about 29 of them, then 89.
 *
 *   node scripts/clean-merged-worktrees.mjs            # dry run: says what it would do
 *   node scripts/clean-merged-worktrees.mjs --apply    # does it
 *
 * Options: --base <ref> (default origin/main, fetched first unless --no-fetch),
 *          --root <dir> (default: the main checkout's parent directory).
 *
 * WHAT IT REMOVES: a worktree that is a sibling of the main checkout, whose
 * branch tip is already contained in <base>, with no uncommitted change to a
 * tracked file. Everything else is kept and the reason printed: an unmerged
 * branch (an open PR or work in progress), a dirty tree, a detached head.
 * Claude Code's own .claude/worktrees are not siblings and are never touched.
 *
 * THE JUNCTION FIRST (#1129). Each worktree's node_modules is a junction into
 * the main checkout. `git worktree remove --force` and any recursive delete
 * FOLLOW it and empty the real node_modules -- that happened on 2026-10-04.
 * So the link itself is removed (unlink, never a recursive delete) before git
 * is asked to remove the folder.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };

const apply = flag('--apply');
const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

const main = git(process.cwd(), 'rev-parse', '--path-format=absolute', '--git-common-dir').replace(/[\\/]\.git$/, '');
const root = path.resolve(opt('--root', path.dirname(main)));
const base = opt('--base', 'origin/main');
if (!flag('--no-fetch') && base.startsWith('origin/')) {
  try { git(main, 'fetch', '-q', 'origin'); } catch (e) { console.log(`fetch failed (${e.message.split('\n')[0]}); judging against the local ${base}`); }
}

/** `git worktree list --porcelain` -> [{ path, branch }] */
function worktrees() {
  const out = [];
  let cur = null;
  for (const line of git(main, 'worktree', 'list', '--porcelain').split('\n')) {
    if (line.startsWith('worktree ')) { cur = { path: path.resolve(line.slice(9)), branch: null }; out.push(cur); }
    else if (line.startsWith('branch ') && cur) cur.branch = line.slice(7).replace(/^refs\/heads\//, '');
  }
  return out;
}

const same = (a, b) => path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
const removed = [];
const kept = [];

for (const wt of worktrees()) {
  if (same(wt.path, main) || !same(path.dirname(wt.path), root)) continue;
  const name = path.basename(wt.path);
  const keep = (why) => kept.push(`${name}: ${why}`);
  if (!fs.existsSync(wt.path)) { keep('folder already gone (prune clears the record)'); continue; }
  if (!wt.branch) { keep('detached HEAD, nothing to judge merged'); continue; }

  let merged = false;
  try { git(main, 'merge-base', '--is-ancestor', wt.branch, base); merged = true; } catch { /* not contained */ }
  if (!merged) { keep(`${wt.branch} is not merged into ${base}`); continue; }

  const dirty = git(wt.path, 'status', '--porcelain', '--untracked-files=no');
  if (dirty) { keep(`uncommitted changes to tracked files:\n      ${dirty.split('\n').slice(0, 3).join('\n      ')}`); continue; }

  if (!apply) { removed.push(`${name} (${wt.branch}) -- would remove`); continue; }

  // The junction first, as a link: unlink never follows it.
  const nm = path.join(wt.path, 'node_modules');
  let st = null;
  try { st = fs.lstatSync(nm); } catch { /* none */ }
  if (st && st.isSymbolicLink()) fs.unlinkSync(nm);

  git(main, 'worktree', 'remove', '--force', wt.path);
  try { git(main, 'branch', '-D', wt.branch); } catch { /* already gone */ }
  removed.push(`${name} (${wt.branch})`);
}
if (apply) git(main, 'worktree', 'prune');

console.log(`${apply ? 'Removed' : 'Would remove'} ${removed.length}:`);
for (const r of removed) console.log(`  ${r}`);
console.log(`Kept ${kept.length}:`);
for (const k of kept) console.log(`  ${k}`);
if (!apply && removed.length) console.log('\nDry run. Run again with --apply to remove them.');
