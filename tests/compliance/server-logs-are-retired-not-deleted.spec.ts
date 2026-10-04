import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
// @ts-expect-error -- plain .mjs module, no type declarations
import { retireServerLogs, describeRetirement, RETIRE_AFTER_DAYS } from '../../scripts/lib/retire-server-logs.mjs';

/**
 * #1130: data/test-server-logs/ grew without limit -- one log per run since
 * #1074, nothing retiring them (136 MB measured). Logs are never deleted, so
 * the bound is compression: a log older than RETIRE_AFTER_DAYS becomes
 * run.log.gz, read back and matched before its original goes. These check the
 * guarantee that matters -- no byte of evidence is lost -- not just that a
 * file got smaller.
 */
const DAY = 24 * 60 * 60 * 1000;

function makeDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wb-1130-'));
}
function writeLog(dir: string, name: string, body: string, ageDays: number, now: number) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, body);
  const t = new Date(now - ageDays * DAY);
  fs.utimesSync(file, t, t);
}

test('old logs are compressed, recent ones untouched, and every byte survives (#1130)', () => {
  const dir = makeDir();
  const now = Date.now();
  const oldBody = '# server started\n' + 'GET /pages/home.html 200\n'.repeat(5000);
  const newBody = '# today\nGET / 200\n';
  writeLog(dir, 'old-run.log', oldBody, RETIRE_AFTER_DAYS + 3, now);
  writeLog(dir, 'new-run.log', newBody, 1, now);
  fs.writeFileSync(path.join(dir, 'notes.txt'), 'not a log');

  const r = retireServerLogs(dir, { now });

  expect(r.compressed).toEqual(['old-run.log']);
  expect(r.failed).toEqual([]);
  expect(fs.existsSync(path.join(dir, 'old-run.log')), 'the original goes only once its copy matched').toBe(false);
  const restored = gunzipSync(fs.readFileSync(path.join(dir, 'old-run.log.gz'))).toString();
  expect(restored, 'the compressed log must hold every byte of the original').toBe(oldBody);
  expect(fs.readFileSync(path.join(dir, 'new-run.log'), 'utf8'), 'a recent log stays plain text').toBe(newBody);
  expect(fs.readFileSync(path.join(dir, 'notes.txt'), 'utf8'), 'only *.log files are touched').toBe('not a log');
  expect(r.bytesAfter).toBeLessThan(r.bytesBefore);
  expect(describeRetirement(r)).toContain('compressed 1 older than');
});

test('a second pass changes nothing, and an existing .gz is never overwritten (#1130)', () => {
  const dir = makeDir();
  const now = Date.now();
  writeLog(dir, 'a.log', 'first\n', RETIRE_AFTER_DAYS + 1, now);
  retireServerLogs(dir, { now });
  const gzBefore = fs.readFileSync(path.join(dir, 'a.log.gz'));

  // A new a.log with the same name: its .gz already exists, so both are left alone.
  writeLog(dir, 'a.log', 'second\n', RETIRE_AFTER_DAYS + 1, now);
  const r = retireServerLogs(dir, { now });
  expect(r.compressed).toEqual([]);
  expect(r.failed.join(' ')).toContain('already exists');
  expect(fs.readFileSync(path.join(dir, 'a.log'), 'utf8')).toBe('second\n');
  expect(fs.readFileSync(path.join(dir, 'a.log.gz')).equals(gzBefore), 'an existing archive is never rewritten').toBe(true);
});

test('every test-async run applies the retention and records what it did (#1130)', () => {
  const src = fs.readFileSync(path.join(process.cwd(), 'scripts', 'test-async.mjs'), 'utf8');
  expect(src).toMatch(/retireServerLogs\(/);
  expect(src).toMatch(/status\.serverLogRetention\s*=/);
});
