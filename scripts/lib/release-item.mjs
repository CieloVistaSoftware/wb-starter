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
