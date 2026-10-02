#!/usr/bin/env node
/**
 * release-entry.mjs — add the release about to ship to data/releases.json
 *
 * John: "just make every fix a part of a release." and, 2026-09-29, "redo our
 * what's new to change to releases and tell for each release what was fixed or
 * added." pages/releases.html renders data/releases.json; this writes the entry
 * for the release `npm run ship` is cutting, from the commits in it.
 *
 * The inventory is not invented: it is every commit on HEAD that the newest
 * version tag does not contain -- exactly what the push puts on the site.
 *
 *   feat:            -> added
 *   fix:             -> fixed
 *   anything else    -> changed      (a `!`/BREAKING commit is flagged breaking)
 *
 * #1182: an `unreleased` block in data/releases.json (work that is live but not
 * yet in a numbered release) is folded into the release being written. It may
 * exist between releases; it can never outlive one, which is how the old What's
 * New page showed a sentence where a version belonged.
 *
 * Usage:
 *   node scripts/release-entry.mjs              # the next patch
 *   node scripts/release-entry.mjs --minor      # the next minor
 *   node scripts/release-entry.mjs --as 1.0.0   # an explicit version (1.0)
 *   node scripts/release-entry.mjs --check      # print it, change nothing
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nextVersion } from './lib/next-version.mjs';
import { itemFor } from './lib/release-item.mjs';

const NUL = String.fromCharCode(0);
const US = String.fromCharCode(31);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data', 'releases.json');
const CHECK_ONLY = process.argv.includes('--check');

const git = (cmd, fallback = '') => {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return fallback;
  }
};

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const next = nextVersion(pkg.version, process.argv);

// Newest tag REACHABLE FROM HEAD, so a branch without the latest release still
// lists exactly what it would ship. %x00 separates records: a body has newlines.
const lastTag = git('git describe --tags --abbrev=0 --match=v*');
const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
const commits = git(`git log ${range} --no-merges --pretty=format:%H%x1f%s%x00`)
  .split(NUL).map((r) => r.trim()).filter(Boolean)
  .map((r) => { const [sha, subject] = r.split(US); return { sha, subject: (subject || '').trim() }; })
  // The release commits themselves are bookkeeping, not changes. So is a
  // "CI on <sha>" follow-up: it repairs a commit in this same batch, which is
  // already listed, and would otherwise appear as a second, vaguer entry.
  .filter((c) => !/^release: /.test(c.subject))
  .filter((c) => !/^[a-z]+(\([^)]*\))?!?:\s*CI on [0-9a-f]{7,}\b/.test(c.subject));

const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const items = commits.map((c) => itemFor(c.subject));
if (data.unreleased && Array.isArray(data.unreleased.items)) items.push(...data.unreleased.items);

if (!items.length) {
  console.error(`\n❌ Nothing to release — ${lastTag || 'HEAD'} already contains every commit.\n`);
  process.exit(1);
}

// A summary written ahead of the release (unreleased.summary) introduces it;
// the items still come from the commits, so the two cannot drift.
const summary = (data.unreleased && data.unreleased.summary) || '';
const entry = { version: next, date: new Date().toISOString().slice(0, 10), summary, items };

if (CHECK_ONLY) {
  console.log(JSON.stringify(entry, null, 2));
  process.exit(0);
}
if (data.releases.some((r) => r.version === next)) {
  console.log(`[release-entry] ${next} is already in data/releases.json — leaving it alone.`);
  process.exit(0);
}

data.releases.unshift(entry);
delete data.unreleased;
fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
console.log(`[release-entry] wrote ${items.length} item(s) for ${next} (${range})`);
