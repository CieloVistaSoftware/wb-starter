import { test, expect } from '@playwright/test';
import { keepUpToDate, restampArgs } from '../../scripts/lib/pull-latest.mjs';

/**
 * John, 2026-10-10: "the local version must always match the .io". The live
 * site showed v1.0.481 while a local server still showed an older number.
 * Two causes, both in scripts/lib/pull-latest.mjs:
 *
 *   1. After a badge-click update the re-stamp wrote the TRACKED
 *      src/core/version.js, but the dev server serves .local/ (#1131), so the
 *      badge kept the old number until a restart.
 *   2. Nothing updated a server that was left running: npm start pulled once,
 *      and main moves many times a day.
 *
 * The schedule is injected, so each tick is run by the test, not waited for.
 */

/** keepUpToDate is off on a test or CI server, which this run may be. */
function asLocalServer<T>(fn: () => T): T {
  const saved = { CI: process.env.CI, WB_NO_OPEN: process.env.WB_NO_OPEN };
  delete process.env.CI; delete process.env.WB_NO_OPEN;
  try { return fn(); } finally {
    if (saved.CI !== undefined) process.env.CI = saved.CI;
    if (saved.WB_NO_OPEN !== undefined) process.env.WB_NO_OPEN = saved.WB_NO_OPEN;
  }
}

/** A schedule the test drives: `tick()` runs one check and waits for it. */
function manualSchedule() {
  let fn: (() => Promise<void>) | null = null;
  let everyMs = 0;
  let cancelled = false;
  return {
    schedule: (f: () => Promise<void>, ms: number) => { fn = f; everyMs = ms; return 1; },
    cancel: () => { cancelled = true; },
    tick: () => fn!(),
    get scheduled() { return fn !== null; },
    get everyMs() { return everyMs; },
    get cancelled() { return cancelled; },
  };
}

test('the re-stamp after an update writes the local stamp the dev server serves', () => {
  const args = restampArgs('/repo');
  expect(args[0].replace(/\\/g, '/')).toBe('/repo/scripts/stamp-version.js');
  expect(args, 'without --local the badge keeps the old number until a restart').toContain('--local');
});

test('a running server keeps checking main, every two minutes by default', async () => {
  const clock = manualSchedule();
  let calls = 0;
  const logs: string[] = [];
  const replies = [
    { updated: false, message: 'already the latest code' },
    { updated: true, message: 'updated to the latest main (+1 commit)' },
    { updated: false, message: 'already the latest code' },
  ];
  const stop = asLocalServer(() => keepUpToDate('/repo', {
    update: async () => replies[calls++],
    log: (m: string) => logs.push(m),
    schedule: clock.schedule, cancel: clock.cancel,
  }));
  expect(clock.scheduled).toBe(true);
  expect(clock.everyMs).toBe(120000);
  await clock.tick(); await clock.tick(); await clock.tick();
  expect(calls, 'every tick checks main again, not only the first').toBe(3);
  expect(logs, 'up to date or updated is not news worth a line per tick').toEqual([]);
  stop();
  expect(clock.cancelled).toBe(true);
});

test('a copy that cannot update says why once, not every tick', async () => {
  const clock = manualSchedule();
  const logs: string[] = [];
  const stop = asLocalServer(() => keepUpToDate('/repo', {
    update: async () => ({ updated: false, message: 'on branch "feature", not main -- not updated' }),
    log: (m: string) => logs.push(m),
    schedule: clock.schedule, cancel: clock.cancel,
  }));
  await clock.tick(); await clock.tick(); await clock.tick();
  stop();
  expect(logs).toHaveLength(1);
  expect(logs[0]).toContain('on branch "feature"');
  expect(logs[0]).toContain('fall behind the live site');
});

test('it never runs on a test or CI server', () => {
  const clock = manualSchedule();
  const saved = process.env.CI;
  process.env.CI = 'true';
  try {
    keepUpToDate('/repo', { update: async () => ({ updated: false, message: '' }), schedule: clock.schedule, cancel: clock.cancel });
  } finally { if (saved === undefined) delete process.env.CI; else process.env.CI = saved; }
  expect(clock.scheduled, 'nothing is scheduled at all').toBe(false);
});
