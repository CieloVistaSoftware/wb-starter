/**
 * Refuse a pull request whose description does not cite the issue its branch
 * is named for (#1336). The PR-body row of that issue's table: parallel agents
 * share one scratchpad, so a body file written under an obvious name can be
 * overwritten by another agent before `gh pr create --body-file` reads it --
 * and the PR then argues for someone else's change. Same rule as the
 * commit-msg hook (scripts/check-commit-issue.mjs), and the same branch parser.
 *
 * Not checkMessage(): it drops lines starting with "#" as git comments, and in
 * a PR description those are Markdown headings (and "#1336 ..." lines).
 *
 *   PR_BODY="..." PR_BRANCH="claude/fix-1336-x" node scripts/check-pr-body-issue.mjs
 *
 * Run by .github/workflows/pr-body-names-its-issue.yml on every PR event.
 */
import { branchIssue } from './lib/commit-issue-match.mjs';

/** @returns {{ ok: boolean, issue: number|null }} */
export function checkPrBody(body, branch) {
  const issue = branchIssue(branch);
  if (issue === null) return { ok: true, issue };
  return { ok: new RegExp(`#${issue}(?!\\d)`).test(String(body || '')), issue };
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  const branch = process.env.PR_BRANCH || '';
  const result = checkPrBody(process.env.PR_BODY || '', branch);
  if (!result.ok) {
    console.error(`\n❌ This PR is on a branch for #${result.issue} (${branch}), but its description never mentions #${result.issue}.\n`);
    console.error('Most likely the body file was overwritten by another agent writing the same filename in the');
    console.error('shared scratchpad (#1336), or this is the wrong branch. Write the body under a name that');
    console.error('includes the issue number and edit the PR description.\n');
    process.exit(1);
  }
  console.log(result.issue === null
    ? `✅ ${branch}: no issue in the branch name, nothing to match.`
    : `✅ The description cites #${result.issue}, the issue ${branch} is named for.`);
}
