import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { releaseDate } from '../../scripts/lib/release-date.mjs';

/**
 * #1287. The Releases page showed 1.0.110 dated 2026-10-02 above 1.0.109 dated
 * 2026-10-03. A release's date was the first ten characters of the last
 * commit's `%cI`, which carries the COMMITTER'S OWN UTC offset: a GitHub merge
 * is +00:00, a local commit -05:00. Same evening, two calendar dates, wrong
 * order.
 *
 * Cases are generated from a parameter space and checked against a hand-written
 * table, not against the code under test: US Central is UTC-5 until
 * 2026-11-01 07:00Z, UTC-6 after.
 */

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/** The instant `ms` written with a given UTC offset in minutes, the way git writes %cI. */
function written(ms: number, offsetMin: number): string {
  const local = new Date(ms + offsetMin * 60_000);
  const sign = offsetMin < 0 ? '-' : '+';
  const abs = Math.abs(offsetMin);
  return (
    `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}` +
    `T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
}

// Offsets people and bots actually commit from, including half-hour and extreme ones.
const OFFSETS = [-720, -360, -300, 0, 330, 780];

test.describe('#1287 -- a release date is one calendar date in one timezone', () => {
  test('the pair from the report both fall on 2026-10-02', () => {
    expect(releaseDate('2026-10-03T00:48:00+00:00'), '1.0.109, made by a GitHub merge in UTC').toBe('2026-10-02');
    expect(releaseDate('2026-10-02T20:08:00-05:00'), '1.0.110, made locally in Central').toBe('2026-10-02');
  });

  test('the same instant gives the same date whatever offset it is written in', () => {
    const instants = [
      Date.UTC(2026, 9, 3, 0, 48),
      Date.UTC(2026, 9, 3, 4, 59, 59),
      Date.UTC(2026, 9, 3, 5, 0, 0),
      Date.UTC(2026, 11, 3, 5, 59, 59),
      Date.UTC(2026, 11, 3, 6, 0, 0),
      Date.UTC(2027, 0, 1, 0, 0, 0),
    ];
    for (const ms of instants) {
      const dates = new Set(OFFSETS.map((o) => releaseDate(written(ms, o))));
      expect([...dates], `${new Date(ms).toISOString()} written in ${OFFSETS.length} offsets gave more than one date`).toHaveLength(1);
    }
  });

  test('instants either side of Central midnight land on the right side, in daylight and standard time', () => {
    const table: Array<[string, string]> = [
      ['2026-10-03T04:59:59Z', '2026-10-02'], // 23:59:59 CDT
      ['2026-10-03T05:00:00Z', '2026-10-03'], //  00:00:00 CDT
      ['2026-11-01T05:59:59Z', '2026-11-01'], //  00:59:59 CDT, the morning DST ends
      ['2026-11-02T05:59:59Z', '2026-11-01'], //  23:59:59 CST
      ['2026-11-02T06:00:00Z', '2026-11-02'], //  00:00:00 CST
      ['2026-12-03T05:59:59Z', '2026-12-02'], // 23:59:59 CST
      ['2026-12-03T06:00:00Z', '2026-12-03'], //  00:00:00 CST
      ['2027-03-14T07:59:59Z', '2027-03-14'], //  01:59:59 CST, an hour before spring-forward
      ['2027-03-15T04:59:59Z', '2027-03-14'], // 23:59:59 CDT
      ['2027-03-15T05:00:00Z', '2027-03-15'], //  00:00:00 CDT
    ];
    for (const [iso, want] of table) {
      expect(releaseDate(iso), iso).toBe(want);
    }
  });

  test('dates never run backwards down a run of releases, whoever made each commit', () => {
    let prev = '';
    let ms = Date.UTC(2026, 8, 30, 0, 0);
    for (let i = 0; i < 400; i += 1) {
      ms += 37 * 60_000; // each release 37 minutes after the last
      const date = releaseDate(written(ms, OFFSETS[i % OFFSETS.length]));
      expect(date >= prev, `release ${i}: ${date} came after ${prev}`).toBe(true);
      prev = date;
    }
  });

  test('anything that is not a date throws instead of writing "Invalid Date" into the page', () => {
    for (const bad of ['', 'not a date', 'T20:08:00-05:00']) {
      expect(() => releaseDate(bad), JSON.stringify(bad)).toThrow(/cannot read/);
    }
  });

  test('release-versions.mjs goes through the helper rather than slicing the string', () => {
    const src = fs.readFileSync(path.join(REPO, 'scripts', 'release-versions.mjs'), 'utf8');
    expect(src, 'must import releaseDate').toMatch(/import\s*\{[^}]*releaseDate[^}]*\}\s*from\s*'\.\/lib\/release-date\.mjs'/);
    expect(src, 'the offset-dependent slice must be gone').not.toMatch(/\.date\.slice\(\s*0\s*,\s*10\s*\)/);
  });
});
