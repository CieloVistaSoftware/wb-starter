/**
 * commit-issue-match.mjs -- a commit on an issue branch names that issue (#1336)
 *
 * Parallel agents share one scratchpad. On 2026-10-03 two of them wrote their
 * commit messages to the same commit-msg.txt, and `git commit -F` on branch
 * fix-1015 landed the #1300 agent's message: a #1015 fix described as a #1300
 * fix. git accepts any well-formed file, so nothing failed; a person reading
 * the output caught it.
 *
 * The branch already says which issue the work is for. A message that does not
 * cite that issue is either the swap above or a commit on the wrong branch --
 * both worth stopping before they are pushed.
 */

/** The issue a branch is named for: claude/fix-1336-x, fix/1327-img, test-1056-y. null when none. */
export function branchIssue(branch) {
  const m = String(branch || '').match(/(?:^|[/-])(\d{3,5})(?=-|$)/);
  return m ? Number(m[1]) : null;
}

/**
 * @param {string} message - the full commit message
 * @param {string} branch  - the branch it is being committed on
 * @returns {{ ok: boolean, issue: number|null, reason?: string }}
 */
export function checkMessage(message, branch) {
  const issue = branchIssue(branch);
  if (issue === null) return { ok: true, issue };
  const text = String(message || '')
    .split('\n')
    .filter((l) => !l.startsWith('#'))      // git's own comment lines
    .join('\n');
  const subject = text.split('\n')[0] || '';
  // git-generated subjects carry no issue of their own.
  if (/^(Merge|Revert|fixup!|squash!)\b/.test(subject)) return { ok: true, issue };
  if (new RegExp(`#${issue}(?!\\d)`).test(text)) return { ok: true, issue };
  return {
    ok: false,
    issue,
    reason:
      `This commit is on a branch for #${issue}, but its message never mentions #${issue}.\n` +
      `Subject: ${subject}\n\n` +
      'Most likely the message file was overwritten by another agent writing the same\n' +
      'filename in the shared scratchpad (#1336), or this is the wrong branch. Re-read\n' +
      'the message file, write it under a name that includes the issue number, and commit again.',
  };
}
