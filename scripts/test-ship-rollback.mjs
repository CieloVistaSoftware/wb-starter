/**
 * Guard for #1157: a failed ship deletes only a tag it cut, never an existing
 * release tag. Node-only, milliseconds, a throwaway git repo per case; it never
 * touches this repository's tags.
 *
 * The cases are the two moments a ship can fail:
 *   1. BEFORE the bump (the ratchet refuses): package.json still names the live
 *      release, and its tag must survive. This is the case that deleted v4.0.4.
 *   2. AFTER the bump and tag: exactly the new tag goes, the old one stays.
 * plus the no-op (nothing cut, nothing deleted) and a second pre-existing tag.
 *
 * And #1179: the rollback returns the TREE to HEAD whether or not the release
 * was already staged, which it always is by the time the commit gate refuses.
 */
import { execFileSync } from 'child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { releaseTags, tagsCreatedSince, deleteTagsCreatedSince, restoreTreeToHead } from './lib/ship-rollback.mjs';
import { suiteEnv } from './lib/suite-env.mjs';

let passed = 0;
let failed = 0;
const check = (ok, name, detail = '') => {
  if (ok) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ ${name}${detail ? `\n     ${detail}` : ''}`); }
};

// Hooks set git's redirection variables; a guard that runs inside one must
// not act on the real repo. suiteEnv() strips the whole set (#1161) -- the
// three this used to strip by hand missed the ones git adds when the commit
// is made from a worktree, and the scratch repo's tags went to the real one.
const env = suiteEnv(process.env);

function repo(version, tags) {
  const dir = mkdtempSync(join(tmpdir(), 'wb-ship-rollback-'));
  const git = (...a) => execFileSync('git', a, { cwd: dir, env, stdio: 'pipe', encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'guard@example.invalid');
  git('config', 'user.name', 'guard');
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ version }) + '\n');
  git('add', '-A');
  git('commit', '-q', '-m', 'release');
  for (const t of tags) git('tag', '-a', t, '-m', t);
  return { dir, git };
}

function withRepo(version, tags, fn) {
  const r = repo(version, tags);
  try { fn(r); } finally { rmSync(r.dir, { recursive: true, force: true }); }
}

console.log('Ship rollback deletes only the tags this run cut (#1157):');

withRepo('4.0.4', ['v4.0.3', 'v4.0.4'], ({ dir }) => {
  const before = releaseTags(dir);
  // Failure BEFORE the bump: nothing written, package.json still says 4.0.4.
  const deleted = deleteTagsCreatedSince(dir, before);
  const after = releaseTags(dir);
  check(deleted.length === 0, 'a failure before the bump deletes nothing', `deleted: ${deleted.join(', ')}`);
  check(after.has('v4.0.4'), 'the live release tag v4.0.4 survives (the tag #1157 destroyed)');
  check(after.has('v4.0.3'), 'older release tags survive');
});

withRepo('4.0.4', ['v4.0.4'], ({ dir, git }) => {
  const before = releaseTags(dir);
  // Failure AFTER bump + tag: release.mjs bumped, ship.mjs cut v4.0.5.
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ version: '4.0.5' }) + '\n');
  git('tag', '-a', 'v4.0.5', '-m', 'v4.0.5');
  const deleted = deleteTagsCreatedSince(dir, before);
  const after = releaseTags(dir);
  check(deleted.join() === 'v4.0.5', 'a failure after tagging deletes exactly the new tag', `deleted: ${deleted.join(', ')}`);
  check(!after.has('v4.0.5'), 'the half-made tag v4.0.5 is gone');
  check(after.has('v4.0.4'), 'the previous release tag v4.0.4 is untouched');
});

// #1161: an inherited GIT_DIR must not redirect the library to another repo.
// Inside a worktree's pre-commit hook GIT_DIR names the real repository; the
// rollback then listed (and would have deleted) THAT repo's tags. Simulated here
// with a second scratch repo standing in for "the repo the hook belongs to".
withRepo('9.9.9', ['v9.9.9', 'v9.9.10'], ({ dir: other }) => {
  withRepo('4.0.4', ['v4.0.4'], ({ dir, git }) => {
    const saved = process.env.GIT_DIR;
    process.env.GIT_DIR = join(other, '.git');
    try {
      const before = releaseTags(dir);
      git('tag', '-a', 'v4.0.5', '-m', 'v4.0.5');
      const deleted = deleteTagsCreatedSince(dir, before);
      check(before.has('v4.0.4') && !before.has('v9.9.9'), 'with a foreign GIT_DIR set, tags are read from the named repo',
        `read: ${[...before].join(', ')}`);
      check(deleted.join() === 'v4.0.5', 'with a foreign GIT_DIR set, exactly the new tag is deleted', `deleted: ${deleted.join(', ')}`);
    } finally {
      if (saved === undefined) delete process.env.GIT_DIR; else process.env.GIT_DIR = saved;
    }
    const otherTags = execFileSync('git', ['tag', '--list', 'v*'], { cwd: other, env, encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
    check(otherTags.includes('v9.9.9') && otherTags.includes('v9.9.10'), "the other repo's tags are untouched", `left: ${otherTags.join(', ')}`);
  });
});

check(
  tagsCreatedSince(new Set(['v1', 'v2']), new Set(['v1', 'v2', 'v3'])).join() === 'v3' &&
  tagsCreatedSince(new Set(['v1']), new Set(['v1'])).length === 0,
  'tagsCreatedSince is exactly the set difference',
);

// ── #1179: a failed ship leaves HEAD's tree, staged or not ────────────────────
//
// ship.mjs runs `git add -A` before its commit. The commit is the gate, so a
// refused commit fails AFTER staging, and the old rollback (`git checkout -- .`)
// restored the working tree FROM THE INDEX, which held the release. On
// 2026-09-15 it printed "Tree restored" over 33 staged files and a package.json
// reading 4.0.6.
//
// Every shape a release write can take, each alone and all together, the last
// being what ship actually does. Oracle: nothing tracked differs from HEAD, a
// file that only the release added is gone, restoreTreeToHead() reports no
// leftovers, and an ignored file the user already had is left alone.
console.log('\nA failed ship restores HEAD whether or not the release was staged (#1179):');

const SHAPES = {
  'modified, staged': ({ dir, git }) => { writeFileSync(join(dir, 'package.json'), '{"version":"4.0.6"}\n'); git('add', '-A'); },
  'modified, unstaged': ({ dir }) => { writeFileSync(join(dir, 'package.json'), '{"version":"4.0.6"}\n'); },
  'modified, staged then edited again': ({ dir, git }) => {
    writeFileSync(join(dir, 'package.json'), '{"version":"4.0.6"}\n'); git('add', '-A');
    writeFileSync(join(dir, 'package.json'), '{"version":"4.0.7"}\n');
  },
  'deleted, staged': ({ git }) => { git('rm', '-q', 'page.html'); },
  'deleted, unstaged': ({ dir }) => { rmSync(join(dir, 'page.html')); },
  'added, staged': ({ dir, git }) => { writeFileSync(join(dir, 'release-only.txt'), 'cut by the release\n'); git('add', '-A'); },
};

function restoreCase(label, apply) {
  withRepo('4.0.5', ['v4.0.5'], (r) => {
    const { dir, git } = r;
    writeFileSync(join(dir, 'page.html'), '<p>v=4.0.5</p>\n');
    // ship refuses to start with untracked files, so what a user can have is an
    // IGNORED one (a log, a scratch file). git add -A skips it; the restore must too.
    writeFileSync(join(dir, '.gitignore'), 'mine.txt\n');
    git('add', '-A');
    git('commit', '-q', '-m', 'page');
    writeFileSync(join(dir, 'mine.txt'), 'ignored, the user\'s\n');

    apply(r);
    let leftovers;
    try {
      leftovers = restoreTreeToHead(dir);
    } catch (err) {
      check(false, `${label}: restore runs`, err.message.split(String.fromCharCode(10))[0]);
      return;
    }
    const status = git('status', '--porcelain', '--untracked-files=no');
    let cleanVsHead = true;
    try { git('diff', '--quiet', 'HEAD'); } catch { cleanVsHead = false; }
    const ok = leftovers.length === 0 && status.trim() === '' && cleanVsHead &&
      !existsSync(join(dir, 'release-only.txt')) && existsSync(join(dir, 'mine.txt'));
    check(ok, `${label}: tree matches HEAD, nothing reported left over, ignored user file kept`,
      `leftovers [${leftovers.join(', ')}], status ${JSON.stringify(status.trim())}, ` +
      `diff vs HEAD ${cleanVsHead ? 'none' : 'present'}, release-only.txt ${existsSync(join(dir, 'release-only.txt')) ? 'still there' : 'gone'}, ` +
      `mine.txt ${existsSync(join(dir, 'mine.txt')) ? 'kept' : 'DELETED'}`);
  });
}

for (const [label, apply] of Object.entries(SHAPES)) restoreCase(label, apply);
restoreCase('every shape at once, then git add -A (what ship does)', (r) => {
  for (const apply of Object.values(SHAPES)) { try { apply(r); } catch { /* a shape already applied by another */ } }
  r.git('add', '-A');
});

// #1161 again: the restore must act on the named repo, not a hook's GIT_DIR.
withRepo('9.9.9', [], ({ dir: other }) => {
  const saved = process.env.GIT_DIR;
  process.env.GIT_DIR = join(other, '.git');
  try {
    restoreCase('staged, with a foreign GIT_DIR set', SHAPES['modified, staged']);
  } finally {
    if (saved === undefined) delete process.env.GIT_DIR; else process.env.GIT_DIR = saved;
  }
});

console.log(`\n${failed ? '❌' : '✅'} ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
