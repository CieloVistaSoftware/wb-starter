import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * All-demos smoke test.
 *
 * Loads every real demo in demos/ in a real browser (so lazy-loaded behaviors
 * actually fire) and flags:
 *   - uncaught JS exceptions (pageerror)
 *   - console.error output
 *   - broken SAME-ORIGIN requests (a missing local asset/module) — external
 *     CDN/image/audio failures are ignored (not the demo's fault)
 *   - pages that render no meaningful content
 *
 * One test per demo so failures name the exact file.
 */

const DEMOS_DIR = path.join(process.cwd(), 'demos');

// Match the SKIP list used by scripts/generate-demos-list.mjs / demos-list-complete.
const SKIP = /(^|[-.])(debug|test|test-harness|harness|check|scratch)([-.]|$)/i;

function demoFiles(): string[] {
  return fs
    .readdirSync(DEMOS_DIR)
    .filter((n) => n.endsWith('.html') && !SKIP.test(n.replace(/\.html$/i, '')))
    .sort();
}

// Console warnings that are known-benign noise, not demo defects.
const BENIGN = [
  /cdn\.tailwindcss\.com should not be used in production/i,
  /Download the .* DevTools/i,
  // Resource load failures are tracked precisely (same-origin only) via the
  // response + requestfailed handlers below; external CDN/image/audio flakiness
  // should not fail a demo. So drop the generic console noise for it.
  /Failed to load resource/i,
];

for (const file of demoFiles()) {
  test(`demo loads clean: ${file}`, async ({ page, baseURL }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const badRequests: string[] = [];

    // The dev server's origin, taken from the run rather than hardcoded. Both
    // filters below used to test `url.includes('localhost:3000')`, which held
    // only while the suite happened to own port 3000. playwright.config.ts now
    // asks the OS for a free port, so that string matched nothing and this
    // smoke test silently stopped reporting ANY bad request -- passing because
    // it checked nothing, which is worse than failing.
    const origin = baseURL ? new URL(baseURL).origin : '';
    const sameOrigin = (url: string) => Boolean(origin) && url.startsWith(origin);

    page.on('pageerror', (e) => pageErrors.push(e.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const t = msg.text();
        if (!BENIGN.some((re) => re.test(t))) consoleErrors.push(t);
      }
    });
    page.on('response', (res) => {
      const url = res.url();
      // Only same-origin (dev server) assets — external CDNs/images/audio are ignored.
      if (sameOrigin(url) && res.status() >= 400) {
        badRequests.push(`${res.status()} ${url.replace(origin, '')}`);
      }
    });
    page.on('requestfailed', (req) => {
      const url = req.url();
      // Same-origin requests that never get a response (ERR_CONNECTION_CLOSED,
      // aborted module fetch, etc.). External resource flakiness is ignored.
      if (!sameOrigin(url)) return;
      // #1116: a ranged MEDIA fetch that the browser cancels once it has
      // buffered enough reports net::ERR_ABORTED while the element sits at
      // readyState 4 with error null. Measured on autoinject.html: 4 players,
      // 4 requests, every one 206 Partial Content -> ERR_ABORTED, every element
      // fully loaded. That is normal playback behaviour, not a broken resource.
      //
      // Deliberately narrow -- media AND that exact error. A media 404 still
      // fails (it arrives through the response listener above), and any other
      // aborted same-origin request still fails. "Ignore aborted media" must
      // not drift into "ignore media", which is how #514/#763 produced checks
      // that had quietly stopped looking.
      if (req.resourceType() === 'media' && req.failure()?.errorText === 'net::ERR_ABORTED') return;
      badRequests.push(`FAILED ${req.failure()?.errorText ?? ''} ${url.replace(origin, '')}`.trim());
    });

    await page.goto(`/demos/${file}`, { waitUntil: 'domcontentloaded' });
    // Give WB.init() + the lazy-load IntersectionObserver time to activate behaviors.
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);

    const bodyText = (await page.locator('body').innerText().catch(() => '')).trim();

    // Findings surfaced in the assertion messages so the report names them.
    expect(pageErrors, `uncaught JS error(s) in ${file}:\n  ${pageErrors.join('\n  ')}`).toEqual([]);
    expect(badRequests, `broken same-origin request(s) in ${file}:\n  ${[...new Set(badRequests)].join('\n  ')}`).toEqual([]);
    expect(consoleErrors, `console.error(s) in ${file}:\n  ${[...new Set(consoleErrors)].join('\n  ')}`).toEqual([]);
    expect(bodyText.length, `${file} rendered no meaningful content (body text length ${bodyText.length})`).toBeGreaterThan(30);
  });
}

/**
 * #1116 guard: the media-abort exemption above must stay narrow.
 *
 * Exempting `net::ERR_ABORTED` on media requests is correct -- the browser
 * cancels a ranged media fetch once it has buffered enough. But an exemption
 * that widens into "ignore media" turns this gate into a test that passes
 * because it stopped looking, which is exactly what #514 and #763 were.
 *
 * These assert the exemption's edges rather than its happy path.
 */
test.describe('#1116: the media-abort exemption does not widen', () => {
  test('a media file that 404s is still reported', async ({ page, baseURL }) => {
    const bad: string[] = [];
    const origin = baseURL ? new URL(baseURL).origin : '';
    page.on('response', (res) => {
      if (origin && res.url().startsWith(origin) && res.status() >= 400) bad.push(`${res.status()} ${res.url().replace(origin, '')}`);
    });

    await page.goto('/tests/fixtures/blank.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => {
      const a = document.createElement('audio');
      a.src = '/demos/__no_such_file__.mp3';
      document.body.appendChild(a);
      a.load();
      await new Promise((r) => setTimeout(r, 1200));
    });

    expect(
      bad.filter((b) => b.includes('__no_such_file__')),
      'a missing media file must still fail the gate -- it arrives as a 404 through the response listener, not as an abort'
    ).not.toEqual([]);
  });

  test('a non-media aborted same-origin request is still reported', async ({ page, baseURL }) => {
    const bad: string[] = [];
    const origin = baseURL ? new URL(baseURL).origin : '';
    page.on('requestfailed', (req) => {
      const url = req.url();
      if (!origin || !url.startsWith(origin)) return;
      if (req.resourceType() === 'media' && req.failure()?.errorText === 'net::ERR_ABORTED') return;
      bad.push(`FAILED ${req.failure()?.errorText ?? ''} ${url.replace(origin, '')}`.trim());
    });

    await page.goto('/tests/fixtures/blank.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => {
      // A fetch aborted mid-flight: same origin, NOT media.
      const c = new AbortController();
      const p = fetch('/data/schema-index.json', { signal: c.signal }).catch(() => {});
      c.abort();
      await p;
      await new Promise((r) => setTimeout(r, 500));
    });

    expect(
      bad.filter((b) => b.includes('schema-index.json')),
      'an aborted NON-media request must still fail -- the exemption is for media only'
    ).not.toEqual([]);
  });
});
