import { test, expect } from '../fixtures/offline';
import { spawn, type ChildProcess } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

/**
 * #1334 -- the live-reload port explains itself to a browser.
 *
 * John opened localhost:3001 and got a bare "Upgrade Required": correct (it is
 * a WebSocket, and a plain request is a 426) and useless -- it did not say what
 * answered, what the port is for, or where the site is. Now it does, and the
 * socket still works for the page that actually needs it.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const isFree = (p: number) => new Promise<boolean>((resolve) => {
  const s = net.createServer().once('error', () => resolve(false)).listen(p, () => s.close(() => resolve(true)));
});
async function freePair(): Promise<number> {
  for (let i = 0; i < 50; i++) {
    const p = 20000 + Math.floor(Math.random() * 20000);
    if (await isFree(p) && await isFree(p + 1)) return p;
  }
  throw new Error('no free port pair');
}

test.describe('#1334 the reload port says what it is', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(90_000);
  let server: ChildProcess | null = null;
  let port = 0;

  test.beforeAll(async () => {
    port = await freePair();
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

  test('a plain request is told what the port is and where the site is', async () => {
    const res = await fetch(`http://localhost:${port + 1}/`);
    expect(res.status, 'still a WebSocket refusing a non-handshake').toBe(426);
    const text = await res.text();
    expect(text).toContain('live-reload WebSocket');
    expect(text, 'names the site it belongs to').toContain(`http://localhost:${port}`);
  });

  test('the live-reload socket still accepts a WebSocket', async () => {
    const opened = await new Promise<boolean>((resolve) => {
      const ws = new WebSocket(`ws://localhost:${port + 1}`);
      ws.once('open', () => { ws.close(); resolve(true); });
      ws.once('error', () => resolve(false));
      setTimeout(() => resolve(false), 10_000);
    });
    expect(opened).toBe(true);
  });
});
