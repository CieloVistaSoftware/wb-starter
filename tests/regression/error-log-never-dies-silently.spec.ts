import { test, expect } from '@playwright/test';
import { readFileSync, existsSync, mkdtempSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * #1027 — the test suite must not destroy the error log in silence.
 *
 * John: "there were 26 or more errors in the error log where did they go?"
 *
 * `resetErrorLog()` overwrites data/errors.json with an empty log at the start
 * of EVERY playwright run — correct intent (#562: the gate cannot fail on
 * entries left by earlier runs), but data/errors.json is the ONLY store. In one
 * session that path ran ~17 times, and 26+ real errors were gone with no
 * archive, no console line, and no way back.
 *
 * The fix is not "stop clearing" — it is "never clear without keeping a copy and
 * saying so". These assertions hold that shape in place:
 *
 *   1. the archive is attempted BEFORE the clearing write, not after
 *   2. an empty log is skipped, so a clean run stays quiet
 *   3. a failed archive WARNS — swallowing it recreates the exact defect
 *   4. the retention floor is 30 days and pruning is opt-in
 *   5. the append cap drops the OLDEST entries, not the newest
 *
 * Ordering is asserted on source position because that is precisely what broke:
 * the clear existed and the archive did not. A reporter's onBegin cannot be
 * invoked from inside a run of itself, so the round-trip below exercises the
 * archive's data contract directly instead.
 */

const REPORTER = 'scripts/tools/test-reporter.ts';
const PRUNE = 'scripts/prune-error-archives.mjs';

const reporter = readFileSync(REPORTER, 'utf8');

test.describe('#1027: the error log is archived before it is cleared', () => {
  test('the archive is written BEFORE the log is overwritten', () => {
    const archiveAt = reporter.indexOf('error-log-archive');
    const clearAt = reporter.search(/count:\s*0,\s*errors:\s*\[\]/);

    expect(archiveAt, `${REPORTER} no longer archives to data/error-log-archive/`).toBeGreaterThan(-1);
    expect(clearAt, `${REPORTER} no longer resets the error log`).toBeGreaterThan(-1);

    expect(
      archiveAt < clearAt,
      `The clearing write now comes BEFORE the archive in ${REPORTER}. The log is the only\n` +
      `copy on disk, so clearing first is the same as not archiving at all — that is #1027.`,
    ).toBe(true);
  });

  test('an empty log is not archived, so a clean run stays quiet', () => {
    expect(
      /count\s*!==\s*0/.test(reporter),
      `${REPORTER} no longer guards on a non-empty log, so every clean run writes a useless\n` +
      `archive and the directory fills with empty files.`,
    ).toBe(true);
  });

  test('an archive that cannot be written says so instead of being swallowed', () => {
    const block = reporter.slice(
      reporter.indexOf('error-log-archive'),
      reporter.indexOf('error-log-archive') + 1600,
    );
    expect(
      /catch\s*\([\s\S]{0,40}\)\s*\{[\s\S]{0,400}?console\.(warn|error)/.test(block),
      `The archive's catch block no longer reports the failure. Losing the log QUIETLY is the\n` +
      `entire defect #1027 exists to prevent — a silent catch here restores it exactly.`,
    ).toBe(true);
  });

  test('the log path prints what it archived and where', () => {
    expect(
      /console\.log\([\s\S]{0,200}?archived to/.test(reporter),
      `${REPORTER} no longer prints the archive path. A wipe a person cannot see is the defect.`,
    ).toBe(true);
  });
});

test.describe('#1027: archived logs are kept for 30 days', () => {
  const prune = existsSync(PRUNE) ? readFileSync(PRUNE, 'utf8') : '';

  test('pruning exists, is opt-in, and refuses a window under 30 days', () => {
    expect(prune, `${PRUNE} is missing — nothing enforces the retention rule`).not.toBe('');
    expect(
      /days\s*<\s*30/.test(prune),
      `${PRUNE} no longer refuses a retention window below 30 days. John: "all of our error\n` +
      `logs must stay on the system for 30 days."`,
    ).toBe(true);
    expect(
      /--confirm/.test(prune),
      `${PRUNE} deletes without requiring --confirm. Destroying logs must be opt-in.`,
    ).toBe(true);
  });
});

test.describe('#1027: an archive round-trips without losing entries', () => {
  test('a copy taken before clearing preserves every entry verbatim', () => {
    // The reporter copies the file byte-for-byte before overwriting it. This
    // exercises that contract on a real file, independent of the run.
    const dir = mkdtempSync(join(tmpdir(), 'reg1027-'));
    try {
      const log = join(dir, 'errors.json');
      const entries = Array.from({ length: 26 }, (_, i) => ({
        message: `real error ${i + 1}`,
        at: new Date().toISOString(),
      }));
      writeFileSync(log, JSON.stringify({ count: entries.length, errors: entries }, null, 2), 'utf8');

      const before = readFileSync(log, 'utf8');
      const archive = join(dir, 'errors-archived.json');
      writeFileSync(archive, before, 'utf8');
      writeFileSync(log, JSON.stringify({ count: 0, errors: [] }, null, 2), 'utf8');

      const recovered = JSON.parse(readFileSync(archive, 'utf8'));
      expect(recovered.errors, 'the archive lost entries the live log had').toHaveLength(26);
      expect(recovered.errors[0].message).toBe('real error 1');
      expect(recovered.errors[25].message).toBe('real error 26');
      expect(JSON.parse(readFileSync(log, 'utf8')).errors, 'the live log was not cleared').toHaveLength(0);
      expect(readdirSync(dir)).toContain('errors-archived.json');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('the append cap drops the OLDEST entries, never the newest', () => {
    const server = readFileSync('server.js', 'utf8');
    expect(
      /slice\(-\s*ERROR_LOG_CAP\s*\)/.test(server),
      'server.js no longer caps the error log with slice(-ERROR_LOG_CAP). A bare .slice(-100)\n' +
      'silently pushed entry 1 out when entry 101 arrived — the other half of #1027.',
    ).toBe(true);
  });
});
