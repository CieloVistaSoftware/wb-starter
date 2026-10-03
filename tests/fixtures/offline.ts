/**
 * OFFLINE TEST FIXTURE -- the tests never touch the internet
 * ==========================================================
 * The site loads its third-party dependencies from CDNs and its sample media
 * from remote hosts, in development exactly as in production. The page code
 * under test is byte-for-byte what ships. What changes in a test is only the
 * NETWORK: every browser context gets a `**\/*` route that answers
 *
 *   - localhost / 127.0.0.1           -> route.fallback() (the real test server,
 *                                        and any page.route() a spec adds);
 *   - a URL in the offline cache      -> the recorded CDN response, unmodified
 *                                        (tests/fixtures/offline/manifest.json,
 *                                        rebuilt by scripts/record-offline-cache.mjs);
 *   - a remote sample-media URL       -> a generated stand-in
 *                                        (tests/fixtures/offline/media/, mapped by
 *                                        scripts/sample-media-catalog.mjs), with
 *                                        Range support for audio/video;
 *   - a YouTube / Vimeo embed         -> a small generated stand-in document;
 *   - anything else external          -> route.abort('blockedbyclient'), and the
 *                                        URL is recorded on the test (annotation
 *                                        "offline-blocked" + attachment).
 *
 * tests/compliance/no-external-requests.spec.ts fails on any blocked URL, so a
 * gap in the cache shows up as a named URL, never as a flaky network error.
 *
 * Usage: import { test, expect } from '<relative>/fixtures/offline' instead of
 * '@playwright/test'. Everything @playwright/test exports is re-exported.
 * A spec that makes its own context uses newOfflineContext / newOfflinePage.
 * tests/deployed/* keep importing @playwright/test: they test the live site
 * and need the real network.
 */
import { test as base, type Browser, type BrowserContext, type BrowserContextOptions, type Page, type Route, type TestInfo } from '@playwright/test';
import { readFileSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { localFor } from '../../scripts/sample-media-catalog.mjs';

export * from '@playwright/test';

const HERE = dirname(fileURLToPath(import.meta.url));
const OFFLINE_DIR = join(HERE, 'offline');
const MEDIA_DIR = join(OFFLINE_DIR, 'media');

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1', '0.0.0.0']);

/**
 * The deployed origin, when `npm run test:smoke:deployed` points
 * tests/compliance/site-smoke.spec.ts at it (SMOKE_BASE_URL). That spec is the
 * site under test in that mode, not a third party, so it goes to the real
 * network like localhost does. Without this the fixture aborted every
 * navigation (ERR_BLOCKED_BY_CLIENT) and the deploy check reported the live
 * site "broken" while it served 200. Unset in every other run, so the offline
 * guarantee is unchanged.
 */
const SITE_UNDER_TEST_ORIGIN = (() => {
  try { return process.env.SMOKE_BASE_URL ? new URL(process.env.SMOKE_BASE_URL).origin : null; } catch { return null; }
})();

/** Hosts whose URLs are sample media; answered from the generated stand-ins. */
export const SAMPLE_MEDIA_HOSTS = new Set([
  'picsum.photos', 'fastly.picsum.photos', 'i.pravatar.cc', 'placehold.co', 'images.unsplash.com',
  'ui-avatars.com', 'archive.org', 'files.freemusicarchive.org', 'soundhelix.com', 'incompetech.com',
  'w3schools.com', 'interactive-examples.mdn.mozilla.net', 'cdn.pixabay.com',
  // #1122: DEMOS-AND-DOCS section 29 names Wikimedia Commons for sample media,
  // because an example captioned 'Fishing boats at the harbour wall' has to show
  // fishing boats. localFor() maps it like every other host here; without the
  // hostname in THIS set that mapping is never consulted and the request is
  // aborted as an unexpected external call.
  'upload.wikimedia.org',
]);

type CacheEntry = { file: string; contentType: string; status: number };

const manifest: Map<string, CacheEntry> = (() => {
  const raw = JSON.parse(readFileSync(join(OFFLINE_DIR, 'manifest.json'), 'utf8')) as Record<string, CacheEntry>;
  const m = new Map<string, CacheEntry>();
  for (const [url, entry] of Object.entries(raw)) {
    m.set(url, entry);
    try { m.set(new URL(url).href, entry); } catch { /* keep the exact key only */ }
  }
  return m;
})();

const bodies = new Map<string, Buffer>();
function readCached(abs: string): Buffer {
  let b = bodies.get(abs);
  if (!b) { b = readFileSync(abs); bodies.set(abs, b); }
  return b;
}

/** The recorded CDN response for this exact URL, if any. */
export function cachedEntry(url: string): CacheEntry | undefined {
  const hit = manifest.get(url);
  if (hit) return hit;
  try {
    const u = new URL(url);
    return manifest.get(u.href) ?? manifest.get(decodeURI(u.href));
  } catch { return undefined; }
}

const MEDIA_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.webm': 'video/webm',
};

const escapeXml = (s: string) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * The stand-in for a remote sample-media URL: a catalogue file, or (for a
 * placehold.co size the catalogue does not list) an SVG drawn on the spot.
 * null when the URL is not sample media.
 */
export function sampleMediaFor(url: string, resourceType = ''): { body: Buffer; contentType: string } | null {
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  const host = u.hostname.replace(/^www\./, '');
  if (!SAMPLE_MEDIA_HOSTS.has(host)) return null;

  let rel: string | null = null;
  try { rel = localFor(url); } catch { rel = null; }

  if (!rel && host === 'placehold.co') {
    const m = /^\/(\d+)(?:x(\d+))?/.exec(u.pathname);
    if (m) {
      const w = Number(m[1]), h = Number(m[2] || m[1]);
      const text = u.searchParams.get('text') || `${w} × ${h}`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#cccccc"/><text x="50%" y="50%" fill="#969696" font-family="sans-serif" font-size="${Math.max(10, Math.round(Math.min(w, h) / 6))}" text-anchor="middle" dominant-baseline="middle">${escapeXml(text)}</text></svg>`;
      return { body: Buffer.from(svg), contentType: 'image/svg+xml' };
    }
  }
  if (!rel) {
    // A sample-media host, but a URL shape the catalogue has no rule for:
    // fall back by what the browser asked for.
    const ext = extname(u.pathname).toLowerCase();
    if (resourceType === 'media' || ['.mp3', '.ogg', '.wav', '.m4a', '.mp4', '.webm'].includes(ext)) {
      rel = ['.mp4', '.webm'].includes(ext) ? 'video/sample-clip.webm' : 'audio/sunny-arpeggio.mp3';
    } else if (resourceType === 'image' || ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      rel = 'photos/3x2-01.jpg';
    }
  }
  if (!rel) return null;
  return { body: readCached(join(MEDIA_DIR, rel)), contentType: MEDIA_TYPES[extname(rel)] || 'application/octet-stream' };
}

/**
 * Video EMBEDS (x-youtube, x-vimeo) are sample content too: the player page a
 * provider serves is not a dependency anyone can record, so the iframe gets a
 * small generated stand-in document, and a thumbnail gets a stand-in photo.
 */
export function embedStandInFor(url: string): { body: Buffer; contentType: string } | null {
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  const host = u.hostname.replace(/^(www|m)\./, '');
  let provider = '';
  let id = '';
  if ((host === 'youtube.com' || host === 'youtube-nocookie.com') && /^\/embed\//.test(u.pathname)) {
    provider = 'YouTube'; id = u.pathname.split('/')[2] || '';
  } else if (host === 'player.vimeo.com' && /^\/video\//.test(u.pathname)) {
    provider = 'Vimeo'; id = u.pathname.split('/')[2] || '';
  } else if (host === 'img.youtube.com' || host === 'i.ytimg.com') {
    return { body: readCached(join(MEDIA_DIR, 'photos/16x9-01.jpg')), contentType: 'image/jpeg' };
  } else {
    return null;
  }
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${provider} embed (test stand-in)</title></head>` +
    `<body style="margin:0;height:100vh;display:grid;place-items:center;background:#111;color:#eee;font:14px system-ui,sans-serif">` +
    `<p data-offline-embed="${provider.toLowerCase()}">${provider} video ${escapeXml(id)} -- offline test stand-in</p></body></html>`;
  return { body: Buffer.from(html), contentType: 'text/html; charset=utf-8' };
}

const CORS = { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range, accept-ranges, content-length' };

async function fulfillMedia(route: Route, body: Buffer, contentType: string): Promise<void> {
  const range = route.request().headers()['range'];
  const m = range && /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (m && (m[1] || m[2])) {
    const size = body.length;
    let start = m[1] ? Number(m[1]) : size - Number(m[2]);
    let end = m[1] && m[2] ? Number(m[2]) : size - 1;
    start = Math.max(0, start); end = Math.min(size - 1, end);
    if (start > end || start >= size) {
      await route.fulfill({ status: 416, headers: { ...CORS, 'content-range': `bytes */${size}` } });
      return;
    }
    await route.fulfill({
      status: 206,
      headers: { ...CORS, 'content-type': contentType, 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${size}` },
      body: body.subarray(start, end + 1),
    });
    return;
  }
  await route.fulfill({ status: 200, headers: { ...CORS, 'content-type': contentType, 'accept-ranges': 'bytes' }, body });
}

// ── per-test record of blocked requests ─────────────────────────────────────

const blockedByTest = new Map<string, string[]>();

function blockedListFor(info: TestInfo | null): string[] | null {
  if (!info) return null;
  let list = blockedByTest.get(info.testId);
  if (!list) { list = []; blockedByTest.set(info.testId, list); }
  return list;
}

function currentTestInfo(): TestInfo | null {
  try { return base.info(); } catch { return null; }
}

function recordBlocked(info: TestInfo | null, entry: string): void {
  const list = blockedListFor(info);
  if (!list || list.includes(entry)) return;
  list.push(entry);
  info!.annotations.push({ type: 'offline-blocked', description: entry });
}

/**
 * Route every request of `context` through the offline cache (see header).
 * Idempotent per context. `info` defaults to the running test.
 */
const routed = new WeakSet<BrowserContext>();
export async function routeOffline(context: BrowserContext, info: TestInfo | null = currentTestInfo()): Promise<void> {
  if (routed.has(context)) return;
  routed.add(context);
  await context.route('**/*', async (route) => {
    const req = route.request();
    const url = req.url();
    let u: URL;
    try { u = new URL(url); } catch { return route.fallback(); }
    if ((u.protocol !== 'http:' && u.protocol !== 'https:') || LOCAL_HOSTS.has(u.hostname)) return route.fallback();
    if (SITE_UNDER_TEST_ORIGIN && u.origin === SITE_UNDER_TEST_ORIGIN) return route.fallback();

    const entry = cachedEntry(url);
    if (entry) {
      return route.fulfill({
        status: entry.status,
        headers: { ...CORS, 'content-type': entry.contentType },
        body: readCached(join(OFFLINE_DIR, entry.file)),
      });
    }
    const media = sampleMediaFor(url, req.resourceType());
    if (media) return fulfillMedia(route, media.body, media.contentType);
    const embed = embedStandInFor(url);
    if (embed) return route.fulfill({ status: 200, headers: { ...CORS, 'content-type': embed.contentType }, body: embed.body });

    recordBlocked(info, `${req.resourceType()} ${url}`);
    return route.abort('blockedbyclient');
  });
}

/** browser.newContext(), routed offline. Use instead of browser.newContext(). */
export async function newOfflineContext(browser: Browser, options?: BrowserContextOptions): Promise<BrowserContext> {
  const context = await browser.newContext(options);
  await routeOffline(context);
  return context;
}

/**
 * browser.newPage(), routed offline. Use instead of browser.newPage(). As with
 * browser.newPage(), the page owns its context: page.close() closes both.
 */
export async function newOfflinePage(browser: Browser, options?: BrowserContextOptions): Promise<Page> {
  const context = await newOfflineContext(browser, options);
  const page = await context.newPage();
  page.on('close', () => { context.close().catch(() => {}); });
  return page;
}

type OfflineFixtures = {
  /** External requests this test's browser made that the cache did not cover (aborted). */
  offlineBlocked: string[];
};

export const test = base.extend<OfflineFixtures>({
  // Playwright requires a destructured first parameter even when no fixture is used.
  // eslint-disable-next-line no-empty-pattern
  offlineBlocked: async ({}, use, testInfo) => {
    const list = blockedListFor(testInfo)!;
    await use(list);
    if (list.length) {
      await testInfo.attach('offline-blocked-requests', { body: list.join('\n') + '\n', contentType: 'text/plain' });
    }
    blockedByTest.delete(testInfo.testId);
  },
  context: async ({ context, offlineBlocked }, use, testInfo) => {
    void offlineBlocked; // created first, so the list outlives the context
    await routeOffline(context, testInfo);
    await use(context);
  },
});
