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
 *   - its summary is the merge's PR title; its items are the non-merge commits
 *     it brought, linked to their issues (scripts/lib/release-item.mjs).
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
import { esc, issueLinks, itemFor } from './lib/release-item.mjs';
import { STAMP_SUBJECT as STAMP, countBase } from './lib/push-count.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data', 'releases.json');
const CHECK_ONLY = process.argv.includes('--check');

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();
const NUL = String.fromCharCode(0);
const US = String.fromCharCode(31);

// Where the badge's count starts (push-count.mjs): a tag, or the 1.0.89 anchor.
const start = countBase(ROOT);
if (!start) { console.error('[release-versions] no release tag: nothing to count from'); process.exit(1); }
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

const spine = commits('--first-parent', '--reverse', `${tag}..HEAD`);
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
  for (const p of pending) {
    if (STAMP.test(p.subject)) continue;
    const prTitle = p.subject.match(/^Merge (?:PR|pull request) #(\d+)[: ](?:from \S+\s*)?(.*)$/i);
    if (prTitle) titles.push({ pr: Number(prTitle[1]), title: (prTitle[2] || p.body.split('\n')[0] || '').trim() });
    // The commits this one brought: the merge's own branch side, or itself.
    const brought = p.subject.startsWith('Merge ')
      ? commits('--no-merges', `${p.sha}^1..${p.sha}`)
      : [p];
    for (const b of brought) {
      if (STAMP.test(b.subject) || seen.has(b.subject)) continue;
      seen.add(b.subject);
      items.push(itemFor(b.subject, b.body));
    }
  }
  pending = [];
  if (!items.length) return;

  const prLink = (n) => `<a href="https://github.com/CieloVistaSoftware/wb-starter/pull/${n}" target="_blank" rel="noopener">PR ${n}</a>`;
  const summary = titles.map((t) => {
    const refs = [...new Set((t.title.match(/#(\d{2,5})/g) || []).map((m) => Number(m.slice(1))))];
    const text = t.title.replace(/\s*\((?:#\d+[,\s/]*)+\)|\s*#\d+\b/g, '').trim();
    return `${esc(text.charAt(0).toUpperCase() + text.slice(1))} (${prLink(t.pr)})${refs.length ? ' ' + issueLinks(refs) : ''}`;
  }).join(' · ');
  entries.push({ version: versionOf(count), date: last.date.slice(0, 10), summary, items });
});

entries.reverse(); // newest first, as the page lists them

if (CHECK_ONLY) {
  console.log(JSON.stringify(entries.slice(0, 3), null, 2));
  console.log(`[release-versions] ${entries.length} version(s) since ${start.release}`);
  process.exit(0);
}

const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const generated = new RegExp(`^${maj}\\.${min}\\.(\\d+)$`);
const isGenerated = (v) => { const m = String(v).match(generated); return !!m && Number(m[1]) > pat; };
const kept = data.releases.filter((r) => !isGenerated(r.version));
data.releases = [...entries, ...kept];
fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
console.log(`[release-versions] wrote ${entries.length} version(s) since ${start.release}; newest ${entries[0] ? entries[0].version : '(none)'}`);
