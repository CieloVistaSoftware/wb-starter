/**
 * Refuse an issue comment that says "Fixed in <PR>" for a PR that does not
 * close that issue (#1336). The closing-comment row of that issue's table:
 * parallel agents share one scratchpad, so a closing comment written under an
 * obvious filename can be overwritten by another agent before
 * `gh issue comment --body-file` reads it -- and the issue is then closed
 * citing someone else's PR and someone else's validating test. That is false
 * evidence in exactly the form the closing rule asks for, so nothing notices.
 *
 * The check is narrow on purpose: only a PR cited AS THE FIX ("Fixed in",
 * "Closed by", "Landed (PR ...", "Fixed by") is checked, and only against
 * that PR's own description, which #1440 already forces to cite its issue.
 * Mentioning another PR in passing is not a claim and is not checked.
 *
 *   COMMENT_BODY="..." ISSUE_NUMBER=1336 GITHUB_REPOSITORY=owner/repo GH_TOKEN=... \
 *     node scripts/check-comment-cites-pr.mjs
 *
 * Run by .github/workflows/closing-comment-cites-its-pr.yml on issue comments.
 * PR_BODIES_JSON ({"1440": "Closes #1336 ..."}) replaces the API lookup in tests.
 */
import { writeFileSync } from 'node:fs';

const CLAIM = /\b(?:fixed|closed|landed)\b[^\n]{0,40}?(?:\bin\b|\bby\b|\()\s*(?:PR\s*)?(?:https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/pull\/(\d+)|#(\d+))/gi;

/** PR numbers this comment cites as the fix, in order, de-duplicated. */
export function claimedPulls(comment, repo) {
  const out = [];
  for (const m of String(comment || '').matchAll(CLAIM)) {
    if (m[1] && repo && m[1].toLowerCase() !== repo.toLowerCase()) continue; // another repo's PR
    const n = Number(m[2] || m[3]);
    if (n && !out.includes(n)) out.push(n);
  }
  return out;
}

/**
 * @param {string} comment
 * @param {number} issue
 * @param {Record<string, string|null>} prBodies  PR number -> its description (null: not found)
 * @returns {{ pr: number, reason: string }[]} one entry per cited PR that does not close this issue
 */
export function checkComment(comment, issue, prBodies, repo) {
  const cites = new RegExp(`#${issue}(?!\\d)`);
  return claimedPulls(comment, repo)
    .map((pr) => {
      const body = prBodies[String(pr)];
      if (body === undefined || body === null) return { pr, reason: `PR ${pr} could not be read` };
      return cites.test(body) ? null : { pr, reason: `PR ${pr}'s description never mentions #${issue}` };
    })
    .filter(Boolean);
}

async function readPrBodies(prs, repo, token) {
  if (process.env.PR_BODIES_JSON) return JSON.parse(process.env.PR_BODIES_JSON);
  const out = {};
  for (const pr of prs) {
    const res = await fetch(`https://api.github.com/repos/${repo}/pulls/${pr}`, {
      headers: { Accept: 'application/vnd.github+json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    out[String(pr)] = res.ok ? ((await res.json()).body || '') : null;
  }
  return out;
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  const comment = process.env.COMMENT_BODY || '';
  const issue = Number(process.env.ISSUE_NUMBER);
  const repo = process.env.GITHUB_REPOSITORY || '';
  const prs = claimedPulls(comment, repo);
  if (!issue || prs.length === 0) {
    console.log('✅ The comment cites no PR as the fix; nothing to match.');
    process.exit(0);
  }
  const findings = checkComment(comment, issue, await readPrBodies(prs, repo, process.env.GH_TOKEN), repo);
  if (findings.length === 0) {
    console.log(`✅ Every PR cited as the fix (${prs.join(', ')}) closes #${issue}.`);
    process.exit(0);
  }
  const report = [
    `⚠️ **This comment cites a fix that is not this issue's** (#1336 check).`,
    '',
    ...findings.map((f) => `- ${f.reason}.`),
    '',
    'Most likely the comment file was overwritten by another agent writing the same filename in the',
    'shared scratchpad, so it describes someone else\'s fix and names someone else\'s test.',
    'Check the comment above against the PR that actually closed this issue.',
  ].join('\n');
  console.error(report);
  if (process.env.REPORT_FILE) writeFileSync(process.env.REPORT_FILE, report + '\n');
  process.exit(1);
}
