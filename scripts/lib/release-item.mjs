/**
 * One commit -> one Releases-page item: { kind, html, issues?, breaking? }.
 *
 * Shared by scripts/release-entry.mjs (a tagged release) and
 * scripts/release-versions.mjs (every 1.0.N the badge shows), so both list a
 * change the same way.
 *
 *   feat:            -> added
 *   fix:             -> fixed
 *   anything else    -> changed      (a `!`/BREAKING commit is flagged breaking)
 *
 * Issue refs become real links (RELEASE-PROCESS.md rule 5): every #N in the
 * subject, plus "Fixes/Closes/Resolves #N" in the body.
 */
export const ISSUE_URL = 'https://github.com/CieloVistaSoftware/wb-starter/issues/';

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

export function issueLinks(issues) {
  return issues.map((n) => `<a href="${ISSUE_URL}${n}" target="_blank" rel="noopener">#${n}</a>`).join(' ');
}

export function itemFor(subject, body = '') {
  const breaking = /^[a-z]+(\([^)]*\))?!:/.test(subject) || /^BREAKING/.test(subject);
  const kind = /^feat(\([^)]*\))?!?:/.test(subject) ? 'added'
    : /^fix(\([^)]*\))?!?:/.test(subject) ? 'fixed' : 'changed';
  // Issue refs are dropped from the prose and appended as real links below: a
  // bare "#1182" is a string, not a reference.
  const text = subject.replace(/^[a-z]+(\([^)]*\))?!?:\s*/, '')
    .replace(/\s*\((?:#\d+[,\s/]*)+\)|\s*#\d+\b/g, '').trim();
  const fromSubject = (subject.match(/#(\d{2,5})/g) || []).map((m) => Number(m.slice(1)));
  const fromBody = [...String(body).matchAll(/\b(?:fix(?:e[sd])?|close[sd]?|resolve[sd]?)\s+#(\d{2,5})/gi)].map((m) => Number(m[1]));
  const issues = [...new Set([...fromSubject, ...fromBody])];
  const links = issueLinks(issues);
  const item = { kind, html: `<strong>${esc(text.charAt(0).toUpperCase() + text.slice(1))}</strong>${links ? ' ' + links : ''}` };
  if (breaking) item.breaking = true;
  if (issues.length) item.issues = issues;
  return item;
}

/**
 * The two lines a commit message carries for the Releases page (#1533).
 * John, 2026-10-05: "This page tells me nothing. one of these lines should be
 * a summary of the issue, the other what to do to see the change."
 *
 *   Summary: <what was wrong or missing, in plain English>
 *   See it: <what to do on the site to see the change>
 *
 * @returns {{ summary: string|null, seeIt: string|null }}
 */
export function releaseNotes(message = '') {
  const line = (name) => {
    const m = String(message).match(new RegExp(`^\\s*${name}:[ \\t]*(\\S.*)$`, 'im'));
    return m ? m[1].trim() : null;
  };
  return { summary: line('Summary'), seeIt: line('See it') };
}

/** The verbs a "See it" line starts with: it is something the reader does. */
const ACTION = /^(open|run|type|click|go to|reload|resize|search|load|drag|press|hover|visit|scroll|select|navigate|start|toggle|switch|tab|view|read|check|compare|watch|push|merge|make|commit|edit|create|set|add|remove|delete|install|build|call|paste|copy|drop|fill|submit|turn|enable|disable|put|place|look at|file|stage|label|reproduce|serve|use|try)\b/i;
/** A lead-in that sets the scene before the step: "In a worktree without node_modules, run …". */
const LEAD_IN = /^(in|on|at|after|with|from|using|when|without|before running)\b[^,]*,\s*/i;

/**
 * What is wrong with a "See it" line, or [] when it is good enough (#1533).
 *
 * John, 2026-10-05, on the first version of these lines: "still not good
 * enough, tell the user what to do to manually recreate this" -- and "I don't
 * do anything manually that's your job". A reader recreates the change by
 * hand: where to go, what to do, what they saw Before and what they see Now.
 * "No visible change" is never enough; a test-only change names the command
 * to run and what it printed before and after.
 *
 * @param {string|null} seeIt
 * @param {string|null} [summary]
 * @returns {string[]}
 */
export function seeItProblems(seeIt, summary = null) {
  const text = String(seeIt || '').replace(/<[^>]+>/g, '').trim();
  if (!text) return ['there is no See it line'];
  const problems = [];
  if (/^no visible change/i.test(text)) problems.push('it says "No visible change" instead of how to recreate the change');
  else if (!ACTION.test(text.replace(LEAD_IN, ''))) problems.push('it does not start with what to do (Open, Run, Type, Click, …)');
  if (!/\bBefore:/.test(text) || !/\bNow:/.test(text)) problems.push('it does not say what you saw "Before:" and what you see "Now:"');
  const plain = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/gi, ' ').trim().toLowerCase();
  if (summary && plain(text) === plain(summary)) problems.push('it repeats the Summary');
  return problems;
}
