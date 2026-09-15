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
 */
import { execFileSync } from 'child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { releaseTags, tagsCreatedSince, deleteTagsCreatedSince } from './lib/ship-rollback.mjs';

let passed = 0;
let failed = 0;
const check = (ok, name, detail = '') => {
  if (ok) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ ${name}${detail ? `\n     ${detail}` : ''}`); }
};

// Hooks set these; a guard that runs inside one must not act on the real repo.
const env = { ...process.env };
for (const k of ['GIT_DIR', 'GIT_INDEX_FILE', 'GIT_WORK_TREE']) delete env[k];

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

console.log(`\n${failed ? '❌' : '✅'} ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
