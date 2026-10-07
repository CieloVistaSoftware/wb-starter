import { test, expect } from '../fixtures/offline';
import { spawn, type ChildProcess } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * server.js keeps an idle keep-alive socket open, so a client that reuses it
 * after a pause is not reset (#1549).
 *
 * doc-viewer-links.spec.ts failed on Windows CI with ECONNRESET, never on a
 * dead link. Playwright request contexts in one worker share pooled sockets,
 * and #1570's diagnostic measured the idle time on the failing socket: 6037ms
 * and 6066ms, against Node's default keepAliveTimeout of 5000ms. The server
 * was closing the socket as the client sent its next GET on it.
 *
 * A raw socket shows it without timing luck: send one request, stay idle 7s,
 * and the default server has already closed the connection (seen at ~6s), so
 * a second request on the same socket gets nothing. server.js now sets
 * keepAliveTimeout to 65s (headersTimeout above it), so the socket is still
 * open and the second request is answered.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const IDLE_MS = 7000;

function freePort(): Promise<number> {
  return new Promise((resolve) => {
    const s = net.createServer().listen(0, () => { const p = (s.address() as net.AddressInfo).port; s.close(() => resolve(p)); });
  });
}

let server: ChildProcess | null = null;
let port = 0;

test.describe('#1549 an idle keep-alive socket is not closed under a reusing client', () => {
  test.setTimeout(90_000);

  test.beforeAll(async () => {
    port = await freePort();
    server = spawn(process.execPath, ['server.js'], {
      cwd: ROOT, env: { ...process.env, PORT: String(port), WB_NO_OPEN: '1', CI: '1' }, stdio: 'ignore',
    });
    await expect.poll(async () => {
      try { return (await fetch(`http://localhost:${port}/`)).status; } catch { return 0; }
    }, { timeout: 30_000 }).toBe(200);
  });

  test.afterAll(async () => {
    if (server && server.exitCode === null) {
      const exited = new Promise((r) => server!.once('exit', r));
      server.kill();
      await exited;
    }
  });

  test(`a second request on the same socket after ${IDLE_MS}ms idle is answered`, async () => {
    const sock = net.connect(port, '127.0.0.1');
    await new Promise<void>((resolve, reject) => { sock.once('connect', () => resolve()); sock.once('error', reject); });
    let received = '';
    let closedAfterMs: number | null = null;
    const started = Date.now();
    sock.on('data', (d) => { received += d.toString('latin1'); });
    sock.on('close', () => { closedAfterMs = Date.now() - started; });
    sock.on('error', () => { /* reported through closedAfterMs and the missing response */ });

    const request = `GET /docs/README.md HTTP/1.1\r\nHost: localhost:${port}\r\nConnection: keep-alive\r\n\r\n`;
    sock.write(request);
    await expect.poll(() => /^HTTP\/1\.1 \d{3}/.test(received), { timeout: 10_000 }).toBe(true);

    // sleep-is-the-scenario: the socket must survive IDLE_MS of idleness; the idle time is the scenario
    await new Promise((r) => setTimeout(r, IDLE_MS));
    expect(closedAfterMs, `the server closed the idle socket after ${closedAfterMs}ms`).toBeNull();

    received = '';
    sock.write(request);
    await expect.poll(() => /^HTTP\/1\.1 \d{3}/.test(received), {
      timeout: 5_000,
      message: 'the second request on the reused socket was answered',
    }).toBe(true);
    sock.destroy();
  });
});
