import { test, expect } from '../fixtures/offline';
import { execFileSync, spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import http from 'http';
import net from 'net';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * `npm create wb-starter` makes a website that USES wb-starter (#813, #771).
 *
 * John, 2026-09-29: "I want a cli that allows me to create a website which uses
 * wb-starter", with wb-starter as an npm dependency. The scaffolder used to copy
 * the whole repo (45 MB of demos, docs, tests and release tooling) -- a fork of
 * the framework, not a site built on it.
 *
 * This walks the path a person takes, end to end: create the site, npm install
 * (wb-starter from THIS checkout), npm start, look at it in a browser, npm run
 * build, and serve dist/ from a plain static server the way a host would.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CREATE = path.join(ROOT, 'packages', 'create-wb-starter', 'bin', 'create-wb-starter.js');
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';

test.describe.configure({ mode: 'serial', timeout: 120_000 });

let work: string;
let site: string;
let server: ChildProcess | null = null;
let staticServer: http.Server | null = null;

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', reject);
    srv.listen(0, () => { const port = (srv.address() as net.AddressInfo).port; srv.close(() => resolve(port)); });
  });
}

/** Resolves once the server answers -- a readiness signal, not a sleep. */
async function answering(url: string): Promise<void> {
  await expect.poll(async () => {
    try { return (await fetch(url)).status; } catch { return 0; }
  }, { timeout: 30_000, message: `${url} never answered` }).toBe(200);
}

test.beforeAll(() => {
  work = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-create-'));
  execFileSync(process.execPath, [CREATE, 'my-site', '--wb-starter', ROOT], { cwd: work, stdio: 'pipe' });
  site = path.join(work, 'my-site');
  execFileSync(NPM, ['install', '--no-audit', '--no-fund', '--ignore-scripts'], { cwd: site, stdio: 'pipe', shell: process.platform === 'win32' });
});

test.afterAll(async () => {
  // Wait for the server to EXIT before deleting its folder: on Windows a
  // running process keeps its working directory locked (EBUSY, seen on CI).
  if (server && server.exitCode === null) {
    const exited = new Promise((resolve) => server!.once('exit', resolve));
    server.kill();
    await exited;
  }
  await new Promise((resolve) => (staticServer ? staticServer.close(resolve) : resolve(null)));
  fs.rmSync(work, { recursive: true, force: true });
});

test('the new site holds only its own files, and depends on wb-starter', () => {
  const files = fs.readdirSync(site).filter((f) => f !== 'node_modules' && f !== 'package-lock.json').sort();
  expect(files).toEqual(['.gitignore', 'README.md', 'config', 'index.html', 'package.json', 'pages', 'styles']);
  const pkg = JSON.parse(fs.readFileSync(path.join(site, 'package.json'), 'utf8'));
  expect(pkg.name).toBe('my-site');
  expect(pkg.private, 'without private a stray npm publish puts the site on the registry (#771)').toBe(true);
  expect(Object.keys(pkg.dependencies)).toEqual(['wb-starter']);
  expect(pkg.scripts).toEqual({ start: 'wb-starter serve', build: 'wb-starter build' });
  // Every placeholder was filled.
  for (const f of ['index.html', 'config/site.json', 'pages/home.html', 'README.md', 'package.json']) {
    expect(fs.readFileSync(path.join(site, f), 'utf8'), f).not.toMatch(/__[A-Z_]+__/);
  }
});

test('npm start (wb-starter serve) serves the site on the wb-starter runtime', async ({ page }) => {
  const port = await freePort();
  // What `npm start` runs (the script is asserted above), started with node
  // directly: through npm and a shell, kill() stops only the wrapper and the
  // server outlives the test on Windows.
  const bin = path.join(site, 'node_modules', 'wb-starter', 'scripts', 'wb-starter.mjs');
  server = spawn(process.execPath, [bin, 'serve'], { cwd: site, env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
  const base = `http://localhost:${port}/`;
  await answering(base);

  const missing: string[] = [];
  page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(base)) missing.push(`${r.status()} ${r.url()}`); });
  await page.goto(base);
  await expect(page.locator('#home-hero h1')).toHaveText('My Site');
  await expect(page).toHaveTitle('My Site');
  await expect(page.locator('#siteNav')).toContainText('Home');
  await expect(page.locator('#siteNav')).toContainText('About');
  // A behavior ran: x-ripple is wb-starter's code, served from the package.
  await expect(page.locator('#home-try-button')).toHaveClass(/x-ripple/);
  // wb-starter's own developer tools are not on a site built with it.
  await expect(page.locator('#headerVersion, #playgroundLink, #notesToggle, #siteNotes')).toHaveCount(0);

  await page.goto(base + '?page=about');
  await expect(page.locator('#about-hero h1')).toHaveText('About');
  expect(missing, 'files the site asked for and did not get').toEqual([]);

  // The site's pages are its own: wb-starter's are not served in their place.
  expect((await fetch(base + 'pages/behaviors.html')).status).toBe(404);
});

test('npm run build writes a static site that works without wb-starter running', async ({ page }) => {
  execFileSync(NPM, ['run', 'build'], { cwd: site, stdio: 'pipe', shell: process.platform === 'win32' });
  const dist = path.join(site, 'dist');
  // A plain static server, as a host would be: dist/ and nothing else.
  const port = await freePort();
  staticServer = http.createServer((req, res) => {
    const rel = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '') || 'index.html';
    const file = path.join(dist, rel);
    if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
    const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream';
    res.writeHead(200, { 'content-type': type });
    fs.createReadStream(file).pipe(res);
  }).listen(port);
  const base = `http://localhost:${port}/`;
  await answering(base);

  await page.goto(base + '?page=about');
  await expect(page.locator('#about-hero h1')).toHaveText('About');
  await expect(page.locator('#siteNav')).toContainText('Home');
  expect(fs.existsSync(path.join(dist, '.nojekyll')), 'GitHub Pages would drop _-prefixed files').toBe(true);
});

test('both packages stay small enough to install', () => {
  const size = (dir: string) => {
    const out = execFileSync(NPM, ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], shell: process.platform === 'win32' });
    // The repo's prepare hook prints a line before npm's JSON.
    const [info] = JSON.parse(out.slice(out.indexOf('[')));
    return info.size as number;
  };
  // Was 44.8 MB: the scaffolder shipped a copy of the whole repo (#771).
  expect(size(path.join(ROOT, 'packages', 'create-wb-starter'))).toBeLessThan(100 * 1024);
  // The runtime only: src/, assets/, the behavior docs and the data it fetches.
  expect(size(ROOT)).toBeLessThan(2 * 1024 * 1024);
});
