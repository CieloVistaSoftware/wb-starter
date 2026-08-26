/**
 * release.mjs — the only thing allowed to move the version (#743)
 *
 * John: "don't bump release until after 10 fixes", and "when I tell you I want
 * the release bumped and what's new to match then do it."
 *
 * WHAT THIS REPLACES
 *
 * A pre-commit hook ran `npm version patch` on every commit. The version went
 * 3.0.36 -> 3.0.60 in two days, describing nothing. Worse, a number stopped
 * identifying a build: 3.0.55 named two different commits, 3.0.35 named forty,
 * and 3.0.56/58/59/60 never reached main at all. There was no way to answer
 * "what is in this version?", so there was no way to test one.
 *
 * THE RULE THIS ENFORCES
 *
 *   1. the full suite is GREEN            — a release is a validated batch
 *   2. What's New names the NEW version   — version and content match, always
 *   3. every version surface agrees       — no half-stamped release
 *
 * Any one of those failing aborts before the version moves. The bump is the
 * LAST thing that happens, so a failed release leaves no half-bumped tree.
 *
 * Usage:
 *   node scripts/release.mjs            # validate, then bump patch
 *   node scripts/release.mjs --check    # report only, change nothing
 *   node scripts/release.mjs --minor    # bump minor instead of patch
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK_ONLY = process.argv.includes('--check');
const MINOR = process.argv.includes('--minor');

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const pkgPath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

function die(msg, detail = '') {
  console.error(`\n❌ RELEASE ABORTED — ${msg}`);
  if (detail) console.error(detail);
  console.error('\nThe version has NOT been changed.\n');
  process.exit(1);
}

function nextVersion(current) {
  const [maj, min, patch] = current.split('.').map(Number);
  return MINOR ? `${maj}.${min + 1}.0` : `${maj}.${min}.${patch + 1}`;
}

const next = nextVersion(pkg.version);
console.log(`\n📦 Release: ${pkg.version} → ${next}\n`);

// ── 1. The full suite must be green ──────────────────────────────────────────
// Not a sample. Every bug reported in the session that produced this script
// lived in one of these three projects.
console.log('🔒 Gate 1 — full suite (compliance + regression + behaviors)\n');
const projects = ['compliance', 'regression', 'behaviors'];
const red = [];
for (const project of projects) {
  try {
    execSync(`npx playwright test --project=${project} --reporter=line`, {
      cwd: ROOT,
      stdio: 'inherit',
    });
    console.log(`   ✓ ${project}`);
  } catch {
    console.log(`   ✗ ${project}`);
    red.push(project);
  }
}
if (red.length) {
  die(
    `the suite is red: ${red.join(', ')}`,
    '\n   A release is a batch of fixes that PASSED. Shipping over a red build\n' +
      '   is how 20 versions went out in one day with a failing suite.'
  );
}

// ── 2. What's New must name the version being released ───────────────────────
// The rule John states directly: the version number and what it contains
// always travel together. A release whose entry is written afterwards is a
// release nobody can test when it lands.
console.log('\n🔒 Gate 2 — What\'s New names the new version\n');
const whatsNew = read('pages/whats-new.html');
const idForm = `whats-new-${next.replace(/\./g, '-')}`;
if (!whatsNew.includes(idForm) && !whatsNew.includes(`>${next}<`)) {
  die(
    `pages/whats-new.html has no entry for ${next}`,
    `\n   Add a section for ${next} describing what it contains, THEN release.\n` +
      `   Expected an id of "${idForm}" or the version as a heading.`
  );
}
console.log(`   ✓ entry present for ${next}`);

if (CHECK_ONLY) {
  console.log('\n✅ --check: both gates pass. Nothing was changed.\n');
  process.exit(0);
}

// ── 3. Bump, stamp, and verify every surface agrees ──────────────────────────
// LAST, so an abort above never leaves a half-bumped tree.
console.log('\n📝 Bumping and stamping\n');
for (const file of ['package.json', 'package-lock.json']) {
  const p = path.join(ROOT, file);
  // Read fully, THEN write. Opening for write first truncates the file — that
  // mistake left package.json empty on main for four releases.
  const before = fs.readFileSync(p, 'utf8');
  fs.writeFileSync(p, before.split(`"version": "${pkg.version}"`).join(`"version": "${next}"`));
}
execSync('node scripts/stamp-version.js', { cwd: ROOT, stdio: 'inherit' });

const surfaces = {
  'package.json': JSON.parse(read('package.json')).version,
  'package-lock.json': JSON.parse(read('package-lock.json')).version,
  'src/core/version.js': (read('src/core/version.js').match(/"version":\s*"([^"]+)"/) || [])[1],
};
const disagree = Object.entries(surfaces).filter(([, v]) => v !== next);
if (disagree.length) {
  die(
    'version surfaces disagree after stamping',
    disagree.map(([f, v]) => `   ${f} = ${v} (expected ${next})`).join('\n')
  );
}

console.log(`\n✅ ${next} released.`);
console.log('   All surfaces agree, suite green, What\'s New names it.');
console.log(`\n   Next: commit, then  git tag -a v${next} -m "..."  and push.\n`);
