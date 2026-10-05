import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';
import { centralDay, centralClock, centralDateTime, TIME_ZONE } from '../../src/core/central-time.js';
import { readGitCreated } from '../../scripts/lib/git-dates.mjs';
import { execFileSync } from 'child_process';
import os from 'os';

/**
 * Every date and time the site shows is US Central (#1553).
 *
 * John, 2026-10-05: "make all datetime use cst". Sixteen displays formatted
 * in the viewer's own zone, and docs dates were the committer's own calendar
 * day (git %cs). All of them now go through src/core/central-time.js.
 */
const ROOT = process.cwd();

test('Central is America/Chicago: CDT until November, CST after', () => {
  expect(TIME_ZONE).toBe('America/Chicago');
  expect(centralClock('2026-10-05T22:26:00Z')).toBe('5:26 PM CDT');
  expect(centralClock('2026-12-01T18:00:00Z')).toBe('12:00 PM CST');
  expect(centralDateTime('2026-10-05T22:26:00Z')).toBe('Oct 5, 2026, 5:26 PM CDT');
});

test('a late-evening UTC instant is still the Central calendar day', () => {
  // 03:30 UTC on the 6th is 10:30 PM on the 5th in Chicago.
  expect(centralDay('2026-10-06T03:30:00Z')).toBe('2026-10-05');
});

test('no display formats a date or time in the viewer\'s own zone', () => {
  const hits: string[] = [];
  const walk = (dir: string) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) { if (name !== 'node_modules') walk(full); continue; }
      if (!/\.(js|mjs|html)$/.test(name)) continue;
      fs.readFileSync(full, 'utf8').split('\n').forEach((line, i) => {
        if (/toLocale(Date|Time)?String\(/.test(line) && !/timeZone/.test(line) && !/^\s*(\/\/|\*)/.test(line)) {
          hits.push(`${path.relative(ROOT, full)}:${i + 1}`);
        }
      });
    }
  };
  for (const dir of ['src', 'pages', 'public']) walk(path.join(ROOT, dir));
  expect(hits, 'use src/core/central-time.js (window.WBTime in a classic script)').toEqual([]);
});

test('a doc\'s date is its commit\'s Central day, whoever committed it', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'central-'));
  const git = (args: string[], env: Record<string, string> = {}) =>
    execFileSync('git', args, { cwd: dir, env: { ...process.env, ...env }, stdio: 'pipe' });
  git(['init', '-q']);
  git(['config', 'user.email', 't@example.com']);
  git(['config', 'user.name', 't']);
  fs.mkdirSync(path.join(dir, 'docs'));
  fs.writeFileSync(path.join(dir, 'docs', 'a.md'), '# a\n');
  git(['add', '.']);
  // Committed at 03:30 UTC on the 6th by someone in UTC: %cs said 2026-10-06.
  git(['commit', '-q', '-m', 'a'], { GIT_COMMITTER_DATE: '2026-10-06T03:30:00+00:00', GIT_AUTHOR_DATE: '2026-10-06T03:30:00+00:00' });
  expect(readGitCreated(dir, ['docs'])?.get('docs/a.md')).toBe('2026-10-05');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('a visitor in another zone still sees Central', async ({ browser }) => {
  const context = await browser.newContext({ timezoneId: 'Asia/Tokyo' });
  const page = await context.newPage();
  await page.goto('/');
  await page.waitForFunction(() => (window as any).WBTime, null, { timeout: 15_000 });
  const shown = await page.evaluate(() => (window as any).WBTime.clock('2026-10-05T22:26:00Z'));
  const local = await page.evaluate(() => new Date('2026-10-05T22:26:00Z').toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
  expect(local, 'the browser really is in Tokyo').toBe('7:26 AM');
  expect(shown).toBe('5:26 PM CDT');
  await context.close();
});
