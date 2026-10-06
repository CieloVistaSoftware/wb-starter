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

const SITE = 'https://cielovistasoftware.github.io/wb-starter/';
const REPO_BLOB = 'https://github.com/CieloVistaSoftware/wb-starter/blob/main/';
const anchor = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
/** Where a repo path opens: the live page for something a browser shows, else the file on GitHub. */
export function hrefForPath(path, hash = '') {
  const page = path.match(/^pages\/([\w-]+)\.html$/);
  if (page) return `${SITE}?page=${page[1]}${hash}`;
  if (/^docs\/.+\.md$/.test(path)) return `${SITE}public/doc-viewer.html?file=${encodeURIComponent(path)}${hash}`;
  if (/^(demos|public|images|assets)\/.+\.(html|png|jpe?g|svg|webp|gif)$/.test(path)) return `${SITE}${path}${hash}`;
  return `${REPO_BLOB}${path}${hash}`;
}
// A real host (or localhost), never an elided example like "https://…".
const URL_RE = /https?:\/\/(?:localhost|[\w-]+(?:\.[\w-]+)+)(?::\d+)?(?:&amp;|[^\s<"…&])*?(?=[.,;:)]*(?:\s|<|$|&#\d+;|&quot;|&lt;|&gt;))/g;
const PATH_RE = /(?<![\w/.:-])((?:demos|pages|public|docs|tests|scripts|src|data|images|assets|\.github)\/[\w./-]*[\w-]\.(?:html|md|mjs|json|js|ts|css|yml|png|jpe?g|svg)(?![\w]))(#[\w-]+)?/g;
const PAGE_RE = /(?<![\w/.-])\?page=([\w-]+)/g;
/**
 * Every place named in already-escaped HTML, as a clickable link. John:
 * "the release page should show links to all work" and "A link always means
 * a click-able link". Full URLs link as written; repo paths and ?page= open
 * where they can be seen (hrefForPath). Text already inside an <a> is left
 * alone, and so are tag attributes.
 */
export function linkify(html) {
  let inLink = 0;
  return String(html).split(/(<[^>]+>)/).map((part) => {
    if (part.startsWith('<')) {
      if (/^<a[\s>]/i.test(part)) inLink++;
      else if (/^<\/a>/i.test(part)) inLink = Math.max(0, inLink - 1);
      return part;
    }
    if (inLink) return part;
    // One pass over the three patterns, so a link's own text is never re-linked.
    const spans = [];
    for (const m of part.matchAll(URL_RE)) spans.push({ i: m.index, len: m[0].length, html: anchor(m[0], m[0]) });
    for (const m of part.matchAll(PATH_RE)) spans.push({ i: m.index, len: m[0].length, html: anchor(hrefForPath(m[1], m[2] || ''), m[0]) });
    for (const m of part.matchAll(PAGE_RE)) spans.push({ i: m.index, len: m[0].length, html: anchor(`${SITE}?page=${m[1]}`, m[0]) });
    spans.sort((x, y) => x.i - y.i);
    let out = '';
    let at = 0;
    for (const sp of spans) {
      if (sp.i < at) continue; // inside a span already linked (a path within a URL)
      out += part.slice(at, sp.i) + sp.html;
      at = sp.i + sp.len;
    }
    return out + part.slice(at);
  }).join('');
}
/**
 * The `Links:` block of a commit message, as [{ label, href }]:
 *
 *   Links:
 *   - PR (hero gallery): https://github.com/…/pull/1617
 *   - See it (local): http://localhost:3000/?page=hero-gallery
 *
 * Only http(s) URLs; the label is the text before the URL's colon.
 */
export function linksFrom(body) {
  const block = String(body || '').match(/^Links:[ \t]*\n((?:[ \t]*-[^\n]*\n?)+)/m);
  if (!block) return [];
  return block[1].split('\n').map((l) => l.match(/^\s*-\s*(.+?):\s*(https?:\/\/\S+)(.*)$/)).filter(Boolean)
    .map((m) => ({ label: `${m[1].trim()}${m[3].trim() ? ' ' + m[3].trim() : ''}`, href: m[2] }));
}
