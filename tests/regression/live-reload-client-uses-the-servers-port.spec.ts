import { test, expect } from '../fixtures/offline';
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// One static import (#1403), as in test-server-never-live-reloads.spec.ts.
import { probeFreePort } from '../../scripts/lib/free-port.mjs';

/**
 * #1333 -- the live-reload client connects to the server's own reload port.
 *
 * server.js listens for reloads on port + 1 (#518), but the client it injects
 * into directly navigated /pages/*.html hardcoded :3001. On any other port the
 * page reached nothing, or reached the main checkout's socket and reloaded for
 * the wrong tree, while logging "Live Reload connected" either way.
 *
 * Runs the real server.js on a free port and reads the page it serves.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test.describe('#1333 live reload follows the server port', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(90_000);
  let server: ChildProcess | null = null;
  let port = 0;

  test.beforeAll(async () => {
    // #1566: on Windows CI this server once never answered, and with its
    // output ignored the only evidence was "Received: 0" after a 30 s poll.
    // Its output is now kept, so an early exit or a slow boot says why. The
    // port comes from probeFreePort(), which also checks PORT + 1 (live reload),
    // like every other server a test run starts (#1472).
    port = probeFreePort();
    const child = spawn(process.execPath, ['server.js'], {
      cwd: ROOT, env: { ...process.env, PORT: String(port), WB_NO_OPEN: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    server = child;
    let out = '';
    const ready = new Promise<void>((resolve, reject) => {
      const onData = (b: Buffer) => { out += b.toString(); if (out.includes('WB Starter running at')) resolve(); };
      child.stdout!.on('data', onData);
      child.stderr!.on('data', onData);
      child.on('exit', (code) => reject(new Error(`server.js on port ${port} exited (${code}) before listening:\n${out}`)));
      setTimeout(() => reject(new Error(`server.js on port ${port} did not start within 60s:\n${out}`)), 60_000);
    });
    await ready;
  });

  test.afterAll(async () => {
    if (server && server.exitCode === null) {
      const exited = new Promise((r) => server!.once('exit', r));
      server.kill();
      await exited;
    }
  });

  test('a directly opened page connects to port + 1, never a hardcoded 3001', async () => {
    const res = await fetch(`http://localhost:${port}/pages/about.html`, { headers: { Accept: 'text/html', 'Sec-Fetch-Mode': 'navigate' } });
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html, 'the page was not the live-reload wrapper').toContain('Live Reload Client');
    expect(html, `the client must target this server's reload port ${port + 1}`).toContain(`':${port + 1}'`);
    expect(html).not.toContain(":3001'");
    expect(html, '"connected" is logged on open, not unconditionally').toMatch(/onopen\s*=\s*\(\)\s*=>\s*console\.log\('Live Reload connected/);
  });
});
