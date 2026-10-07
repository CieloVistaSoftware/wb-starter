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
import { itemFor, linkify } from './lib/release-item.mjs';
import { STAMP_SUBJECT, releaseCommit } from './lib/push-count.mjs';

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
// A release commit whose tag release.yml has not made yet is a release too.
const lastTag = git('git describe --tags --abbrev=0 --match=v*');
const lastRelease = releaseCommit(ROOT);
const since = (lastRelease && lastRelease.base) || lastTag;
const range = since ? `${since}..HEAD` : 'HEAD';
const commits = git(`git log ${range} --no-merges --pretty=format:%H%x1f%s%x1f%b%x00`)
  .split(NUL).map((r) => r.trim()).filter(Boolean)
  .map((r) => { const [sha, subject, body] = r.split(US); return { sha, subject: (subject || '').trim(), body: (body || '').trim() }; })
  // The release commits themselves are bookkeeping, not changes. So is a
  // "CI on <sha>" follow-up: it repairs a commit in this same batch, which is
  // already listed, and would otherwise appear as a second, vaguer entry.
  .filter((c) => !/^release: /.test(c.subject))
  // The stamp workflow's "chore(version): stamp" commits are bookkeeping for
  // the push they stamp; 85 of the 279 items after 1.0.132 were stamps.
  .filter((c) => !STAMP_SUBJECT.test(c.subject))
  // One item per change: a commit re-applied after a rebase or a revert of a
  // revert carries the same subject, and listing it twice says nothing new.
  .filter((c, i, all) => all.findIndex((o) => o.subject === c.subject) === i)
  .filter((c) => !/^[a-z]+(\([^)]*\))?!?:\s*CI on [0-9a-f]{7,}\b/.test(c.subject));

const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
// Each item links its commit, and the entry links the commit it was cut from,
// as every version release-versions.mjs writes does.
const commitLink = (sha) =>
  `<a href="https://github.com/CieloVistaSoftware/wb-starter/commit/${sha}" target="_blank" rel="noopener"><code>${sha.slice(0, 7)}</code></a>`;
const items = commits.map((c) => {
  const item = itemFor(c.subject, c.body);
  item.html = `${linkify(item.html)} ${commitLink(c.sha)}`;
  return item;
});
if (data.unreleased && Array.isArray(data.unreleased.items)) items.push(...data.unreleased.items);

// Right after a release, HEAD holds only its merge and stamp, so there is
// nothing yet: --check reports the empty batch, a real run refuses to write it.
if (!items.length && !CHECK_ONLY) {
  console.error(`\n❌ Nothing to release — ${since || 'HEAD'} already contains every commit.\n`);
  process.exit(1);
}

// A summary written ahead of the release (unreleased.summary) introduces it;
// the items still come from the commits, so the two cannot drift.
const summary = (data.unreleased && data.unreleased.summary) || '';
const entry = { version: next, date: new Date().toISOString().slice(0, 10), summary, items };
if (data.unreleased && data.unreleased.seeIt) entry.seeIt = data.unreleased.seeIt;
const head = git('git rev-parse HEAD');
if (head) entry.links = [{ label: 'Code', html: commitLink(head) }];

// No process.exit after printing: it ends the process before a pipe has taken
// the output, and a batch this size is past 64 KB, so --check was cut mid-JSON.
if (CHECK_ONLY) {
  console.log(JSON.stringify(entry, null, 2));
} else if (data.releases.some((r) => r.version === next)) {
  console.log(`[release-entry] ${next} is already in data/releases.json — leaving it alone.`);
} else {
  data.releases.unshift(entry);
  delete data.unreleased;
  fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
  console.log(`[release-entry] wrote ${items.length} item(s) for ${next} (${range})`);
}
