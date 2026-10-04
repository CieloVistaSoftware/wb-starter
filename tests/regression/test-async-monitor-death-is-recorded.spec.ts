import { test, expect } from '../fixtures/offline';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * #1316 -- a test-async run always ends with a terminal state.
 *
 * A suite ran every test and data/test-status.json stayed "running" forever:
 * the monitor died without writing an end state (its async close handler can
 * throw, and an unhandled rejection ends Node before anything is written), so
 * anyone waiting on `state` waited forever.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LIB = pathToFileURL(path.join(ROOT, 'scripts/lib/run-status.mjs')).href;

/** Run a child that installs the guards over a "running" status, then does `act`. */
function crash(act: string, initialState = 'running') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-1316-'));
  const file = path.join(dir, 'status.json');
  const status = { state: initialState, startedAt: '2026-10-04T00:00:00Z', passed: 5082 };
  fs.writeFileSync(file, JSON.stringify(status));
  const script = `
    import { installDeathGuards } from ${JSON.stringify(LIB)};
    const status = ${JSON.stringify(status)};
    installDeathGuards(${JSON.stringify(file)}, () => status);
    ${act}
  `;
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8', timeout: 20_000 });
  const out = JSON.parse(fs.readFileSync(file, 'utf8'));
  fs.rmSync(dir, { recursive: true, force: true });
  return { code: r.status, out };
}

test('an unhandled rejection (a throw in the async close handler) leaves a terminal state', () => {
  const { code, out } = crash("Promise.reject(new Error('close handler blew up'));");
  expect(code).not.toBe(0);
  expect(out.state, 'the file must not stay "running"').toBe('died');
  expect(out.diedReason).toContain('close handler blew up');
  expect(out.completedAt).toBeTruthy();
});

test('an uncaught exception leaves a terminal state', () => {
  const { out } = crash("setTimeout(() => { throw new Error('monitor threw'); }, 10);");
  expect(out.state).toBe('died');
  expect(out.diedReason).toContain('monitor threw');
});

test('exiting before the run was finalized leaves a terminal state', () => {
  const { out } = crash('process.exit(3);');
  expect(out.state).toBe('died');
  expect(out.diedReason).toContain('code 3');
});

test('a finished run is never overwritten by the guard', () => {
  const { out } = crash('process.exit(0);', 'passed');
  expect(out.state).toBe('passed');
  expect(out.diedReason).toBeUndefined();
});

test('a hard-killed run is recognisable: "running" with no live monitor or Playwright', async () => {
  const { isRunDead } = await import(LIB);
  const dead = () => false;
  const alive = () => true;
  expect(isRunDead({ state: 'running', monitorPid: 111, pid: 222 }, dead)).toBe(true);
  expect(isRunDead({ state: 'running', monitorPid: 111, pid: 222 }, alive)).toBe(false);
  expect(isRunDead({ state: 'running' }, dead), 'nothing recorded yet is not proof of death').toBe(false);
  expect(isRunDead({ state: 'passed', monitorPid: 111 }, dead)).toBe(false);
});

test('test-async.mjs installs the guards and records the monitor pid', () => {
  const src = fs.readFileSync(path.join(ROOT, 'scripts/test-async.mjs'), 'utf8');
  expect(src).toMatch(/installDeathGuards\(statusFile, \(\) => status\)/);
  expect(src).toMatch(/status\.monitorPid = process\.pid/);
});
