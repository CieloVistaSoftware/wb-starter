import { test, expect } from '@playwright/test';
import { execFileSync, spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * The GitHub release for a version says what the Releases page says (#1182).
 *
 * .github/workflows/release.yml tags every "release: X.Y.Z" commit on main and
 * creates its GitHub release with these notes. 1.0.0 shipped to the site on
 * 2026-09-29 but never got its tag, GitHub release or npm packages, because
 * those steps depended on a person doing them by hand.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCRIPT = path.join(ROOT, 'scripts', 'release-notes.mjs');
const notes = (version: string) => spawnSync(process.execPath, [SCRIPT, version], { cwd: ROOT, encoding: 'utf8' });

test('1.0.0 notes: the summary, then what it added, changed and fixed, with issue numbers', () => {
  const out = execFileSync(process.execPath, [SCRIPT, '1.0.0'], { cwd: ROOT, encoding: 'utf8' });
  expect(out.startsWith('The first public release.')).toBe(true);
  expect(out).toContain('## Added');
  expect(out).toContain('## Fixed');
  expect(out).toContain('#813');
  // Markdown, not the page's HTML: no tags, no entities left behind.
  expect(out).not.toMatch(/<[a-z/][^>]*>/i);
  expect(out).not.toMatch(/&(#\d+|[a-z]+);/i);
});

test('a version with no entry stops the release instead of publishing empty notes', () => {
  const run = notes('9.9.9');
  expect(run.status).toBe(1);
  expect(run.stderr).toContain('no entry for version "9.9.9"');
});
