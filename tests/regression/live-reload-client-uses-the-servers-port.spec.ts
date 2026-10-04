import { test, expect } from '../fixtures/offline';
import { spawn, type ChildProcess } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

function freePort(): Promise<number> {
  return new Promise((resolve) => {
    const s = net.createServer().listen(0, () => { const p = (s.address() as net.AddressInfo).port; s.close(() => resolve(p)); });
  });
}

test.describe('#1333 live reload follows the server port', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(90_000);
  let server: ChildProcess | null = null;
  let port = 0;

  test.beforeAll(async () => {
    port = await freePort();
    server = spawn(process.execPath, ['server.js'], {
      cwd: ROOT, env: { ...process.env, PORT: String(port), WB_NO_OPEN: '1' }, stdio: 'ignore',
    });
    await expect.poll(async () => { try { return (await fetch(`http://localhost:${port}/`)).status; } catch { return 0; } }, { timeout: 30_000 }).toBe(200);
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
