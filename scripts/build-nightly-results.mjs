#!/usr/bin/env node
/**
 * Merge the Nightly run's per-category test reports into the three files the
 * test dashboard reads, so the static site can show the last nightly run.
 *
 * GitHub Pages serves files only; data/test-status.json, data/test-results.json
 * and data/test-results/failures.json are written by a local run and are
 * gitignored, so public/test-dashboard.html had nothing to show on the live
 * site. Nightly.yml downloads every "test-results-*" artifact into one folder
 * (one sub-folder per category, each holding the reporter's summary.json,
 * failures.json and <project>.json) and runs this script; the output is
 * pushed to the nightly-results branch, where the dashboard reads it.
 *
 * It also writes performance-results.json for public/performance-dashboard.html:
 * the committed history in data/performance-results.json plus this run's
 * performance/*.jsonl lines -- the same merge server.js's
 * /api/performance-results does, which a static site cannot run.
 *
 * Usage: node scripts/build-nightly-results.mjs <artifactsDir> <outDir>
 *   env: RUN_URL, COMMIT, STARTED_AT (optional, for the status line)
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

const [, , artifactsDir, outDir] = process.argv;
if (!artifactsDir || !outDir) {
  console.error('Usage: node scripts/build-nightly-results.mjs <artifactsDir> <outDir>');
  process.exit(2);
}

/** Read JSON, or null when the file is missing or unreadable. */
function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

/** Milliseconds as the dashboard's duration column parses them ("850ms", "1.2s"). */
function formatDuration(ms) {
  if (typeof ms !== 'number') return '';
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
}

const results = [];
const perf = readJson(join('data', 'performance-results.json')) || [];
const failures = [];
const totals = { passed: 0, failed: 0, skipped: 0 };
let latest = '';

const categoryDirs = existsSync(artifactsDir)
  ? readdirSync(artifactsDir).map((d) => join(artifactsDir, d)).filter((d) => statSync(d).isDirectory())
  : [];

for (const dir of categoryDirs) {
  const perfDir = join(dir, 'performance');
  if (existsSync(perfDir)) {
    for (const name of readdirSync(perfDir).filter((n) => n.endsWith('.jsonl'))) {
      for (const line of readFileSync(join(perfDir, name), 'utf8').split('\n')) {
        if (!line.trim()) continue;
        try { perf.push(JSON.parse(line)); } catch { /* a line cut short by a killed worker */ }
      }
    }
  }

  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.json') || name === 'in-flight.json') continue;
    const data = readJson(join(dir, name));
    if (!data) continue;

    if (name === 'failures.json') {
      failures.push(...(data.failures || []));
    } else if (Array.isArray(data.tests) && data.project) {
      // A per-project file: one row per test.
      for (const t of data.tests) {
        results.push({
          file: t.file,
          name: t.title,
          project: data.project,
          status: t.status === 'timedOut' ? 'failed' : t.status,
          duration: formatDuration(t.duration),
        });
      }
      totals.passed += data.stats?.passed || 0;
      totals.failed += data.stats?.failed || 0;
      totals.skipped += data.stats?.skipped || 0;
      if (data.timestamp > latest) latest = data.timestamp;
    }
  }
}

const completedAt = latest || new Date().toISOString();
const total = totals.passed + totals.failed + totals.skipped;
const status = {
  source: 'nightly',
  state: total === 0 ? 'error' : totals.failed > 0 ? 'failed' : 'passed',
  total,
  ...totals,
  startedAt: process.env.STARTED_AT || undefined,
  completedAt,
  updatedAt: completedAt,
  commit: process.env.COMMIT || undefined,
  runUrl: process.env.RUN_URL || undefined,
  failures: failures.map((f) => ({ file: f.file, name: f.title })),
};

mkdirSync(join(outDir, 'test-results'), { recursive: true });
writeFileSync(join(outDir, 'test-status.json'), JSON.stringify(status, null, 2));
writeFileSync(join(outDir, 'test-results.json'), JSON.stringify({ completedAt, results }, null, 2));
writeFileSync(
  join(outDir, 'test-results', 'failures.json'),
  JSON.stringify({ timestamp: completedAt, count: failures.length, failures }, null, 2)
);
perf.sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
writeFileSync(join(outDir, 'performance-results.json'), JSON.stringify(perf.slice(-1000), null, 2));

console.log(`Nightly results: ${categoryDirs.length} categories, ${total} tests, ${totals.failed} failed.`);
