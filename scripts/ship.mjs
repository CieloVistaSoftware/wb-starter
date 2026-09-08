/**
 * ship.mjs — put a batch on the public site, and name it (#1076)
 *
 * John: "just make every fix a part of a release. I want to identify code in
 * batches where the local code and .io are in the same batch."
 *
 * WHY A PUSH IS THE BATCH
 *
 * GitHub Pages serves this repo with build_type "legacy" and
 * source {branch: main, path: /}. There is no deploy workflow because deploying
 * is not an action anyone takes: the instant a commit lands on main, the
 * published site IS that commit. So the moment .io changes is exactly the moment
 * a push lands — which makes the push, not the commit, the unit that deserves a
 * version.
 *
 * Before this, the two were unrelated: deploy was automatic and the version moved
 * only when someone typed `npm run release`. Everything in between shipped under
 * the PREVIOUS number. Measured at the time of writing: 9 commits sat after tag
 * v4.0.2 while all 9 still declared "4.0.2" in package.json. Not "no version" —
 * ten different code states answering to one string, which is worse, because
 * "is #1067 in 4.0.2?" then has two correct opposite answers.
 *
 * WHAT THIS IS NOT
 *
 * It is NOT the `npm version patch` pre-commit hook that #743 deleted. That
 * bumped per COMMIT — 3.0.36 to 3.0.60 in two days, 3.0.35 naming forty commits,
 * four numbers that never reached main. This bumps per PUSH, and only for the
 * branch that is actually published, so every number names exactly one commit
 * that is exactly what the site serves. #743's gates are untouched and still run:
 * this calls release.mjs rather than replacing it.
 *
 * Usage:
 *   npm run ship             # release the batch on HEAD and push it
 *   npm run ship -- --dry    # do everything except commit, tag and push
 *   npm run ship -- --minor  # bump the minor instead of the patch
 */
import { execSync, execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { changedPaths } from './lib/git-status.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry');
const MINOR = process.argv.includes('--minor');

const run = (cmd) => execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
const capture = (cmd, fallback = '') => {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return fallback;
  }
};

function die(msg, detail = '') {
  console.error(`\n❌ SHIP ABORTED — ${msg}`);
  if (detail) console.error(detail);
  console.error('\nNothing was committed, tagged or pushed.\n');
  process.exit(1);
}

const branch = capture('git rev-parse --abbrev-ref HEAD', 'unknown');
if (branch !== 'main') {
  die(
    `you are on "${branch}", and only main is published`,
    '\n   .io serves main. Shipping from anywhere else would move the version\n' +
      '   for code the site will not have.'
  );
}

// A dirty tree means the batch is not the commits — some of it is only on this
// machine, and the number would name something .io never receives. This is the
// same "local and .io must match" requirement, enforced instead of asserted.
// #1082: parsed by scripts/lib/git-status.mjs, NOT by trimming this output.
// `capture` trims, which strips the leading status space from the FIRST LINE
// ONLY -- so `.slice(3)` ate a character of the alphabetically-first path and
// this very refusal named ".github/workflows/ci-tests.yml" as
// "github/workflows/ci-tests.yml". The identical two lines in stamp-version.js
// are why #1071's `src/core/version.js` exclusion never matched: in the case
// #1071 cares about, version.js IS the first line.
const rawStatus = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' });
const dirty = changedPaths(rawStatus);
if (dirty.length) {
  // Capped: untracking data/test-single/ (#1081) staged 250 deletions at once,
  // and a refusal that scrolls off the screen is one nobody reads.
  const shown = dirty.slice(0, 15).map((f) => `   ${f}`).join('\n');
  const rest = dirty.length > 15 ? `\n   ...and ${dirty.length - 15} more` : '';
  die(
    'the working tree has uncommitted changes',
    `\n${shown}${rest}\n\n` +
      '   Commit them (they become part of this batch) or stash them. A version\n' +
      '   must name what the site will actually serve.'
  );
}

const already = capture('git tag --points-at HEAD --list v*');
if (already) {
  die(
    `HEAD is already released as ${already}`,
    '\n   There is nothing new to name. Commit something first.'
  );
}

const minorFlag = MINOR ? ' --minor' : '';

console.log('\n📋 Writing the What\'s New entry for this batch\n');
run(`node scripts/whats-new-entry.mjs${minorFlag}`);

// release.mjs owns the version and runs its own two gates (#743): the ratchet
// (no NEW failures vs the register) and What's New naming the version. Called,
// not reimplemented — a second bumper is how surfaces come to disagree.
console.log('\n🚀 Cutting the release\n');
run(`node scripts/release.mjs${minorFlag}`);

const version = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
const tag = `v${version}`;

if (DRY) {
  console.log(`\n✅ --dry: ${tag} prepared. Not committed, tagged or pushed.`);
  console.log('   `git diff` to review, `git checkout -- .` to discard.\n');
  process.exit(0);
}

console.log(`\n📦 Committing and tagging ${tag}\n`);
run('git add -A');
// execFileSync, not a shell string: a subject reaching a shell has to survive
// its quoting rules, and this one carries an em dash.
execFileSync('git', ['commit', '-m', `release: ${version} — the batch now on main, and on the site`], {
  cwd: ROOT,
  stdio: 'inherit',
});
execFileSync('git', ['tag', '-a', tag, '-m', `${version}`], { cwd: ROOT, stdio: 'inherit' });

console.log(`\n⬆️  Pushing main and ${tag}\n`);
run('git push origin main');
run(`git push origin ${tag}`);

console.log(`\n✅ ${tag} is on main, and therefore on the site.`);
console.log('   Local and .io are the same batch, and it has a name.\n');
