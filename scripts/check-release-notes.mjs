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
 *   See it: <what to do>. Before: <what you saw>. Now: <what you see>.
 *
 * John, 2026-10-05: "still not good enough, tell the user what to do to
 * manually recreate this". So the See it line is checked, not just found
 * (seeItProblems): it starts with what to do, says Before: and Now:, and does
 * not repeat the Summary. "No visible change" is refused; a test-only change
 * names the command to run and what it printed before and after.
 *
 *   BASE_SHA=... HEAD_SHA=... node scripts/check-release-notes.mjs
 *
 * Run by .github/workflows/pr-release-notes.yml on every PR event.
 */
import { execFileSync } from 'node:child_process';
import { releaseNotes, seeItProblems } from './lib/release-item.mjs';

/**
 * @param {string[]} messages - full commit messages
 * @returns {{ ok: boolean, summary: boolean, seeIt: boolean, problems: string[] }}
 */
export function checkReleaseNotes(messages) {
  const found = messages.map(releaseNotes);
  const pairs = found.filter((n) => n.summary && n.seeIt);
  const good = pairs.find((n) => !seeItProblems(n.seeIt, n.summary).length);
  const problems = good || !pairs.length ? [] : seeItProblems(pairs[0].seeIt, pairs[0].summary);
  return { ok: !!good, summary: found.some((n) => n.summary), seeIt: found.some((n) => n.seeIt), problems };
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
  if (!result.ok && result.problems.length) {
    console.error(`\n❌ This PR's See it line does not tell a reader how to recreate the change (#1533):`);
    for (const p of result.problems) console.error(`   - ${p}`);
    console.error('\nWrite where to go, what to do, and what you saw before and see now, e.g.:');
    console.error('  See it: Open Search and type "dialog". Before: 112 results opened pages that no longer exist. Now: every result opens a real page.');
    console.error('  See it: Run `npx playwright test tests/regression/x.spec.ts --project=regression`. Before: xs and xl both read 16px. Now: xs is 12px, xl 20px.');
    process.exit(1);
  }
  if (!result.ok) {
    console.error(`\n❌ None of this PR's ${messages.length} commit(s) carries both release lines (#1533).`);
    console.error(`   Summary: ${result.summary ? 'found' : 'missing'} · See it: ${result.seeIt ? 'found' : 'missing'} (they must be in the same commit message)\n`);
    console.error('The Releases page shows them for this version. Add them to a commit message, e.g.:');
    console.error('  Summary: The Releases page repeated each change twice and never said what the issue was.');
    console.error('  See it: Open Releases. Before: each version repeated its PR title. Now: each says what the issue was, then how to see it.');
    process.exit(1);
  }
  console.log(`✅ Release lines found (Summary + See it) in ${messages.length} commit(s).`);
}
