#!/usr/bin/env node
/**
 * Refuse a pull request that does not say, for the Releases page, what the
 * issue was and how to see the change (#1533).
 *
 * John, 2026-10-05: "This page tells me nothing. one of these lines should be
 * a summary of the issue, the other what to do to see the change." The page is
 * generated from git (scripts/release-versions.mjs), so the two lines have to
 * be in a commit message. At least one commit in the PR carries both:
 *
 *   Summary: <what was wrong or missing, in plain English>
 *   See it: <what to do on the site to see the change>
 *
 * A change nobody can see says so: "See it: No visible change: tests only."
 *
 *   BASE_SHA=... HEAD_SHA=... node scripts/check-release-notes.mjs
 *
 * Run by .github/workflows/pr-release-notes.yml on every PR event.
 */
import { execFileSync } from 'node:child_process';
import { releaseNotes } from './lib/release-item.mjs';

/** @param {string[]} messages - full commit messages @returns {{ ok: boolean, summary: boolean, seeIt: boolean }} */
export function checkReleaseNotes(messages) {
  const found = messages.map(releaseNotes);
  const one = found.find((n) => n.summary && n.seeIt);
  return { ok: !!one, summary: found.some((n) => n.summary), seeIt: found.some((n) => n.seeIt) };
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  const base = process.env.BASE_SHA;
  const head = process.env.HEAD_SHA || 'HEAD';
  if (!base) {
    console.error('check-release-notes: BASE_SHA is not set.');
    process.exit(2);
  }
  const NUL = String.fromCharCode(0);
  const messages = execFileSync('git', ['log', '--no-merges', '--format=%B%x00', `${base}..${head}`], { encoding: 'utf8' })
    .split(NUL).map((m) => m.trim()).filter(Boolean);
  const result = checkReleaseNotes(messages);
  if (!result.ok) {
    console.error(`\n❌ None of this PR's ${messages.length} commit(s) carries both release lines (#1533).`);
    console.error(`   Summary: ${result.summary ? 'found' : 'missing'} · See it: ${result.seeIt ? 'found' : 'missing'} (they must be in the same commit message)\n`);
    console.error('The Releases page shows them for this version. Add them to a commit message, e.g.:');
    console.error('  Summary: The Releases page repeated each change twice and never said what the issue was.');
    console.error('  See it: Open Releases; each version shows the issue, then "See it:", then what changed.\n');
    console.error('A change nobody can see says so:  See it: No visible change: tests only.');
    process.exit(1);
  }
  console.log(`✅ Release lines found (Summary + See it) in ${messages.length} commit(s).`);
}
