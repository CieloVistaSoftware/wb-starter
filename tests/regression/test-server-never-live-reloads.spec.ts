import { test, expect } from '../fixtures/offline';
import { spawn } from 'node:child_process';
// One static import (#1403): parallel workers writing the transform cache for
// a dynamic import failed with EPERM on Windows CI.
import { probeFreePort } from '../../scripts/lib/free-port.mjs';

/**
 * #1311: in a full local run, pages/home.html's padding check died with
 * "Execution context was destroyed" -- and passed alone. A page served on its
 * own (/pages/*.html) carries server.js's live-reload client, and the test
 * server watched the tree like a dev server. Tests write files the reload
 * filter does not ignore (the #1131 stamp test writes .local/), the server
 * broadcast "reload", and a page mid-measurement in another worker reloaded.
 *
 * A test server (WB_TEST_SERVER=1, which playwright.config sets for every
 * server a run starts) serves a fixed tree: it must not watch at all. CI was
 * already safe (DISABLE_WATCH), which is why this only ever failed locally --
 * so the server here is started with CI and DISABLE_WATCH cleared.
 */
test('a test server does not watch the tree for live reload (#1311)', async () => {
  test.setTimeout(60_000);
  const port = probeFreePort();
  const env: NodeJS.ProcessEnv = { ...process.env, PORT: String(port), WB_TEST_SERVER: '1' };
  delete env.CI;
  delete env.DISABLE_WATCH;

  const child = spawn(process.execPath, ['server.js'], { cwd: process.cwd(), env, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  const ready = new Promise<void>((resolve, reject) => {
    const onData = (b: Buffer) => { out += b.toString(); if (out.includes('WB Starter running at')) resolve(); };
    child.stdout!.on('data', onData);
    child.stderr!.on('data', onData);
    child.on('exit', (code) => reject(new Error(`server exited (${code}) before listening:\n${out}`)));
    setTimeout(() => reject(new Error(`server did not start within 45s:\n${out}`)), 45_000);
  });
  try {
    await ready;
  } finally {
    child.kill();
  }

  const watchLines = out.split(/\r?\n/).filter((l) => l.startsWith('[Watch]'));
  expect(watchLines.length, `the server said nothing about watching:\n${out}`).toBeGreaterThan(0);
  expect(watchLines.every((l) => l.includes('skipping fs.watch')),
    `a test server set up live-reload watching:\n${watchLines.join('\n')}`).toBe(true);
});
