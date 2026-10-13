/**
 * The Fix Viewer's table, traced from git (#912, #1861).
 *
 * John: "I need to be able to track fixes back to the issue and then what
 * release they were put into", and "the issue is the source of truth,
 * everything else should build on that".
 *
 * So the ISSUE LIST comes first and is authoritative: a `#NNNN` in a commit
 * message counts only when an issue with that number exists (that is what
 * keeps `#6366`, a number in a commit body that was never an issue, out of the
 * table). A commit cites its issue, and the EARLIEST tag containing the commit
 * is the release it shipped in.
 *
 * Used twice, so the two can never disagree:
 * - server.js serves it live as /api/fixes on port 3000;
 * - scripts/generate-fixes.mjs writes it to data/fixes.json in the stamp
 *   workflow, because the live site is static and has no /api/fixes (#1861:
 *   the viewer there showed 13 hand-written rows from 2026-02-16).
 *
 * "Release" is the version that took the fix live -- the number the site's
 * badge showed -- else the first release tag containing it.
 *
 * Links are not stored: every one is built from `repo`, a sha and a path, so
 * the committed file stays small (#1054 measured the old payload at 5 MB).
 */
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

export const REPO = 'CieloVistaSoftware/wb-starter';

/** Most files listed for one issue; a sweep can touch hundreds. */
const FILES_PER_ISSUE = 25;

/**
 * Every issue (not PR) as { number, title, state, closedAt, priority }, or null
 * when GitHub cannot be reached. REST, paged by number: `gh issue list` is
 * GraphQL and stops at --limit, which this repo outgrew.
 */
export async function fetchIssues(repo = REPO) {
  const run = promisify(execFile);
  const issues = [];
  for (let page = 1; page <= 100; page++) {
    let list;
    try {
      const { stdout } = await run('gh', ['api', `repos/${repo}/issues?state=all&per_page=100&page=${page}`],
        { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true, timeout: 60000 });
      list = JSON.parse(stdout);
    } catch { return null; }
    if (!Array.isArray(list) || !list.length) break;
    for (const i of list) {
      if (i.pull_request) continue;
      issues.push({
        number: i.number,
        title: i.title,
        state: String(i.state || 'unknown').toLowerCase(),
        closedAt: i.closed_at || null,
        priority: (i.labels || []).map((l) => l.name).find((n) => /^priority:[1-5]$/.test(n)) || null,
      });
    }
  }
  return issues.length ? issues : null;
}

/** 1.0.9 before 1.0.10: compared as numbers, not text. */
const byVersion = (a, b) => {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let k = 0; k < 3; k++) if ((pa[k] || 0) !== (pb[k] || 0)) return (pa[k] || 0) - (pb[k] || 0);
  return 0;
};

/**
 * Commit sha -> the 1.0.N it went live in, read from data/releases.json (the
 * Releases page, scripts/release-versions.mjs), which links every commit each
 * version brought. Every push to main is a version, and only three are tagged,
 * so the tags alone said "unreleased" for nearly everything since 1.0.400.
 */
export function versionsBySha(root) {
  const bySha = new Map();
  let releases = [];
  try { releases = JSON.parse(fs.readFileSync(path.join(root, 'data', 'releases.json'), 'utf8')).releases || []; } catch { /* no Releases page yet */ }
  for (const r of releases) {
    for (const m of JSON.stringify(r.items || []).matchAll(/\/commit\/([0-9a-f]{40})/g)) {
      const v = `v${r.version}`;
      if (!bySha.has(m[1]) || byVersion(v, bySha.get(m[1])) < 0) bySha.set(m[1], v);
    }
  }
  return bySha;
}

/**
 * The traced table for `ref` (default HEAD): one row per issue that a commit
 * on it cites, newest issue first. Deterministic for a given ref and issue
 * list -- no clock time -- so regenerating an unchanged main changes nothing.
 */
export function traceFixes({ root, issues, ref = 'HEAD', repo = REPO }) {
  const US = String.fromCharCode(31);
  const RS = String.fromCharCode(30);
  const NL = String.fromCharCode(10);
  const git = (args) => {
    try {
      return execFileSync('git', args, {
        cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, timeout: 60000, windowsHide: true,
      });
    } catch { return ''; }
  };

  const meta = new Map(issues.map((i) => [i.number, i]));

  // Releases, oldest first, so the first tag containing a commit is the
  // release it shipped in.
  const tags = git(['tag', '--list', 'v*', '--sort=v:refname', '--merged', ref])
    .split(NL).map((t) => t.trim()).filter(Boolean);
  const tagSets = tags.map((t) => [t, new Set(git(['rev-list', t]).split(NL).filter(Boolean))]);
  // The version that took it live, else the first tag that contains it.
  const versions = versionsBySha(root);
  const releaseOf = (sha) => versions.get(sha) || (tagSets.find(([, set]) => set.has(sha)) || [null])[0];

  // One log pass. With --name-only git prints a commit's files AFTER its
  // formatted record, so once split on RS the files of record N lead chunk N+1.
  const chunks = git(['log', ref, '--name-only', `--format=%H${US}%s${US}%b`.concat(RS)]).split(RS);
  const records = [];
  chunks.forEach((chunk, idx) => {
    const lines = chunk.split(NL);
    let i = 0;
    const leading = [];
    for (; i < lines.length && !/^[0-9a-f]{40}$/.test(lines[i].split(US)[0].trim()); i++) {
      if (lines[i].trim()) leading.push(lines[i].trim());
    }
    if (idx > 0 && records.length) records[records.length - 1].files = leading;
    const [sha, subject = '', body = ''] = lines.slice(i).join(NL).replace(/^\s+/, '').split(US);
    if (/^[0-9a-f]{40}$/.test(sha)) records.push({ sha, subject, body, files: [] });
  });

  const byIssue = new Map();
  for (const { sha, subject, body, files } of records) {
    const cited = new Set([...`${subject} ${body}`.matchAll(/#(\d{3,5})(?!\d)/g)]
      .map((m) => Number(m[1]))
      .filter((n) => meta.has(n)));
    if (!cited.size) continue;
    const release = releaseOf(sha);
    for (const n of cited) {
      if (!byIssue.has(n)) byIssue.set(n, []);
      byIssue.get(n).push({ sha: sha.slice(0, 10), subject, release, files });
    }
  }

  const rows = [...byIssue.entries()].map(([number, cites]) => {
    const i = meta.get(number);
    // Every file the fix touched, each pinned to the commit that touched it.
    const files = [];
    const seen = new Set();
    for (const c of cites) {
      for (const f of c.files) {
        if (seen.has(f) || files.length >= FILES_PER_ISSUE) continue;
        seen.add(f);
        files.push({ path: f, sha: c.sha });
      }
    }
    return {
      number,
      title: i.title || null,
      state: i.state || 'unknown',
      closedAt: i.closedAt || null,
      priority: i.priority || null,
      commits: cites.map(({ sha, subject, release }) => ({ sha, subject, release })),
      files,
      release: cites.map((c) => c.release).filter(Boolean).sort(byVersion)[0] || null,
    };
  }).sort((a, b) => b.number - a.number);

  const head = git(['log', '-1', '--format=%H%x1f%cI', ref]).trim().split(US);
  return {
    repo,
    builtFrom: { sha: head[0] || null, date: head[1] || null },
    counts: {
      traced: rows.length,
      released: rows.filter((r) => r.release).length,
      unreleased: rows.filter((r) => !r.release).length,
      open: rows.filter((r) => r.state === 'open').length,
      closed: rows.filter((r) => r.state === 'closed').length,
    },
    releases: tags,
    rows,
  };
}
