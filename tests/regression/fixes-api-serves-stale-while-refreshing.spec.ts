import { test, expect } from '../fixtures/offline';
import { spawn, execFileSync, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * #1054 -- /api/fixes never makes a visitor wait for a recompute it can avoid.
 *
 * The cache is keyed on HEAD, and every push to main moves HEAD, so the first
 * visit after any merge paid the full cold computation (27 s, 5 MB measured on
 * 2026-10-04) with the Fix Viewer blank meanwhile. Now a stale cache is served
 * at once and refreshed in the background.
 *
 * Runs the real server.js against a seeded data/fixes-cache.json. It does not
 * depend on `gh` being logged in (CI may not be): it asserts what the route
 * serves and how fast, not what a refresh later computes.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CACHE = path.join(ROOT, 'data', 'fixes-cache.json');
const SEEDED = { generatedAt: '2026-01-01T00:00:00.000Z', counts: { traced: 1 }, releases: [], rows: [{ number: 1, title: 'seeded row' }] };

function freePort(): Promise<number> {
  return new Promise((resolve) => {
    const s = net.createServer().listen(0, () => { const p = (s.address() as net.AddressInfo).port; s.close(() => resolve(p)); });
  });
}

let server: ChildProcess | null = null;
let base = '';
let saved: string | null = null;

test.describe('#1054 /api/fixes is stale-while-revalidate', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(90_000);

  test.beforeAll(async () => {
    saved = fs.existsSync(CACHE) ? fs.readFileSync(CACHE, 'utf8') : null;
    const port = await freePort();
    base = `http://localhost:${port}`;
    server = spawn(process.execPath, ['server.js'], {
      cwd: ROOT, env: { ...process.env, PORT: String(port), WB_NO_OPEN: '1', CI: '1' }, stdio: 'ignore',
    });
    await expect.poll(async () => { try { return (await fetch(base + '/')).status; } catch { return 0; } }, { timeout: 30_000 }).toBe(200);
  });

  test.afterAll(async () => {
    if (server && server.exitCode === null) {
      const exited = new Promise((r) => server!.once('exit', r));
      server.kill();
      await exited;
    }
    if (saved === null) fs.rmSync(CACHE, { force: true }); else fs.writeFileSync(CACHE, saved);
  });

  test('a stale cache (HEAD moved) is served at once, marked stale', async () => {
    fs.writeFileSync(CACHE, JSON.stringify({ head: 'stale00000000', cachedAt: new Date().toISOString(), payload: SEEDED }));
    const started = Date.now();
    const res = await fetch(base + '/api/fixes');
    const elapsed = Date.now() - started;
    expect(res.headers.get('x-fixes-cache'), 'a stale cache must be served, not recomputed while the visitor waits').toBe('stale');
    expect((await res.json()).rows[0].title).toBe('seeded row');
    expect(elapsed, `served in ${elapsed} ms; the cold computation takes tens of seconds`).toBeLessThan(3000);

    // A second visitor right behind does not wait either (one refresh at a time,
    // in the background).
    const t2 = Date.now();
    const res2 = await fetch(base + '/api/fixes');
    expect(['stale', 'hit']).toContain(res2.headers.get('x-fixes-cache'));
    expect(Date.now() - t2).toBeLessThan(3000);
  });

  test('a fresh cache (current HEAD, inside the TTL) is a hit', async () => {
    const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
    fs.writeFileSync(CACHE, JSON.stringify({ head, cachedAt: new Date().toISOString(), payload: SEEDED }));
    const res = await fetch(base + '/api/fixes');
    expect(res.headers.get('x-fixes-cache')).toBe('hit');
    expect((await res.json()).rows[0].title).toBe('seeded row');
  });
});
