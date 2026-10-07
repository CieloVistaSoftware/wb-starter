#!/usr/bin/env node
/**
 * release-versions.mjs — one Releases-page entry for every 1.0.N on main.
 *
 * John, 2026-10-02: "A release has no meaning if i can't read about the
 * content." The badge shows 1.0.<pushes since the tag>, and every push
 * to main is live, but data/releases.json only had tagged releases -- so the
 * page said "1.0.0 · Live now" while the site ran 1.0.83, and nothing said
 * what any 1.0.N contained.
 *
 * Every entry is computed from git, never written by hand, so it cannot drift:
 *   - walk main's first-parent history since the tag, oldest first;
 *   - a version is a first-parent commit -- except that a merge immediately
 *     followed by its "chore(version): stamp" commit is ONE version, numbered
 *     like the stamp (that is the commit the live site serves);
 *   - its number is the badge's: tag patch + pushes since the tag
 *     (scripts/lib/push-count.mjs -- pushes, not commits);
 *   - its summary says what the issue was: the commit's `Summary:` line, else
 *     the title of the issue it cites, else the merge's PR title (#1533);
 *   - its `seeIt` says how to recreate the change by hand -- what to do, what
 *     you saw Before, what you see Now: data/release-see-it.json for that
 *     version, else the commit's `See it:` line when seeItProblems() passes it
 *     (#1533). Kept entries (history, tags) take their steps from the file too;
 *   - its items are the non-merge commits it brought, linked to their issues
 *     (scripts/lib/release-item.mjs).
 *
 * Generated entries replace every 1.0.N (N > 0) already in the file; tagged
 * releases (1.0.0, 4.x) and history are left alone. Re-running is a no-op.
 *
 *   node scripts/release-versions.mjs                     # up to HEAD
 *   node scripts/release-versions.mjs --check             # print, change nothing
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, issueLinks, itemFor, linkify, linksFrom, releaseNotes, seeItProblems } from './lib/release-item.mjs';
import { issueTitles } from './lib/issue-titles.mjs';
import { ANCHOR, STAMP_SUBJECT as STAMP, countBase, isReleaseMerge } from './lib/push-count.mjs';
import { releaseDate } from './lib/release-date.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data', 'releases.json');
const CHECK_ONLY = process.argv.includes('--check');
// How to recreate each version by hand, written from its issue's own body (#1533).
const STEPS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'release-see-it.json'), 'utf8'));
/** A steps line as HTML: escaped, `code` spans kept as code (commands, file names). */
const stepsHtml = (text) => linkify(esc(text.charAt(0).toUpperCase() + text.slice(1)).replace(/`([^`]+)`/g, '<code>$1</code>'));
const REPO_URL = 'https://github.com/CieloVistaSoftware/wb-starter';
/** A link that opens in a new tab, as every link on the page does. */
const ext = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
/** The short sha, linked to the commit on GitHub: its message and its diff. */
const commitLink = (sha) => ext(`${REPO_URL}/commit/${sha}`, `<code>${sha.slice(0, 7)}</code>`);
// --check reads the cached titles only, so it is repeatable offline.
const TITLES = issueTitles(ROOT, { refresh: !CHECK_ONLY });

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();
const NUL = String.fromCharCode(0);
const US = String.fromCharCode(31);

// Where the badge's count starts (push-count.mjs): a tag, or the 1.0.89 anchor.
const start = countBase(ROOT);
if (!start) {
  // Say WHY, so a CI log is enough to diagnose it (a Windows runner reported
  // only this line once, with full history fetched).
  const probe = (...args) => {
    try { return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim() || '(empty)'; }
    catch (e) { return `FAILED: ${String((e.stderr || e.message) || e).trim().split('\n')[0]}`; }
  };
  console.error('[release-versions] no release tag: nothing to count from');
  console.error(`  git --version            : ${probe('--version')}`);
  console.error(`  HEAD                     : ${probe('rev-parse', 'HEAD')}`);
  console.error(`  describe --tags          : ${probe('describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*', 'HEAD')}`);
  console.error(`  anchor ${ANCHOR.commit.slice(0, 8)} type    : ${probe('cat-file', '-t', ANCHOR.commit)}`);
  console.error(`  anchor is ancestor       : ${probe('merge-base', '--is-ancestor', ANCHOR.commit, 'HEAD') === '(empty)' ? 'yes' : 'no'}`);
  console.error(`  shallow                  : ${probe('rev-parse', '--is-shallow-repository')}`);
  process.exit(1);
}
const tag = start.base;
const [maj, min, pat] = start.release.split('.').map(Number);
const versionOf = (count) => `${maj}.${min}.${pat + count}`;

/** Commits as {sha, subject, body, date}, from `git log` with the given args. */
function commits(...args) {
  const out = git('log', ...args, "--format=%H%x1f%s%x1f%b%x1f%cI%x00");
  return out.split(NUL).map((r) => r.replace(/^\n/, '')).filter(Boolean).map((r) => {
    const [sha, subject, body, date] = r.split(US);
    return { sha, subject: subject.trim(), body: (body || '').trim(), date: (date || '').trim() };
  });
}

// The merge that landed the release commit is the release's own push, and the
// release already has its entry (push-count.mjs, isReleaseMerge).
const spine = commits('--first-parent', '--reverse', `${tag}..HEAD`).filter((c) => !isReleaseMerge(ROOT, tag, c.sha));
const entries = [];
let pending = [];

spine.forEach((c, i) => {
  pending.push(c);
  const next = spine[i + 1];
  // A merge waits for its stamp commit; anything else closes the version.
  if (next && STAMP.test(next.subject) && !STAMP.test(c.subject)) return;

  const last = pending[pending.length - 1];
  // Pushes, not commits: this version's number is how many non-stamp
  // first-parent commits there are up to and including it (push-count.mjs).
  const count = spine.slice(0, i + 1).filter((s) => !STAMP.test(s.subject)).length;

  const items = [];
  const titles = [];
  const seen = new Set();
  const bodies = [];
  const links = [];
  // The commit that shows this version's whole change: its merge, else itself.
  let code = null;
  let notes = { summary: null, seeIt: null };
  // The first See it line that can be followed, from whichever commit has it.
  // Taking the first one found let a commit with a weak line hide the good one
  // a sibling commit in the same version carried (1.0.384, #1516).
  let followable = null;
  const consider = (n) => {
    if (!followable && n.seeIt && !seeItProblems(n.seeIt, n.summary).length) followable = n.seeIt;
  };
  for (const p of pending) {
    if (STAMP.test(p.subject)) continue;
    const prTitle = p.subject.match(/^Merge (?:PR|pull request) #(\d+)[: ](?:from \S+\s*)?(.*)$/i);
    if (prTitle) titles.push({ pr: Number(prTitle[1]), title: (prTitle[2] || p.body.split('\n')[0] || '').trim() });
    if (!code || p.subject.startsWith('Merge ')) code = p.sha;
    const own = releaseNotes(p.body);
    notes = { summary: notes.summary || own.summary, seeIt: notes.seeIt || own.seeIt };
    consider(own);
    // The commits this one brought: the merge's own branch side, or itself.
    const brought = p.subject.startsWith('Merge ')
      ? commits('--no-merges', `${p.sha}^1..${p.sha}`)
      : [p];
    for (const b of brought) {
      if (STAMP.test(b.subject) || seen.has(b.subject)) continue;
      seen.add(b.subject);
      bodies.push(b.body);
      const theirs = releaseNotes(b.body);
      notes = { summary: notes.summary || theirs.summary, seeIt: notes.seeIt || theirs.seeIt };
      consider(theirs);
      for (const l of linksFrom(b.body)) if (!links.some((k) => k.href === l.href)) links.push(l);
      // Each item links to its own commit, so every line of work is one click away.
      const item = itemFor(b.subject, b.body);
      item.html = linkify(item.html) + ' ' + commitLink(b.sha);
      items.push(item);
    }
  }
  pending = [];
  if (!items.length) return;

  const prLink = (n) => `<a href="https://github.com/CieloVistaSoftware/wb-starter/pull/${n}" target="_blank" rel="noopener">PR ${n}</a>`;
  const upper = (text) => text.charAt(0).toUpperCase() + text.slice(1);
  // Every issue the version cites: in its PR titles and in its commits.
  const refs = [...new Set([
    ...titles.flatMap((t) => (t.title.match(/#(\d{2,5})/g) || []).map((m) => Number(m.slice(1)))),
    ...items.flatMap((i) => i.issues || []),
  ])];
  const prs = titles.map((t) => prLink(t.pr)).join(', ');
  const tail = `${prs ? ` (${prs})` : ''}${refs.length ? ' ' + issueLinks(refs) : ''}`;
  const named = refs.map((n) => TITLES[n]).filter(Boolean);
  let summary;
  if (notes.summary) summary = esc(upper(notes.summary)) + tail;
  // An issue title is shown as written: capitalising it turned "x-dialog: …" into "X-dialog".
  else if (named.length) summary = named.map((t) => esc(t)).join(' · ') + tail;
  else if (explains(bodies)) summary = esc(explains(bodies)) + tail;
  else {
    summary = titles.map((t) => {
      const own = [...new Set((t.title.match(/#(\d{2,5})/g) || []).map((m) => Number(m.slice(1))))];
      const text = t.title.replace(/\s*\((?:#\d+[,\s/]*)+\)|\s*#\d+\b/g, '').trim();
      return `${esc(upper(text))} (${prLink(t.pr)})${own.length ? ' ' + issueLinks(own) : ''}`;
    }).join(' · ');
  }
  // Every place a summary names is a link, whichever source the text came from.
  summary = linkify(summary);
  const version = versionOf(count);
  const steps = STEPS[version] || followable;
  const entry = { version, date: releaseDate(last.date), summary, items };
  if (steps) entry.seeIt = stepsHtml(steps);
  // Where to see the work: the whole change, then the commits' own Links blocks.
  entry.links = [{ label: 'Code', html: commitLink(code) },
    ...links.map((l) => ({ label: esc(l.label), html: ext(esc(l.href), esc(l.href)) }))];
  entries.push(entry);
});

/**
 * The first paragraph of a commit body, when there is no issue to name: in
 * this repo it is where the commit says what was wrong. Trailers, sign-offs
 * and "Fixes #N" lines are not an explanation.
 */
function explains(bodyList) {
  for (const body of bodyList) {
    const para = String(body || '').split(/\n\s*\n/)
      .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
      .find((p) => p && !/^(Co-Authored-By|Claude-Session|Signed-off-by|Summary|See it|Fixes|Closes|Refs?)\b/i.test(p) && !/^[-*#|`]/.test(p));
    if (!para) continue;
    if (para.length <= 300) return para;
    const cut = para.slice(0, 300);
    const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('." '));
    return end > 80 ? cut.slice(0, end + 1) : `${cut.slice(0, cut.lastIndexOf(' '))}…`;
  }
  return null;
}

entries.reverse(); // newest first, as the page lists them

if (CHECK_ONLY) {
  console.log(JSON.stringify(entries.slice(0, 3), null, 2));
  console.log(`[release-versions] ${entries.length} version(s) since ${start.release}`);
  process.exit(0);
}

const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const generated = new RegExp(`^${maj}\\.${min}\\.(\\d+)$`);
const isGenerated = (v) => { const m = String(v).match(generated); return !!m && Number(m[1]) > pat; };
const kept = data.releases.filter((r) => !isGenerated(r.version)).map((r) => {
  const steps = STEPS[r.version];
  return steps ? { ...r, seeIt: stepsHtml(steps) } : r;
});
data.releases = [...entries, ...kept];
fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
console.log(`[release-versions] wrote ${entries.length} version(s) since ${start.release}; newest ${entries[0] ? entries[0].version : '(none)'}`);
