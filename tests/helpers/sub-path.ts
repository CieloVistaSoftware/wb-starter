/**
 * Serve the running site under /wb-starter/, exactly as GitHub Pages deploys it.
 * Anything requested at the origin root is off-site for the deployed app and
 * gets the 404 github.io gives. Shared by the specs that prove assets resolve
 * on the deployed sub-path (#1047, #1183).
 */
import { createServer, request as httpRequest, type Server } from 'node:http';
import type { Page } from '@playwright/test';

export const PREFIX = '/wb-starter';

/** Mounts `origin` under PREFIX, so the site loads exactly as it deploys. */
export function mountUnderSubPath(origin: string): Promise<{ base: string; close: (page?: Page) => Promise<void> }> {
  const upstream = new URL(origin);
  const proxy: Server = createServer((req, res) => {
    const path = req.url || '/';
    if (!path.startsWith(PREFIX)) {
      // Anything asked for at the ORIGIN root is off-site as far as the
      // deployed app is concerned — which is precisely the failure being
      // caught. Answer honestly: 404, same as github.io does.
      res.writeHead(404).end('not found');
      return;
    }
    const forwarded = path.slice(PREFIX.length) || '/';
    const up = httpRequest(
      {
        hostname: upstream.hostname,
        port: upstream.port,
        path: forwarded,
        method: req.method,
        headers: { ...req.headers, host: upstream.host },
      },
      (upRes) => {
        res.writeHead(upRes.statusCode || 502, upRes.headers);
        upRes.pipe(res);
      },
    );
    up.on('error', () => res.writeHead(502).end('upstream error'));
    req.pipe(up);
  });

  return new Promise((resolve) => {
    proxy.listen(0, '127.0.0.1', () => {
      const { port } = proxy.address() as { port: number };
      resolve({
        base: `http://127.0.0.1:${port}${PREFIX}/`,
        // #961: pass the page that loaded through the proxy. It is navigated
        // away first, so nothing it is still fetching (a lazy module, a retry)
        // is refused by a closed proxy and logged to data/errors.json as a page
        // error -- which error-log-empty then reports against an unrelated spec.
        close: async (page?: Page) => {
          if (page) await page.goto('about:blank').catch(() => {});
          await new Promise<void>((done) => proxy.close(() => done()));
        },
      });
    });
  });
}
