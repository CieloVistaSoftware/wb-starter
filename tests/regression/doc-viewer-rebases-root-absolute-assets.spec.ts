/**
 * THE DOC VIEWER MUST REBASE ROOT-ABSOLUTE PATHS ONTO THE DEPLOY BASE
 * ==================================================================
 * #1053, and the fourth face of #1047. The viewer already rebased doc resources
 * against the doc's own directory — which is correct for a relative path and
 * does nothing at all for a root-absolute one:
 *
 *     new URL('/images/x.svg', 'http://h/wb-starter/docs/')  →  http://h/images/x.svg
 *
 * `new URL()` discards the base's path entirely when the input starts with a
 * slash. That is the spec, not a bug in the browser — so `/images/x.svg` in a
 * doc landed on the ORIGIN root and 404'd for every visitor of the deployed
 * site, while resolving perfectly on `npm start`, which serves at `/`.
 *
 * Served through a prefix-stripping proxy, exactly as GitHub Pages serves it,
 * because a run at `/` cannot see this: locally the wrong path is the right one.
 *
 * The subject is a FIXTURE, deliberately. Every real doc was corrected to use
 * relative paths, so pointing this at `docs/` would leave it passing because it
 * had nothing to check — the "green by vacuity" failure this suite has already
 * been bitten by more than once.
 */

import { test, expect } from '@playwright/test';
import { createServer, request as httpRequest, type Server } from 'node:http';

const PREFIX = '/wb-starter';
const FIXTURE = 'tests/fixtures/doc-viewer-root-absolute.md';

/** Mounts `origin` under PREFIX, so the site loads exactly as it deploys. */
function mountUnderSubPath(origin: string): Promise<{ base: string; close: () => Promise<void> }> {
  const upstream = new URL(origin);
  const proxy: Server = createServer((req, res) => {
    const path = req.url || '/';
    if (!path.startsWith(PREFIX)) {
      // Anything asked for at the ORIGIN root is off-site as far as the deployed
      // app is concerned — which is the failure being caught. 404, same as
      // github.io does.
      res.writeHead(404).end('not found');
      return;
    }
    const up = httpRequest(
      {
        hostname: upstream.hostname,
        port: upstream.port,
        path: path.slice(PREFIX.length) || '/',
        method: req.method,
        headers: { ...req.headers, host: upstream.host },
      },
      (upRes) => { res.writeHead(upRes.statusCode || 502, upRes.headers); upRes.pipe(res); },
    );
    up.on('error', () => res.writeHead(502).end('upstream error'));
    req.pipe(up);
  });

  return new Promise((resolve) => {
    proxy.listen(0, '127.0.0.1', () => {
      const { port } = proxy.address() as { port: number };
      resolve({
        base: `http://127.0.0.1:${port}${PREFIX}/`,
        close: () => new Promise<void>((done) => proxy.close(() => done())),
      });
    });
  });
}

test('the doc viewer resolves root-absolute doc assets under the deploy base', async ({ page, baseURL }) => {
  test.slow();
  const mount = await mountUnderSubPath(baseURL!);

  const notFound: string[] = [];
  page.on('response', (r) => { if (r.status() === 404 && !/favicon/i.test(r.url())) notFound.push(r.url()); });

  try {
    await page.goto(`${mount.base}public/doc-viewer.html?file=${encodeURIComponent(FIXTURE)}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForSelector('#content img', { timeout: 20_000 });
    await page.waitForTimeout(500);

    // Read the RESOLVED urls the browser will actually request.
    const resolved = await page.evaluate(() => {
      const out: string[] = [];
      document.querySelectorAll('#content img[src], #content video[src], #content video[poster], #content a[href]')
        .forEach((el) => {
          for (const attr of ['src', 'poster', 'href']) {
            const v = (el as Element).getAttribute(attr);
            if (v) out.push(v);
          }
        });
      return out;
    });

    expect(
      resolved.length,
      'The fixture rendered nothing — it is the only thing this test checks, so an empty ' +
      'result means the test is passing on air rather than on the viewer.',
    ).toBeGreaterThan(2);

    const offOrigin = resolved.filter((u) => {
      const path = u.startsWith('http') ? new URL(u).pathname : u;
      return path.startsWith('/') && !path.startsWith(`${PREFIX}/`);
    });

    expect(
      offOrigin,
      'These resolved against the ORIGIN root rather than the deployed sub-path, so they\n' +
      '404 for every visitor while looking correct on localhost. `new URL(path, base)`\n' +
      'throws the base away when path starts with "/" — strip the slash and resolve\n' +
      'against SITE_ROOT instead.',
    ).toEqual([]);

    expect([...new Set(notFound)], 'Requests that 404 when the site is served under /wb-starter/.').toEqual([]);
  } finally {
    await mount.close();
  }
});
