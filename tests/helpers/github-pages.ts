/**
 * Serve this checkout exactly as GitHub Pages serves the live site.
 *
 * https://cielovistasoftware.github.io/wb-starter/ is static hosting: files from
 * the repo, under /wb-starter/, and nothing else. No server.js, so no API, no
 * auto-wrapping of pages/*.html, and a POST is refused with 405. The sub-path
 * proxy in ./sub-path.ts keeps the real dev server behind the prefix, which is
 * right for "does this asset resolve" and wrong for "does the page work with no
 * server at all"; this helper is the second kind.
 *
 * The browser really is on the live origin (page.route answers it from disk), so
 * location.hostname is cielovistasoftware.github.io and code that asks "am I on
 * the development origin" gets the live answer. Nothing reaches the internet.
 *
 * A spec using it must block the service worker (#1349):
 *   test.use({ serviceWorkers: 'block' });
 */
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';

export const PAGES_ORIGIN = 'https://cielovistasoftware.github.io';
export const PAGES_ROOT = `${PAGES_ORIGIN}/wb-starter/`;

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

async function isFile(path: string): Promise<boolean> {
  try { return (await stat(path)).isFile(); } catch { return false; }
}

async function isDir(path: string): Promise<boolean> {
  try { return (await stat(path)).isDirectory(); } catch { return false; }
}

/**
 * Answer every request to the live origin the way GitHub Pages would, from this
 * checkout's files. Returns the URLs the page asked the live origin for, so a
 * spec can assert on them.
 */
export async function serveAsGitHubPages(page: Page): Promise<{ requests: { method: string; url: string; status: number }[] }> {
  const requests: { method: string; url: string; status: number }[] = [];
  const notFoundPage = await readFile(join(REPO_ROOT, '404.html')).catch(() => Buffer.from('Not Found'));

  // The live site counts each boot with a hosted counter (#1245, visitor-count.js).
  // Answered here with a fixed total, so no run reaches it or adds to it.
  await page.route('https://abacus.jasoncameron.dev/**', (route) => route.fulfill({
    status: 200,
    headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
    body: '{"value":1}',
  }));

  await page.route(`${PAGES_ORIGIN}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const answer = async (status: number, body: Buffer | string, headers: Record<string, string> = {}) => {
      requests.push({ method: req.method(), url: req.url(), status });
      await route.fulfill({ status, body, headers }).catch(() => { /* the page went away first */ });
    };

    if (req.method() !== 'GET' && req.method() !== 'HEAD') {
      await answer(405, 'Method Not Allowed', { 'content-type': 'text/html' });
      return;
    }
    if (!url.pathname.startsWith('/wb-starter/') && url.pathname !== '/wb-starter') {
      await answer(404, notFoundPage, { 'content-type': TYPES['.html'] });
      return;
    }

    const rel = decodeURIComponent(url.pathname.slice('/wb-starter'.length)) || '/';
    const local = normalize(join(REPO_ROOT, rel));
    if (!local.startsWith(normalize(REPO_ROOT)) || rel.split('/').some((part) => part.startsWith('.') && part.length > 1)) {
      await answer(404, notFoundPage, { 'content-type': TYPES['.html'] });
      return;
    }

    let file = local;
    if (await isDir(local)) {
      if (!url.pathname.endsWith('/')) {
        // Pages redirects a directory without its slash to the slashed form.
        await answer(301, '', { location: `${url.pathname}/${url.search}` });
        return;
      }
      file = join(local, 'index.html');
    } else if (local.endsWith(sep)) {
      file = join(local, 'index.html');
    }

    if (!(await isFile(file))) {
      await answer(404, notFoundPage, { 'content-type': TYPES['.html'] });
      return;
    }
    const type = TYPES[extname(file).toLowerCase()] || 'application/octet-stream';
    await answer(200, await readFile(file), { 'content-type': type });
  });

  return { requests };
}
