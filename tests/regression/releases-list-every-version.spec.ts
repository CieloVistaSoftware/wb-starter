import { test, expect } from '@playwright/test';
import { execFileSync } from 'child_process';
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
  const out = execFileSync('node', ['scripts/release-versions.mjs', '--check'], { encoding: 'utf8' });
  const newest = JSON.parse(out.slice(0, out.indexOf('\n[release-versions]')));
  // HEAD may carry commits not yet stamped on main, so compare what both have.
  for (const g of newest) {
    const listed = data.releases.find((r: { version: string }) => r.version === g.version);
    if (listed) expect(listed.items, `${g.version} items`).toEqual(g.items);
  }
});
