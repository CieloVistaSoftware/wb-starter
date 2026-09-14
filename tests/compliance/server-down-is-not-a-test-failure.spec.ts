/**
 * #1074: the dev server's output was captured nowhere, and a dead server was
 * scored as test failures.
 *
 * Two defects, one consequence: a run's failure count stopped measuring the
 * code. On 2026-09-08 one run reported 228 failures, 120 of which were
 * `net::ERR_CONNECTION_REFUSED` against the run's own localhost server — and
 * because Playwright's `webServer` output was not piped anywhere, there was no
 * record of why the server went away. data/test-status.json recorded all 228
 * identically, so everything reading it saw 228 test failures.
 *
 * What this spec holds in place:
 *
 *   1. playwright.config.ts starts the dev server THROUGH scripts/serve-with-log.mjs,
 *      which tees the server's stdout and stderr to a file under data/ and
 *      records how the process ended.
 *   2. That wrapper really does write stdout, stderr and the exit code to the
 *      file (proved against a stand-in server that prints and then dies).
 *   3. A failure whose error is "our own server refused the connection" is
 *      classified `server-down`; an assertion failure is `test`.
 *   4. A run whose failures are ALL server-down is `unreliable`, not `failed`,
 *      and a mixed run reports the two counts separately.
 *   5. scripts/test-async.mjs — the writer of data/test-status.json — actually
 *      uses that classification and records where the server log is.
 *
 * Error shapes in (3) are the ones found in data/test-results/archive/ on
 * 2026-09-13, not invented: Chromium's `net::ERR_CONNECTION_REFUSED at <url>`
 * (dominant) and WebKit's `Could not connect to server` with the URL only in
 * the call log. The Node `connect ECONNREFUSED` shape is what `request.*`
 * fixtures raise.
 *
 * Node-only: no browser, no page, no server request.
 */
import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const WRAPPER = path.join(REPO, 'scripts', 'serve-with-log.mjs');
const CLASSIFIER = path.join(REPO, 'scripts', 'lib', 'server-down.mjs');

/** Load the classifier without a static import, so its absence is a failed assertion, not a collection error. */
async function loadClassifier(): Promise<Record<string, any> | null> {
  if (!fs.existsSync(CLASSIFIER)) return null;
  return import(pathToFileURL(CLASSIFIER).href);
}

const CHROMIUM_REFUSED =
  'Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3310/demos/site/cards.html\n'
  + 'Call log:\n  - navigating to "http://localhost:3310/demos/site/cards.html", waiting until "load"';
const WEBKIT_REFUSED =
  'Error: page.goto: Could not connect to server\n'
  + 'Call log:\n  - navigating to "http://localhost:3310/pages/home.html", waiting until "load"';
const REQUEST_REFUSED =
  'Error: apiRequestContext.get: connect ECONNREFUSED ::1:3310\n'
  + 'Call log:\n  - → GET http://localhost:3310/api/fixes';
const ASSERTION =
  'Error: expect(received).toBe(expected) // Object.is equality\n\nExpected: 3\nReceived: 2';

test.describe('#1074 server output is captured and server-down is not a test failure', () => {
  test('playwright.config.ts starts the dev server through the log wrapper', () => {
    const config = fs.readFileSync(path.join(REPO, 'playwright.config.ts'), 'utf8');
    const block = config.match(/webServer:\s*\{([\s\S]*?)\n\s{2}\},/);
    expect(block, 'no webServer block found in playwright.config.ts').not.toBeNull();
    const command = (block![1].match(/command:\s*['"`]([^'"`]+)['"`]/) || [])[1] || '';
    expect(
      command,
      'webServer.command must run the server through scripts/serve-with-log.mjs; '
        + 'started directly, its stdout/stderr go nowhere and a mid-run death leaves no record (#1074)',
    ).toMatch(/^node scripts\/serve-with-log\.mjs\s+npm start$/);
  });

  test('the wrapper writes the server stdout, stderr and exit code to its log file', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-1074-'));
    const fakeServer = path.join(dir, 'fake-server.mjs');
    fs.writeFileSync(
      fakeServer,
      "process.stdout.write('WB Starter running at http://localhost:4321\\n');\n"
        + "process.stderr.write('Error: simulated crash stack\\n');\n"
        + 'process.exit(3);\n',
    );
    const logPath = path.join(dir, 'server.log');

    const run = spawnSync(
      process.execPath,
      [WRAPPER, `"${process.execPath}" "${fakeServer}"`],
      {
        cwd: REPO,
        encoding: 'utf8',
        timeout: 30_000,
        env: { ...process.env, WB_SERVER_LOG: logPath, PORT: '4321' },
      },
    );

    expect(fs.existsSync(logPath), `no log written at ${logPath}; wrapper stderr:\n${run.stderr}`).toBe(true);
    const log = fs.readFileSync(logPath, 'utf8');
    expect(log, 'the log header must name the port the server was asked for').toMatch(/port 4321/);
    expect(log, 'server stdout must reach the log').toContain('WB Starter running at http://localhost:4321');
    expect(log, 'server stderr (where a crash stack goes) must reach the log').toContain('Error: simulated crash stack');
    expect(log, 'how the server ended must be recorded').toMatch(/exited code=3/);
    expect(run.status, 'the wrapper must exit with the server exit code, not hide it').toBe(3);
  });

  test('a refused connection to our own server is server-down; an assertion is a test failure', async () => {
    const lib = await loadClassifier();
    expect(lib, `${path.relative(REPO, CLASSIFIER)} does not exist`).not.toBeNull();
    const { classifyFailure } = lib!;

    expect(classifyFailure(CHROMIUM_REFUSED, 3310)).toBe('server-down');
    expect(classifyFailure(WEBKIT_REFUSED, 3310)).toBe('server-down');
    expect(classifyFailure(REQUEST_REFUSED, 3310)).toBe('server-down');
    // Port unknown: any loopback refusal is still our server — tests here only target localhost.
    expect(classifyFailure(CHROMIUM_REFUSED, null)).toBe('server-down');

    expect(classifyFailure(ASSERTION, 3310)).toBe('test');
    expect(classifyFailure(null, 3310)).toBe('test');
    // A refusal on some OTHER port is not our server being down.
    expect(classifyFailure(CHROMIUM_REFUSED, 4000)).toBe('test');
    // A refusal from a remote host is not our server either.
    expect(classifyFailure('Error: page.goto: net::ERR_CONNECTION_REFUSED at https://example.com/', null)).toBe('test');
  });

  test('a run whose failures are all server-down is unreliable, not failed', async () => {
    const lib = await loadClassifier();
    expect(lib, `${path.relative(REPO, CLASSIFIER)} does not exist`).not.toBeNull();
    const { classifyRun } = lib!;

    const down = (name: string) => ({ file: 'tests/a.spec.ts', project: 'demos', name, error: CHROMIUM_REFUSED });
    const real = (name: string) => ({ file: 'tests/b.spec.ts', project: 'demos', name, error: ASSERTION });

    const allDown = classifyRun({ exitCode: 1, failures: [down('a'), down('b'), down('c')], port: 3310 });
    expect(allDown.state).toBe('unreliable');
    expect(allDown.serverDown).toBe(3);
    expect(allDown.testFailed).toBe(0);
    expect(allDown.reliable).toBe(false);
    expect(allDown.failures.map((f: any) => f.category)).toEqual(['server-down', 'server-down', 'server-down']);

    const mixed = classifyRun({ exitCode: 1, failures: [down('a'), real('b')], port: 3310 });
    expect(mixed.state).toBe('failed');
    expect(mixed.serverDown).toBe(1);
    expect(mixed.testFailed).toBe(1);
    expect(mixed.reliable).toBe(false);

    const honest = classifyRun({ exitCode: 1, failures: [real('b')], port: 3310 });
    expect(honest.state).toBe('failed');
    expect(honest.serverDown).toBe(0);
    expect(honest.reliable).toBe(true);

    const green = classifyRun({ exitCode: 0, failures: [], port: 3310 });
    expect(green.state).toBe('passed');
    expect(green.reliable).toBe(true);
  });

  test('test-async.mjs writes the classification and the server log path into its status file', () => {
    const src = fs.readFileSync(path.join(REPO, 'scripts', 'test-async.mjs'), 'utf8');
    expect(src, 'test-async.mjs must use the shared classifier').toMatch(
      /import\s*\{[^}]*\bclassifyRun\b[^}]*\}\s*from\s*["']\.\/lib\/server-down\.mjs["']/,
    );
    expect(src, 'classifyRun must actually be called, not just imported').toMatch(/\bclassifyRun\(\s*\{/);
    expect(src, 'the server-down count must be written into the status').toMatch(/status\.serverDown\s*=/);
    expect(
      src,
      'the final state must come from the classification, not from the exit code alone — '
        + 'exit-code-only is what scored a dead server as N test failures',
    ).not.toMatch(/status\.state\s*=\s*exitCode\s*===\s*0\s*\?\s*["']passed["']\s*:\s*["']failed["']/);
    expect(src, 'the final state must be derived from the classification').toMatch(/status\.state\s*=\s*[^;\n]*[Cc]lassif/);
    expect(src, 'the server log path must be handed to Playwright').toMatch(/WB_SERVER_LOG/);
    expect(src, 'the server log path must be recorded in the status file').toMatch(/status\.serverLog\s*=/);
  });
});
