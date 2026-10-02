import { test, expect } from '@playwright/test';
import { execFileSync } from 'child_process';
import { appendFileSync, mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { pullLatest } from '../../scripts/lib/pull-latest.mjs';

/**
 * John, 2026-10-02: "NPM Start should do a pull first every time?" -- npm start
 * and the version badge both run pullLatest(). Found while wiring it into
 * npm start: the porcelain output was trim()med, so the first " M path" line
 * lost its leading space and slice(3) cut the path's first letter --
 * "src/core/version.js" read as "rc/core/version.js", was taken for the
 * person's own work, and EVERY pull was refused.
 *
 * A checkout behind its origin, with only the stamp dirty, must update; one
 * with a real edit must be left alone.
 */
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function behindByOne(): { dir: string; clone: string } {
  const dir = mkdtempSync(path.join(tmpdir(), 'pull-latest-'));
  const origin = path.join(dir, 'origin');
  mkdirSync(path.join(origin, 'src/core'), { recursive: true });
  git(origin, 'init', '-q', '-b', 'main');
  git(origin, 'config', 'user.email', 't@t'); git(origin, 'config', 'user.name', 't');
  writeFileSync(path.join(origin, 'src/core/version.js'), 'export const VERSION = {};\n');
  writeFileSync(path.join(origin, 'README.md'), 'readme\n');
  git(origin, 'add', '-A'); git(origin, 'commit', '-qm', 'one');
  const clone = path.join(dir, 'clone');
  git(dir, 'clone', '-q', origin, clone);
  writeFileSync(path.join(origin, 'new.txt'), 'two\n');
  git(origin, 'add', '-A'); git(origin, 'commit', '-qm', 'two');
  return { dir, clone };
}

test('a stamp-only dirty checkout is updated to the latest main', () => {
  const { dir, clone } = behindByOne();
  try {
    appendFileSync(path.join(clone, 'src/core/version.js'), '// restamped\n');
    const result = pullLatest(clone);
    expect(result.message).toContain('updated to the latest main');
    expect(result.updated).toBe(true);
    expect(git(clone, 'rev-list', '--count', 'HEAD..origin/main')).toBe('0');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a checkout with the person\'s own edit is left untouched', () => {
  const { dir, clone } = behindByOne();
  try {
    appendFileSync(path.join(clone, 'README.md'), 'mine\n');
    const result = pullLatest(clone);
    expect(result.updated).toBe(false);
    expect(result.message).toContain('README.md');
    expect(git(clone, 'diff', '--name-only')).toBe('README.md');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('an entry page whose only change is the ?v= cache key counts as build output', async () => {
  const { isBuildOutput } = await import('../../scripts/lib/build-output.mjs');
  const { dir, clone } = behindByOne();
  try {
    writeFileSync(path.join(clone, 'index.html'), '<script src="a.js?v=1.0.1"></script>\n');
    git(clone, 'add', '-A'); git(clone, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'page');
    writeFileSync(path.join(clone, 'index.html'), '<script src="a.js?v=1.0.9"></script>\n');
    expect(isBuildOutput(clone, 'index.html')).toBe(true);
    writeFileSync(path.join(clone, 'index.html'), '<script src="b.js?v=1.0.9"></script>\n');
    expect(isBuildOutput(clone, 'index.html')).toBe(false);
    expect(isBuildOutput(clone, 'docs/manifest.json')).toBe(true);
    expect(isBuildOutput(clone, 'README.md')).toBe(false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
