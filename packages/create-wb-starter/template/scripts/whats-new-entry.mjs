/**
 * whats-new-entry.mjs — write the What's New section for the batch about to ship
 *
 * John: "just make every fix a part of a release. I want to identify code in
 * batches where the local code and .io are in the same batch."
 *
 * WHY THIS HAS TO EXIST BEFORE A RELEASE CAN BE AUTOMATIC
 *
 * release.mjs gate 2 refuses to move the version until pages/whats-new.html
 * names the version being cut (#743 — "when I tell you I want the release
 * bumped and what's new to match then do it"). That gate is right and stays.
 * But it also means a release can never be cut as part of shipping unless
 * something writes the entry first. This is that something.
 *
 * The inventory is not invented: it is the commits in the batch — everything on
 * HEAD that the newest version tag does not already contain. That is exactly the
 * set of changes the push is about to put on the public site.
 *
 * OUTPUT SHAPE IS NOT FREE
 *
 * pages/whats-new.html builds its sortable table by reading these sections:
 *   section[id^="whats-new-"]  ->  h2 "X.Y.Z — YYYY-MM-DD"
 *                              ->  li.wn-item > span.wn-tag + strong + a[href*="/issues/"]
 * So the markup here is written to that contract. A section that does not match
 * it is silently dropped from the table rather than erroring, which is the worst
 * possible failure for a changelog.
 *
 * EVERY CONTAINER THIS WRITES CARRIES AN ID
 *
 * tests/compliance/html-ids.spec.ts requires an id on every element with more
 * than one element child. This generator emits three such containers per
 * release — the lead `<p>` (strong + code + a + code), the `<ul>`, and every
 * `<li>` (span.wn-tag + strong + issue links) — so a page that was compliant
 * before a release stops being compliant the moment one is cut. #1087: the
 * page had accumulated 264 of them that way, against a budget of 75.
 *
 * The ids are derived from the section id, so they are stable across reruns and
 * unique against the sections already on the page:
 *   <p id="{section}-note">  <ul id="{section}-list">  <li id="{section}-list-item-N">
 * The `-item-` segment is what keeps the Nth list item apart from the Nth list
 * in a section that has more than one (`-list-2` vs `-list-item-2`).
 *
 * Usage:
 *   node scripts/whats-new-entry.mjs            # write the section for the next patch
 *   node scripts/whats-new-entry.mjs --check    # print it, change nothing
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const NUL = String.fromCharCode(0);   // git -z record separator
const US  = String.fromCharCode(31);  // field separator inside a record

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK_ONLY = process.argv.includes('--check');
const MINOR = process.argv.includes('--minor');
const PAGE = path.join(ROOT, 'pages', 'whats-new.html');

const git = (cmd, fallback = '') => {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return fallback;
  }
};

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const [maj, min, patch] = pkg.version.split('.').map(Number);
const next = MINOR ? `${maj}.${min + 1}.0` : `${maj}.${min}.${patch + 1}`;

/**
 * The batch = commits the newest version tag does not contain.
 *
 * `git describe --tags --abbrev=0` picks the newest tag REACHABLE FROM HEAD,
 * not the newest tag in the repo, which is what makes this correct on a branch
 * that has not merged the latest release.
 */
const lastTag = git('git describe --tags --abbrev=0 --match=v*');
const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';

// %x00 as the record separator, not a newline: a commit BODY contains newlines,
// and splitting on one is what made scripts/issue-state read 119 of 1,056
// commits (#1042). Subjects only here, but the same rule applies for the same
// reason.
const raw = git(`git log ${range} --no-merges --pretty=format:%H%x1f%s%x00`);
const commits = raw
  .split(NUL)
  .map((rec) => rec.trim())
  .filter(Boolean)
  .map((rec) => {
    const [sha, subject] = rec.split(US);
    return { sha, subject: (subject || '').trim() };
  });

/**
 * Conventional-commit prefix -> the tag the page colour-codes by (#1005 legend:
 * New = a capability that did not exist, Request = a change you asked for,
 * Bug = something was broken).
 */
function kindOf(subject) {
  if (/^[a-z]+(\([^)]*\))?!:/.test(subject) || /^BREAKING/.test(subject)) return ['Breaking', 'wn-breaking'];
  if (/^fix(\([^)]*\))?:/.test(subject)) return ['Bug', 'wn-bug'];
  if (/^feat(\([^)]*\))?:/.test(subject)) return ['New', 'wn-new'];
  if (/^docs(\([^)]*\))?:/.test(subject)) return ['Docs', 'wn-docs'];
  if (/^(perf|refactor)(\([^)]*\))?:/.test(subject)) return ['Fix', 'wn-fix'];
  return ['Change', 'wn-fix'];
}

/** Drop the conventional-commit prefix so the reader gets the sentence. */
function prose(subject) {
  const stripped = subject.replace(/^[a-z]+(\([^)]*\))?!?:\s*/, '');
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const ISSUE_URL = 'https://github.com/CieloVistaSoftware/wb-starter/issues/';

function itemFor(commit, index, listId) {
  const [label, cls] = kindOf(commit.subject);
  // Every issue the commit cites, deduped and in citation order. A commit
  // routinely closes two (`fix(#991,#1057):`).
  const issues = [...new Set((commit.subject.match(/#(\d{2,5})/g) || []).map((m) => m.slice(1)))];
  const links = issues
    .map((n) => `<a href="${ISSUE_URL}${n}" target="_blank" rel="noopener">#${n}</a>`)
    .join(' ');
  return `    <li id="${listId}-item-${index + 1}" class="wn-item ${cls}"><span class="wn-tag">${label}</span> `
    + `<strong>${esc(prose(commit.subject))}</strong>`
    + (links ? ` ${links}` : '')
    + '</li>';
}

const today = new Date().toISOString().slice(0, 10);
const id = `whats-new-${next.replace(/\./g, '-')}`;
const lead = commits.length === 1
  ? 'One change, shipped as its own batch.'
  : `${commits.length} changes, shipped as one batch.`;

const listId = `${id}-list`;

const section = [
  `<section id="${id}">`,
  `  <h2>${next} — ${today}</h2>`,
  `  <p id="${id}-note"><strong>${lead}</strong> Everything listed here is on <code>main</code> and therefore live at`,
  '  <a href="https://cielovistasoftware.github.io/wb-starter/" target="_blank" rel="noopener">cielovistasoftware.github.io/wb-starter</a>.',
  `  A push to <code>main</code> IS the deploy, so this version names exactly one published state (#1076).</p>`,
  `  <ul id="${listId}">`,
  ...commits.map((commit, index) => itemFor(commit, index, listId)),
  '  </ul>',
  '</section>',
  '',
].join('\n');

if (!commits.length) {
  console.error(`\n❌ Nothing to release — ${lastTag || 'HEAD'} already contains every commit.\n`);
  process.exit(1);
}

if (CHECK_ONLY) {
  console.log(section);
  process.exit(0);
}

const page = fs.readFileSync(PAGE, 'utf8');
if (page.includes(`id="${id}"`)) {
  console.log(`[whats-new-entry] ${next} already has a section — leaving it alone.`);
  process.exit(0);
}

/**
 * Insert ABOVE the newest existing release section, so the page stays
 * newest-first the way a reader expects. Anchoring on the first
 * `<section id="whats-new-` rather than on a marker comment: a marker is one
 * more thing that can be deleted by an unrelated edit, and this anchor is the
 * page's own structure.
 */
const anchor = page.indexOf('<section id="whats-new-');
if (anchor === -1) {
  console.error('\n❌ pages/whats-new.html has no <section id="whats-new-…"> to insert before.\n');
  process.exit(1);
}

const eol = page.includes('\r\n') ? '\r\n' : '\n';
const body = eol === '\r\n' ? section.split('\n').join('\r\n') : section;
fs.writeFileSync(PAGE, page.slice(0, anchor) + body + page.slice(anchor));

console.log(`[whats-new-entry] wrote ${commits.length} item(s) for ${next} (${range})`);
