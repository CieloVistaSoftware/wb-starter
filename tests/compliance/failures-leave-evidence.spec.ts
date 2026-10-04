import { test, expect } from '../fixtures/offline';
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * #1112 -- a failing test leaves evidence behind, not a sentence to theorize from.
 *
 * John: "WHEN WE TRACE WE COLLECT EVIDENCE." A release was blocked by
 * "Failed to load resource: the server responded with a status of 500 ()" --
 * no URL -- and ~40 minutes of guessing reached the wrong answer, while three
 * tracing layers sat off or unread. This holds two of them on:
 *
 *   1. Playwright keeps a trace for every failing test (trace is not 'off'),
 *      and CI uploads it.
 *   2. The server logs every failed response, whatever the path. It logged
 *      .js requests only, so a 500 on a doc, an image or an /api route never
 *      reached the log a failing run leaves behind.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test('a failing test keeps its Playwright trace', () => {
  test.skip(process.env.WB_TRACE === 'off', 'tracing explicitly turned off for this run');
  const trace = test.info().project.use.trace;
  const mode = typeof trace === 'string' ? trace : trace?.mode;
  expect(mode, "trace is 'off': a failure would leave no requests, statuses or DOM snapshots").not.toBe('off');
  expect(['on', 'retain-on-failure', 'retain-on-first-failure']).toContain(mode);
});

test('a failing test records every request it made (network.txt), since the trace does not (#1406)', () => {
  // Playwright records network only with snapshots on, and the default trace
  // keeps them off (they cost CI timeouts and route-mock clashes, PR #1407).
  // The offline fixture logs every response and failed request instead.
  const fixture = fs.readFileSync(path.join(ROOT, 'tests/fixtures/offline.ts'), 'utf8');
  expect(fixture).toMatch(/context\.on\('response'/);
  expect(fixture).toMatch(/context\.on\('requestfailed'/);
  expect(fixture, 'written only for a failing test, into its output folder').toMatch(/testInfo\.status !== testInfo\.expectedStatus[\s\S]{0,200}outputPath\('network\.txt'\)/);
});

test('CI uploads the traces and the server log of a failed run', () => {
  const ci = fs.readFileSync(path.join(ROOT, '.github/workflows/ci-tests.yml'), 'utf8');
  expect(ci, 'the trace zips are not uploaded').toMatch(/data\/playwright-output\/\*\*\/\*\.zip/);
  expect(ci, 'a failing test\'s network.txt is not uploaded (#1406)').toMatch(/data\/playwright-output\/\*\*\/network\.txt/);
  expect(ci, 'the server log is not kept').toMatch(/node server\.js > data\/test-results\/server\.log/);
  expect(ci, 'data/test-results (which holds server.log) is not uploaded').toMatch(/path:\s*data\/test-results\//);
});

test('a spec that shares one browser context across tests opts out of the per-test trace', () => {
  // Playwright stops a context's trace at the end of EACH test; a context built
  // once in beforeAll and shared fails the second test with "Tracing is already
  // stopping" (PR #1385's CI: five sweep specs, every test, in milliseconds).
  const dir = path.join(ROOT, 'tests');
  const specs: string[] = [];
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.spec.ts')) specs.push(p);
    }
  };
  walk(dir);
  const missing = specs.filter((f) => {
    const s = fs.readFileSync(f, 'utf8');
    const shares = /beforeAll\s*\(/.test(s) && /\b(newOfflinePage|newOfflineContext|browser\.newContext|browser\.newPage)\s*\(/.test(s);
    return shares && !/test\.use\(\{\s*trace:/.test(s);
  }).map((f) => path.relative(ROOT, f));
  expect(specs.length).toBeGreaterThan(100);
  expect(missing, 'shared-context specs without a trace opt-out').toEqual([]);
});

function freePort(): Promise<number> {
  return new Promise((resolve) => {
    const s = net.createServer().listen(0, () => { const p = (s.address() as net.AddressInfo).port; s.close(() => resolve(p)); });
  });
}

test.describe('the server logs every failed response', () => {
  // One server for the block. In parallel mode each test ran beforeAll in its
  // own worker and spawned its own server; under load one did not answer
  // inside the 30 s default and the test failed on startup, not on the log.
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(90_000);
  let server: ChildProcess | null = null;
  let out = '';
  let base = '';

  test.beforeAll(async () => {
    const port = await freePort();
    base = `http://localhost:${port}`;
    server = spawn(process.execPath, ['server.js'], {
      cwd: ROOT, env: { ...process.env, PORT: String(port), WB_NO_OPEN: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    server.stdout!.on('data', (d) => { out += d; });
    server.stderr!.on('data', (d) => { out += d; });
    await expect.poll(async () => { try { return (await fetch(base + '/')).status; } catch { return 0; } }, { timeout: 30_000 }).toBe(200);
  });

  test.afterAll(async () => {
    if (server && server.exitCode === null) {
      const exited = new Promise((r) => server!.once('exit', r));
      server.kill();
      await exited;
    }
  });

  for (const p of ['/docs/no-such-doc-1112.md', '/images/no-such-image-1112.png']) {
    test(`a failed ${path.extname(p)} request is in the log with its path and status`, async () => {
      const res = await fetch(base + p);
      expect(res.status).toBeGreaterThanOrEqual(400);
      const line = `[Request] GET ${p} (${res.status})`;
      await expect.poll(() => out.includes(line), { message: `the server log does not name the failed request: ${line}` }).toBe(true);
    });
  }
});
