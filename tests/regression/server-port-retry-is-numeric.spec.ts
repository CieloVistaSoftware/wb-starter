import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * #1286. server.js moves to the next port when its own is taken. When the
 * port came from the PORT environment variable it was still a STRING, so the
 * retry's `p + 1` concatenated: '59175' + 1 became '591751', and listen()
 * threw ERR_SOCKET_BAD_PORT. Two parallel single-spec runs hit exactly that,
 * the second server died on start, and Playwright reported "Total: 0 tests".
 *
 * Run, not read (#1049): start one real server, start a second on the SAME
 * port through the environment, and require the second to move on to a real
 * numeric port and come up.
 */

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const p = (s.address() as net.AddressInfo).port;
      s.close(() => resolve(p));
    });
    s.on('error', reject);
  });
}

function start(port: number) {
  const env: NodeJS.ProcessEnv = { ...process.env, PORT: String(port), DISABLE_WATCH: 'true' };
  delete env.CI;
  const proc = spawn(process.execPath, ['server.js'], { cwd: REPO, env });
  let output = '';
  proc.stdout?.on('data', (buf: Buffer) => { output += buf.toString(); });
  proc.stderr?.on('data', (buf: Buffer) => { output += buf.toString(); });
  // `listening`: the first "running at" line, enough to know a server holds its port.
  const listening = new Promise<string>((resolve, reject) => {
    const poll = setInterval(() => { if (/WB Starter running at/.test(output)) { clearInterval(poll); resolve(output); } }, 50);
    proc.on('exit', () => { clearInterval(poll); resolve(output); });
    proc.on('error', reject);
    setTimeout(() => { clearInterval(poll); reject(new Error(`server.js never listened in 20s. Output so far:\n${output}`)); }, 20_000);
  });
  // `settled`: everything the server printed until it exited or 6s passed. A server
  // that has to move ports prints its "running at" line for the port it first tried
  // BEFORE the retry runs, so reading at the first such line misses the retry.
  const settled = new Promise<string>((resolve) => {
    proc.on('exit', () => resolve(output));
    setTimeout(() => resolve(output), 6_000);
  });
  return { proc, listening, settled };
}

test.describe('#1286 -- server.js port retry does arithmetic, not string concatenation', () => {
  test('a second server on a taken PORT moves to a real numeric port and starts', async () => {
    const taken = await freePort();
    const first = start(taken);
    let second: ReturnType<typeof start> | undefined;
    try {
      // Start the second server only once the first HOLDS the port. Starting both
      // at once raced: either could be the one that got retried, and the test
      // read the wrong server's output.
      await first.listening;
      second = start(taken);
      const out = await second.settled;

      expect(out, 'the retry crashed with a malformed port').not.toContain('ERR_SOCKET_BAD_PORT');

      const tried = [...out.matchAll(/trying :(\S+)/g)].map((m) => m[1]);
      expect(tried.length, 'the second server was never told its port was busy, so the test proved nothing').toBeGreaterThan(0);
      for (const t of tried) {
        expect(t, `retry port "${t}" is not a plain number`).toMatch(/^\d+$/);
        expect(Number(t), `retry port ${t} is not a valid port`).toBeLessThan(65536);
        expect(Number(t), 'a retry must go UP by one, never jump').toBeGreaterThan(taken);
      }

      const ups = [...out.matchAll(/WB Starter running at http:\/\/localhost:(\d+)/g)].map((m) => Number(m[1]));
      expect(ups.length, 'the second server never came up after moving ports').toBeGreaterThan(0);
      expect(ups[ups.length - 1], 'the last port it reported must be a different one from the port already taken').toBeGreaterThan(taken);
    } finally {
      first.proc.kill();
      second?.proc.kill();
    }
  });
});
