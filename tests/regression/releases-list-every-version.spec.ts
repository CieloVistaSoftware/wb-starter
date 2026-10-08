import { test, expect } from '@playwright/test';
import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';

/**
 * John, 2026-10-02: "A release has no meaning if i can't read about the
 * content." The badge shows 1.0.<commits since the v1.0.0 tag>; the Releases
 * page must have an entry for those versions, newest first, each saying what
 * it contains with links. scripts/release-versions.mjs computes them from git
 * and the stamp workflow runs it on every push to main.
 */
const data = JSON.parse(readFileSync('data/releases.json', 'utf8'));
const patch = (v: string) => Number(v.split('.')[2]);

test('1.0.N versions are listed newest first, each with a summary and items', () => {
  const ones = data.releases.filter((r: { version: string }) => /^1\.0\.[1-9]\d*$/.test(r.version));
  expect(ones.length, 'no 1.0.N version is listed').toBeGreaterThan(0);
  expect(data.releases[0].version, 'the newest entry is a 1.0.N version, not the tag').toBe(ones[0].version);
  for (let i = 1; i < ones.length; i++) expect(patch(ones[i - 1].version)).toBeGreaterThan(patch(ones[i].version));
  for (const r of ones) {
    expect(r.items.length, `${r.version} says nothing`).toBeGreaterThan(0);
    expect(r.date, `${r.version} has no date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  }
});

test('the generator reproduces the checked-in entries (nothing hand-edited, nothing missing)', () => {
  // spawnSync, not execFileSync: on failure the generator's own diagnosis
  // (stderr) must reach the test report, not just "Command failed".
  const run = spawnSync(process.execPath, ['scripts/release-versions.mjs', '--check'], { encoding: 'utf8' });
  expect(run.status, `release-versions --check failed:\n${run.stderr}`).toBe(0);
  const out = run.stdout;
  const newest = JSON.parse(out.slice(0, out.indexOf('\n[release-versions]')));
  // HEAD may carry commits not yet stamped on main, so compare what both have.
  // #961: on the Windows runner this failed twice with one version holding the
  // whole history (1.0.401, 1,686 items) while the same merge passes locally,
  // so a mismatch names what the generator counted from, not only that it differs.
  const where = () => {
    const git = (...a: string[]) => spawnSync('git', a, { encoding: 'utf8' }).stdout?.trim() || '(empty)';
    return [
      out.slice(out.indexOf('\n[release-versions]')).trim(),
      `HEAD ${git('rev-parse', 'HEAD')} parents ${git('log', '-1', '--format=%P')}`,
      `describe ${git('describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*', 'HEAD')}`,
      // As push-count.mjs releaseCommit() reads it: the newest SUBJECT that is a release.
      `release commit ${git('log', '-E', '--grep=^release: [0-9]+\\.[0-9]+\\.[0-9]+', '--format=%h %s').split('\n').find((l) => / release: \d+\.\d+\.\d+/.test(l)) || '(none)'}`,
      `shallow ${git('rev-parse', '--is-shallow-repository')}`,
      `first-parent commits ${git('rev-list', '--count', '--first-parent', 'HEAD')}`,
    ].join('\n');
  };
  for (const g of newest) {
    const listed = data.releases.find((r: { version: string }) => r.version === g.version);
    if (!listed) continue;
    const same = JSON.stringify(listed.items) === JSON.stringify(g.items);
    const why = same ? '' : ` (${g.items.length} generated, ${listed.items.length} listed)\n${where()}`;
    expect(listed.items, `${g.version} items${why}`).toEqual(g.items);
  }
});
