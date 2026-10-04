import { test, expect } from '../fixtures/offline';
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * #1135 -- a server told which port to use never quietly moves to another.
 *
 * server.js fell through to port+1 when its port was busy, even when PORT was
 * set explicitly. The caller (Playwright's webServer, test-async, a person)
 * was still waiting on the port it asked for -- and on a busy machine that
 * port belonged to ANOTHER worktree's server, so a whole suite could run
 * against the wrong tree. Now an explicit busy port is a hard error naming it.
 *
 * Runs the real server.js as a child process; nothing is mocked.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function freePort(): Promise<number> {
  return new Promise((resolve) => {
    const s = net.createServer().listen(0, () => {
      const p = (s.address() as net.AddressInfo).port;
      s.close(() => resolve(p));
    });
  });
}

function startServer(port: number) {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), WB_NO_OPEN: '1', CI: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { out += d; });
  const exited = new Promise<number | null>((resolve) => child.on('exit', (code) => resolve(code)));
  return { child, exited, output: () => out };
}

test.describe('#1135 an explicitly requested port is honoured or refused, never swapped', () => {
  test.setTimeout(60_000);

  test('PORT set to a busy port: exits 1, names the port, never listens elsewhere', async () => {
    // Hold the port on BOTH stacks. On Windows an IPv4 and an IPv6 listener can
    // share a port number, so a holder on one stack left express free to bind the
    // other: the first draft's "busy" port was not busy, and the test proved
    // nothing either way (main's server simply started on it).
    const v4 = net.createServer();
    const port = await new Promise<number>((resolve) => v4.listen(0, '0.0.0.0', () => resolve((v4.address() as net.AddressInfo).port)));
    const v6 = net.createServer();
    await new Promise<void>((resolve) => { v6.once('error', () => resolve()); v6.listen(port, '::', () => resolve()); });
    const holder = { close: () => { v4.close(); try { v6.close(); } catch { /* never bound */ } } };
    try {
      const srv = startServer(port);
      const code = await Promise.race([srv.exited, new Promise<string>((r) => setTimeout(() => r('timeout'), 30_000))]);
      if (code === 'timeout') srv.child.kill();
      expect(code, `the server must exit, not keep running.\n${srv.output()}`).toBe(1);
      expect(srv.output()).toContain(`:${port} is already in use`);
      // Not asserted: the absence of "WB Starter running at". On Windows the bind
      // can report listening a moment before EADDRINUSE arrives for the same
      // port (probe, 2026-10-03: both lines, then exit 1). What matters is that
      // it never moves to ANOTHER port and that it exits.
      expect(srv.output(), 'it must not try another port').not.toMatch(/trying :\S+/);
      // #1286, carried from server-port-retry-is-numeric.spec.ts (removed): the env
      // PORT is a string, and the retry's `p + 1` once concatenated it ('59175' + 1
      // -> '591751', ERR_SOCKET_BAD_PORT). An explicit PORT no longer retries at
      // all, so that path is gone -- this holds that it stays gone.
      expect(srv.output(), 'no malformed-port crash (#1286)').not.toContain('ERR_SOCKET_BAD_PORT');
      expect(srv.output(), 'and must not end up serving one').not.toMatch(new RegExp(`running at http://localhost:(?!${port}\\b)\\d+`));
    } finally {
      holder.close();
    }
  });

  test('PORT set to a free port: listens on exactly that port', async () => {
    const port = await freePort();
    const srv = startServer(port);
    try {
      await expect.poll(() => srv.output(), { timeout: 30_000, message: 'server never reported listening' })
        .toContain(`WB Starter running at http://localhost:${port}`);
    } finally {
      srv.child.kill();
      await srv.exited;
    }
  });
});
