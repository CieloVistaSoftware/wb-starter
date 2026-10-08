import { test, expect } from '../fixtures/offline';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { failureAttachments } from '../../scripts/tools/test-reporter';

/**
 * A "PROMISE WAS COLLECTED" FAILURE NAMES ITS CAUSE (#961)
 * ========================================================
 * On CI, an evaluate() call fails with "Runtime.callFunctionOn: Promise was
 * collected" even for promises a live timer holds. The DOM survives and the
 * page's JavaScript has stopped. A failing test now carries:
 *
 *   page-lifecycle  every context/frame event the page's CDP session saw,
 *                   on the protocol-errors clock;
 *   page-death      a verdict read from an isolated world: main world dead,
 *                   page frozen, or main world alive (an app-level hang).
 *
 * The tests that fail on purpose live in tests/fixtures/page-death/ and run in
 * their own Playwright process, so this spec sees exactly what the offline
 * fixture attaches and what the reporter keeps. Both inner failures are real:
 * a dropped promise, garbage-collected, through Playwright's real rewrite. In
 * one the page is alive; in the other its scripts are disabled over CDP, so its
 * timers stop while the DOM and CDP evaluation keep working, which is the CI
 * shape.
 */

const ROOT = process.cwd();
const INNER_CONFIG = join(ROOT, 'tests/fixtures/page-death/inner.config.ts');

type Attachment = { name: string; contentType: string; body?: string };
type InnerResult = { title: string; status: string; error: string; attachments: Attachment[] };

function runInner(outDir: string): InnerResult[] {
  const cli = join(dirname(createRequire(import.meta.url).resolve('@playwright/test/package.json')), 'cli.js');
  const run = spawnSync(process.execPath, [cli, 'test', '--config', INNER_CONFIG], {
    cwd: ROOT,
    env: { ...process.env, WB_PAGE_DEATH_OUT: outDir },
    encoding: 'utf8',
    timeout: 120_000,
  });
  let report: { suites: { specs?: { title: string; tests: { results: { status: string; error?: { message?: string }; attachments: (Attachment & { body?: string })[] }[] }[] }[] }[] };
  try {
    report = JSON.parse(readFileSync(join(outDir, 'report.json'), 'utf8'));
  } catch (err) {
    throw new Error(`the inner run left no report (${(err as Error).message})\n${run.stdout}\n${run.stderr}`);
  }
  const out: InnerResult[] = [];
  for (const suite of report.suites) for (const spec of suite.specs || []) for (const t of spec.tests) for (const r of t.results) {
    out.push({
      title: spec.title,
      status: r.status,
      error: r.error?.message || '',
      // The JSON reporter base64-encodes inline bodies.
      attachments: r.attachments.map((a) => ({ ...a, body: a.body ? Buffer.from(a.body, 'base64').toString('utf8') : undefined })),
    });
  }
  return out;
}

const body = (r: InnerResult, name: string) => r.attachments.find((a) => a.name === name)?.body;

test.describe('page death diagnostics (#961)', () => {
  test.setTimeout(150_000);

  // Playwright requires a destructured first parameter even when no fixture is used.
  // eslint-disable-next-line no-empty-pattern
  test('a failing test names a dead main world, a live one, and leaves passing tests alone', async ({}, testInfo) => {
    const results = runInner(testInfo.outputPath('inner'));
    const by = (prefix: string) => {
      const r = results.find((x) => x.title.startsWith(prefix));
      if (!r) throw new Error(`inner test "${prefix}" did not run: ${results.map((x) => x.title).join(', ')}`);
      return r;
    };
    const alive = by('alive:');
    const dead = by('dead:');
    const passes = by('passes:');

    for (const r of [alive, dead]) {
      expect(r.status, `${r.title} is meant to fail`).toBe('failed');
      expect(r.error, 'Playwright rewrites the browser error').toContain('Execution context was destroyed');
      expect(body(r, 'protocol-errors'), 'the browser\'s own error').toMatch(/^\+\d+ms Runtime\.callFunctionOn: Promise was collected$/m);
      const lifecycle = body(r, 'page-lifecycle') || '';
      expect(lifecycle, 'the CDP event log, on the protocol-errors clock').toMatch(/^\+\d+ms Runtime\.executionContextCreated #\d+ main world main-frame /m);
      expect(lifecycle).toMatch(/^\+\d+ms Page\.lifecycleEvent load main-frame$/m);
    }

    const aliveDeath = body(alive, 'page-death') || '';
    expect(aliveDeath.split('\n')[0]).toBe('main world alive (heartbeat running) — app-level hang');
    const aliveBeat = /^heartbeat: (\d+) -> (\d+) /m.exec(aliveDeath);
    expect(aliveBeat, aliveDeath).not.toBeNull();
    expect(Number(aliveBeat![2]), 'the heartbeat advanced between two reads').toBeGreaterThan(Number(aliveBeat![1]));
    expect(aliveDeath).toMatch(/^main-world evaluate: answered$/m);

    const deadDeath = body(dead, 'page-death') || '';
    expect(deadDeath.split('\n')[0]).toMatch(/^main world dead \(heartbeat stopped at \+\d+ms\)$/);
    const deadBeat = /^heartbeat: (\d+) -> (\d+) /m.exec(deadDeath);
    expect(deadBeat, deadDeath).not.toBeNull();
    expect(deadBeat![2], 'the heartbeat did not move between two reads').toBe(deadBeat![1]);

    // A passing test pays for none of it.
    expect(passes.status).toBe('passed');
    expect(passes.attachments.map((a) => a.name)).not.toContain('page-death');
    expect(passes.attachments.map((a) => a.name)).not.toContain('page-lifecycle');

    // The reporter keeps the text in failures.json and the live log.
    const kept = failureAttachments({ attachments: dead.attachments.map((a) => ({ ...a, body: a.body ? Buffer.from(a.body) : undefined })) }) || [];
    for (const name of ['protocol-errors', 'page-lifecycle', 'page-death']) {
      expect(kept.find((a) => a.name === name)?.body, `${name} inlined by the reporter`).toBe(body(dead, name));
    }
  });

  test('a long page-lifecycle log keeps its end in failures.json', () => {
    const lines = Array.from({ length: 2000 }, (_, i) => `+${i}ms Page.lifecycleEvent load main-frame`);
    const [kept] = failureAttachments({ attachments: [{ name: 'page-lifecycle', contentType: 'text/plain', body: Buffer.from(lines.join('\n')) }] }) || [];
    expect(kept.body).toMatch(/^… \d+ earlier line\(s\) not kept\n/);
    expect(kept.body!.endsWith(lines[lines.length - 1])).toBe(true);
  });

  test('the heartbeat attributes belong to the harness alone', () => {
    // data-pw-* must never be a name the app reads or writes, so the heartbeat
    // cannot change what a behavior or a snapshot of <html> sees.
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const abs = join(dir, name);
        if (statSync(abs).isDirectory()) walk(abs);
        else if (/\.(js|mjs|html|css|json)$/.test(name) && readFileSync(abs, 'utf8').includes('data-pw-')) hits.push(abs.slice(ROOT.length + 1));
      }
    };
    for (const dir of ['src', 'pages', 'demos']) walk(join(ROOT, dir));
    expect(hits).toEqual([]);
  });
});
