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
 *   1. no NEW failures vs the register  — a release breaks nothing (#1044)
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

// ── 1. No NEW failures vs the register ───────────────────────────────────────
//
// This used to run each project raw and abort if any was red. That made the tool
// that owns the version (#743) unable to cut a release AT ALL: the suite carries
// ~500 baselined failures, so "green" is unreachable and every release needed a
// bypass. A gate people must route around is not a gate — the same argument
// #743 itself makes about the version bump that got dodged 16 times in one day.
//
// John: "just like all of your warnings to me they never clear up." This was one
// of those warnings, so it is fixed here rather than noted again.
//
// It now asks the question every other gate in this repo asks since #1044: did
// THIS batch break anything NEW, measured against data/test-baseline-failures.json.
// That is strictly stronger than what was happening in practice, which was
// bypassing the check entirely.
console.log('🔒 Gate 1 — no NEW failures vs the register (compliance + regression + behaviors)\n');
try {
  execSync('node .husky/test-ratchet.mjs', { cwd: ROOT, stdio: 'inherit' });
  console.log('   ✓ no new failures');
} catch {
  die(
    'the ratchet found NEW failures',
    '\n   These are not the pre-existing debt in data/test-baseline-failures.json —\n' +
      '   this batch broke them. A release is a batch of fixes that did not break\n' +
      '   anything, which is a question that can actually be answered.\n\n' +
      '   To ship anyway you must first record why: shrink the register with\n' +
      '     node .husky/test-ratchet.mjs --update\n' +
      '   or fix the failure. Both leave a trail; a bypass does not.'
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
//
// #991: this was a whole-file string replace —
//
//   before.split(`"version": "${pkg.version}"`).join(`"version": "${next}"`)
//
// A lockfile carries one `"version": "x.y.z"` per INSTALLED PACKAGE, so every
// dependency sitting on the project's own number got bumped with it. Measured
// going 4.0.0 -> 4.0.1: seven fields moved where two should have. resolve-from,
// has-flag, path-exists, escape-string-regexp and is-promise are all genuinely
// published at 4.0.0, and their `integrity` hashes still describe the 4.0.0
// tarball — so the lockfile claimed a version whose hash cannot match and
// `npm ci` rejected the tree. Every release that landed ON a version some
// dependency also held did this silently.
//
// The irony is that the comment one line down already warned about a
// near-identical class of mistake in this same loop.
//
// So the fields are now set structurally, by name. The bytes around them are
// unchanged: npm writes both files as 2-space JSON with a trailing newline,
// which is byte-for-byte what JSON.stringify(json, null, 2) produces, so
// re-serialising is a no-op everywhere except the fields named here.
const OWN_VERSION_FIELDS = {
  'package.json': ['/version'],
  'package-lock.json': ['/version', '/packages//version'],
};

/** Every `version` field in a parsed JSON tree, keyed by its path. */
function versionFields(node, prefix = '', out = {}) {
  if (!node || typeof node !== 'object') return out;
  for (const [key, value] of Object.entries(node)) {
    const at = `${prefix}/${key}`;
    if (key === 'version' && typeof value === 'string') out[at] = value;
    else if (value && typeof value === 'object') versionFields(value, at, out);
  }
  return out;
}

/** Paths whose version differs between two of those maps. */
function movedVersions(before, after) {
  const paths = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...paths].filter((p) => before[p] !== after[p]).sort();
}

/** Set the project's own version fields, preserving the file's own formatting. */
function withVersion(text, version) {
  const json = JSON.parse(text);
  json.version = version;
  if (json.packages && json.packages['']) json.packages[''].version = version;
  const body = JSON.stringify(json, null, 2) + (text.endsWith('\n') ? '\n' : '');
  return text.includes('\r\n') ? body.split('\n').join('\r\n') : body;
}

console.log('\n📝 Bumping and stamping\n');
const originals = {};
for (const file of ['package.json', 'package-lock.json']) {
  const p = path.join(ROOT, file);
  // Read fully, THEN write. Opening for write first truncates the file — that
  // mistake left package.json empty on main for four releases.
  const before = fs.readFileSync(p, 'utf8');
  originals[file] = before;
  fs.writeFileSync(p, withVersion(before, next));
}

// Verify what actually landed on disk, not what we intended to write, and do it
// BEFORE stamping so a wrong bump never becomes a half-released tree. This is
// the check #991 asked for: a structural diff of every version field in both
// files, which goes red the moment anything rewrites a dependency's version.
const strays = [];
for (const file of ['package.json', 'package-lock.json']) {
  const before = versionFields(JSON.parse(originals[file]));
  const after = versionFields(JSON.parse(read(file)));
  for (const at of movedVersions(before, after)) {
    if (!OWN_VERSION_FIELDS[file].includes(at)) {
      strays.push(`   ${file}${at}: ${before[at]} → ${after[at]}`);
    }
  }
}
if (strays.length) {
  for (const [file, text] of Object.entries(originals)) fs.writeFileSync(path.join(ROOT, file), text);
  die(
    'the bump changed version fields that are not this project\'s',
    `\n${strays.join('\n')}\n\n` +
      '   Those belong to installed packages. Their integrity hashes still\n' +
      '   describe the old tarball, so `npm ci` would reject the tree (#991).\n' +
      '   Both files have been restored.'
  );
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
