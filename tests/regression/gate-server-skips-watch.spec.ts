import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * #1200. The dev-server log the gate already writes showed the same line in
 * every gate run, seconds after start: a spurious "[File Changed] ... ->
 * Reloading clients..." from the server's own file-watcher, which tells every
 * open test page to reload mid-run. (The server was first thought to die
 * there; it does not -- the log going quiet afterwards is browser caching, and
 * the tail-of-suite stall is #962.) A one-shot throwaway checkout has no use
 * for live-reload, so the suite's server runs with DISABLE_WATCH=true.
 *
 * Two things have to be true for that fix to mean anything:
 *  1. server.js's watcher actually honours DISABLE_WATCH (run, not read --
 *     #1049's lesson: a check that greps for a phrase passes on code that no
 *     longer does anything).
 *  2. the run that starts the suite's server sets it: since 2026-10-02 that is
 *     CI (ci-tests.yml, which nightly.yml calls), not a local commit gate.
 */

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function runServer(env: NodeJS.ProcessEnv): Promise<{ output: string; proc: ReturnType<typeof spawn> }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, ['server.js'], { cwd: REPO, env });
    let output = '';
    const onData = (buf: Buffer) => {
      output += buf.toString();
      if (/WB Starter running at/.test(output)) {
        proc.stdout?.off('data', onData);
        resolve({ output, proc });
      }
    };
    proc.stdout?.on('data', onData);
    proc.stderr?.on('data', onData);
    proc.on('error', reject);
    setTimeout(() => reject(new Error(`server.js never printed its ready line. Output so far:\n${output}`)), 15_000);
  });
}

test.describe('#1200 -- the gate\'s throwaway server does not arm a live-reload watcher', () => {
  test('server.js skips fs.watch when DISABLE_WATCH=true', async () => {
    const { output, proc } = await runServer({
      ...process.env,
      PORT: '0',
      CI: '',
      DISABLE_WATCH: 'true',
    });
    try {
      expect(output, 'the watcher must announce that it is skipping, not just silently not log a change').toContain('[Watch] skipping fs.watch');
    } finally {
      proc.kill();
    }
  });

  test('server.js watches by default (the guard above is actually testing something)', async () => {
    const env = { ...process.env, PORT: '0' };
    delete env.CI;
    delete env.DISABLE_WATCH;
    // #1311: a test server never watches, and playwright.config marks this
    // whole run as one (WB_TEST_SERVER=1) -- clear it to get the dev default.
    delete env.WB_TEST_SERVER;
    const { output, proc } = await runServer(env);
    try {
      expect(output, 'without CI or DISABLE_WATCH set, the watcher must be armed -- otherwise the first test above proves nothing').not.toContain('[Watch] skipping fs.watch');
    } finally {
      proc.kill();
    }
  });

  // The local 10th-commit gate (.husky/gate-staged-tree.mjs) is gone since
  // 2026-10-02; the full suite runs in CI (ci-tests.yml, also called by
  // nightly.yml). That is now the run whose server must not live-reload.
  test('CI\'s test job sets DISABLE_WATCH for the server it starts', () => {
    const wf = fs.readFileSync(path.join(REPO, '.github', 'workflows', 'ci-tests.yml'), 'utf8');
    expect(wf, 'ci-tests.yml must set DISABLE_WATCH for the test server').toMatch(/DISABLE_WATCH:\s*['"]true['"]/);
  });
});
