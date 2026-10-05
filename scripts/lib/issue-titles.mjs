/**
 * Issue titles for the Releases page (#1533): a version's summary is the
 * title of the issue it fixed, not its PR title repeated.
 *
 * Read with GitHub's REST API through `gh` (the stamp workflow passes its
 * token), and kept in data/issue-titles.json so a run without network, and
 * `release-versions.mjs --check`, read the same titles.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const REPO = 'CieloVistaSoftware/wb-starter';

/** { number: title } for every issue (not PR), or null when GitHub cannot be reached. */
export function fetchIssueTitles(repo = REPO) {
  // Page by number rather than `gh api --paginate`: --paginate follows the
  // Link header's repositories/{id}/... URLs, which some proxies refuse.
  const titles = {};
  for (let page = 1; page <= 100; page++) {
    const run = spawnSync('gh', ['api', `repos/${repo}/issues?state=all&per_page=100&page=${page}`,
      '--jq', '.[] | "\\(.number)\\t\\(if .pull_request then "PR" else "ISSUE" end)\\t\\(.title)"'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true, timeout: 60000 });
    if (run.error || run.status !== 0) return null;
    const lines = run.stdout.split(/\r?\n/).filter(Boolean);
    if (!lines.length) break;
    for (const line of lines) {
      const [number, kind, ...title] = line.split('\t');
      if (kind === 'ISSUE') titles[number] = title.join('\t').trim();
    }
  }
  return Object.keys(titles).length ? titles : null;
}

/**
 * The cached titles, refreshed from GitHub when `refresh` is set and GitHub
 * answers. A failed refresh keeps the cache: a title never disappears because
 * the network did.
 */
export function issueTitles(root, { refresh = false } = {}) {
  const file = path.join(root, 'data', 'issue-titles.json');
  let cached = {};
  try { cached = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* no cache yet */ }
  if (!refresh) return cached;
  const fresh = fetchIssueTitles();
  if (!fresh) return cached;
  const merged = { ...cached, ...fresh };
  const sorted = Object.fromEntries(Object.keys(merged).sort((a, b) => a - b).map((k) => [k, merged[k]]));
  fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + '\n');
  return sorted;
}
