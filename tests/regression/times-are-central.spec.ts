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

/**
 * John, 2026-10-05: "x-clock should default to cst". The clock drew the
 * visitor's own hours (Date#getHours); it now shows Central unless
 * `timezone` names another zone or "local".
 */
test('x-clock shows Central by default, wherever the visitor is', async ({ browser }) => {
  const context = await browser.newContext({ timezoneId: 'Asia/Tokyo' });
  const page = await context.newPage();
  // 22:26:00 UTC = 17:26 CDT = 07:26 (next day) in Tokyo = 23:26 BST.
  await page.clock.setFixedTime(new Date('2026-10-05T22:26:00Z'));
  const warnings: string[] = [];
  page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 20_000 });
  const shown = await page.evaluate(async () => {
    const host = document.createElement('div');
    host.innerHTML =
      '<div id="c-default" x-clock></div>' +
      '<div id="c-local" x-clock timezone="local"></div>' +
      '<div id="c-london" x-clock timezone="Europe/London"></div>' +
      '<div id="c-bad" x-clock timezone="Mars/Olympus"></div>';
    document.body.appendChild(host);
    await (window as any).WB.scan(host, { eager: true });
    const text = (id: string) => (document.getElementById(id)?.textContent || '').trim();
    return { def: text('c-default'), local: text('c-local'), london: text('c-london'), bad: text('c-bad') };
  });
  expect(shown.def, 'default is Central').toBe('17:26:00');
  expect(shown.local, 'timezone="local" is the visitor (Tokyo)').toBe('07:26:00');
  expect(shown.london).toBe('23:26:00');
  expect(shown.bad, 'an unknown zone falls back to Central').toBe('17:26:00');
  expect(warnings.join('\n')).toContain('timezone="Mars/Olympus" is not a known time zone');
  await context.close();
});
