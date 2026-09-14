/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Someone else's server being down is not a runtime error on this page (#1115)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Demo media is REMOTE by rule (#762: "all audio and video must be from out
 * there not local"). When that third-party host was slow, audio.js threw
 * "x-audio: failed to load src https://archive.org/..." as an uncaught error.
 * ErrorLogger wrote it to data/errors.json, and compliance/error-log-empty and
 * compliance/dark-mode failed together -- no release could be cut for as long
 * as archive.org had a bad minute.
 *
 * The page cannot tell "their host is down" from "their URL is wrong" -- both
 * arrive as the same MediaError. What it CAN tell is whose server it is. So the
 * failure is classified at the source, the same way error-logger.js's own
 * resource handler already classifies failed <img>/<script> loads: same-origin
 * only is a page defect.
 *
 * WHAT THIS PROVES, WITHOUT THE REAL NETWORK
 *
 * Every media URL here is intercepted with page.route and ABORTED, so the
 * browser sees exactly what an unreachable host produces and nothing leaves the
 * machine. The two tests use the identical failure; only the origin differs.
 *
 *   1. Off-origin: no uncaught page error, no error-log entry, no console error
 *      naming the URL -- AND the failure is still observable: the element
 *      carries error="unreachable", a [WB:media-unreachable] warning is
 *      printed, and a bubbling `wb:media:unreachable` event is dispatched.
 *      Nothing dies silently.
 *   2. Same-origin: still an uncaught page error, still posted to the error
 *      log, and NOT marked unreachable. An authoring mistake stays loud.
 *   3. The classifier: only http(s) on another origin is third-party. A
 *      malformed scheme, relative path, data: or blob: URI is authored here.
 *
 * Error-log posts are fulfilled by page.route, so this spec never writes to
 * data/errors.json -- it cannot pollute the log the compliance gate reads.
 *
 * Covers every media failure path that throws: audio.js, media-load-retry.js
 * (native <video>/<img>, cardvideo, cardimage), img.js's fallback path, and
 * card.js's cardhero / cardhorizontal / cardoverlay probes.
 */

import { test, expect, type Page } from '@playwright/test';

const REMOTE = 'https://media.unreachable-1115.test';
const LOCAL_DIR = '/tests/fixtures/unreachable-1115';

interface Variant {
  name: string;
  /** Build markup from a url factory, so each variant names its own files. */
  markup: (u: (file: string) => string) => string;
  /** The URL whose failure this variant reports (the last one to fail). */
  failing: (u: (file: string) => string) => string;
  /** Where error="unreachable" must land. */
  host: string;
}

const VARIANTS: Variant[] = [
  {
    name: 'audio',
    markup: (u) => `<audio id="v-audio" src="${u('track.mp3')}"></audio>`,
    failing: (u) => u('track.mp3'),
    host: '#v-audio',
  },
  {
    name: 'video',
    markup: (u) => `<video id="v-video" src="${u('clip.mp4')}"></video>`,
    failing: (u) => u('clip.mp4'),
    host: '#v-video',
  },
  {
    name: 'img',
    markup: (u) => `<img id="v-img" src="${u('photo.png')}" alt="">`,
    failing: (u) => u('photo.png'),
    host: '#v-img',
  },
  {
    name: 'img with fallback',
    markup: (u) => `<img id="v-imgfb" src="${u('primary.png')}" fallback="${u('fallback.png')}" alt="">`,
    failing: (u) => u('fallback.png'),
    host: '#v-imgfb',
  },
  {
    name: 'cardimage',
    markup: (u) => `<article x-cardimage id="v-cardimage" src="${u('card.png')}" title="t">b</article>`,
    failing: (u) => u('card.png'),
    host: '#v-cardimage img',
  },
  {
    name: 'cardvideo',
    markup: (u) => `<article x-cardvideo id="v-cardvideo" src="${u('card.mp4')}" title="t">b</article>`,
    failing: (u) => u('card.mp4'),
    host: '#v-cardvideo video',
  },
  {
    name: 'cardhero',
    markup: (u) => `<div x-cardhero id="v-cardhero" background="${u('hero.jpg')}" title="t">b</div>`,
    failing: (u) => u('hero.jpg'),
    host: '#v-cardhero',
  },
  {
    name: 'cardhorizontal',
    markup: (u) => `<div x-cardhorizontal id="v-cardhorizontal" image="${u('side.jpg')}" title="t">b</div>`,
    failing: (u) => u('side.jpg'),
    host: '#v-cardhorizontal img',
  },
  {
    name: 'cardoverlay',
    markup: (u) => `<div x-cardoverlay id="v-cardoverlay" image="${u('overlay.jpg')}" title="t">b</div>`,
    failing: (u) => u('overlay.jpg'),
    host: '#v-cardoverlay',
  },
];

const remoteUrl = (file: string) => `${REMOTE}/${file}`;
const localUrl = (file: string) => `${LOCAL_DIR}/${file}`;

interface Observed {
  pageErrors: string[];
  consoleErrors: string[];
  warnings: string[];
  logPosts: string[];
}

/**
 * Loads the harness with every media request aborted and every error-log post
 * captured, then injects all variants built from `u`.
 */
async function renderVariants(page: Page, u: (file: string) => string, extra = ''): Promise<Observed> {
  const observed: Observed = { pageErrors: [], consoleErrors: [], warnings: [], logPosts: [] };

  page.on('pageerror', (err) => observed.pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') observed.consoleErrors.push(msg.text());
    if (msg.type() === 'warning') observed.warnings.push(msg.text());
  });

  // The failure under test: a slow host that then turns out to be unreachable
  // (what archive.org did). Same for both origins. The delay matters: an
  // INSTANT abort fails the load before audio.js has attached its 'error'
  // listener, and that early failure is currently reported by nothing at all
  // -- a separate defect, traced while writing this spec, not what #1115 is.
  const slowThenUnreachable = async (route: import('@playwright/test').Route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.abort('internetdisconnected').catch(() => {});
  };
  await page.route(`${REMOTE}/**`, slowThenUnreachable);
  await page.route(`**${LOCAL_DIR}/**`, slowThenUnreachable);

  // Captured, never forwarded: this spec must not write data/errors.json.
  await page.route('**/api/error-log/append', async (route) => {
    observed.logPosts.push(route.request().postData() || '');
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
  });

  // Tall enough that cardimage's loading="lazy" image intersects immediately.
  await page.setViewportSize({ width: 1400, height: 4000 });
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, null, { timeout: 15000 });

  const html = VARIANTS.map((v) => `<section class="variant">${v.markup(u)}</section>`).join('') + extra;
  await page.evaluate(async (markup) => {
    // The harness marks itself as expecting errors, which suppresses the log
    // post. Removed so an authoring failure has to reach the log for real.
    document.documentElement.removeAttribute('data-x-expected-errors');
    (window as any).__unreachable = [];
    document.addEventListener('wb:media:unreachable', (e) => {
      (window as any).__unreachable.push((e as CustomEvent).detail?.src || '');
    });
    const container = document.createElement('div');
    container.id = 'variants-1115';
    container.innerHTML = markup;
    document.body.appendChild(container);
    await (window as any).WB.scan(container, { eager: true });
  }, html);

  return observed;
}

/** Hosts carrying error="unreachable", keyed by variant host selector. */
async function unreachableHosts(page: Page): Promise<string[]> {
  return page.evaluate((hosts) => hosts.filter((sel) => {
    const el = document.querySelector(sel);
    return !!el && el.getAttribute('error') === 'unreachable';
  }), VARIANTS.map((v) => v.host));
}

const names = (list: string[], url: string) => list.filter((t) => t.includes(url));

test.describe('#1115 third-party media outage', () => {
  // media-load-retry.js: 5 attempts, 500ms exponential backoff (~7.5s) per element.
  test.setTimeout(90000);

  test('an unreachable off-origin host is reported on the element, not as a page error', async ({ page }) => {
    const o = await renderVariants(page, remoteUrl);

    // Settled = every variant either marked itself unreachable or threw. Both
    // outcomes end the wait, so the unfixed code fails on assertions with
    // counts rather than on a timeout.
    await expect.poll(async () => {
      const marked = await unreachableHosts(page);
      return VARIANTS.filter((v) => !marked.includes(v.host) && names(o.pageErrors, v.failing(remoteUrl)).length === 0)
        .map((v) => v.name);
    }, { timeout: 45000, intervals: [500] }).toEqual([]);
    // Give any trailing async throw (setTimeout 0) and log post time to land.
    await page.waitForTimeout(1000);

    const marked = await unreachableHosts(page);
    const events: string[] = await page.evaluate(() => (window as any).__unreachable);

    const summary = VARIANTS.map((v) => {
      const url = v.failing(remoteUrl);
      return {
        variant: v.name,
        pageErrors: names(o.pageErrors, url).length,
        logPosts: names(o.logPosts, url).length,
        consoleErrors: names(o.consoleErrors, url).length,
        marked: marked.includes(v.host),
        warned: o.warnings.some((w) => w.includes('[WB:media-unreachable]') && w.includes(url)),
        event: events.some((s) => s.includes(url)),
      };
    });
    console.log('[#1115 off-origin]', JSON.stringify(summary));

    for (const s of summary) {
      // (a) not a page defect
      expect.soft(s.pageErrors, `${s.variant}: uncaught page errors naming the third-party URL`).toBe(0);
      expect.soft(s.logPosts, `${s.variant}: error-log posts naming the third-party URL`).toBe(0);
      expect.soft(s.consoleErrors, `${s.variant}: console errors naming the third-party URL`).toBe(0);
      // (b) still observable -- nothing dies silently
      expect.soft(s.marked, `${s.variant}: element must carry error="unreachable"`).toBe(true);
      expect.soft(s.warned, `${s.variant}: a [WB:media-unreachable] warning must name the URL`).toBe(true);
      expect.soft(s.event, `${s.variant}: a wb:media:unreachable event must name the URL`).toBe(true);
    }
    const totals = {
      pageErrors: summary.reduce((n, s) => n + s.pageErrors, 0),
      logPosts: summary.reduce((n, s) => n + s.logPosts, 0),
      unmarked: summary.filter((s) => !s.marked).length,
    };
    expect(totals, 'off-origin totals').toEqual({ pageErrors: 0, logPosts: 0, unmarked: 0 });
  });

  test('the same failure on this site\'s own origin is still a page error', async ({ page }) => {
    const o = await renderVariants(page, localUrl);

    const expected = VARIANTS.map((v) => ({ name: v.name, url: v.failing(localUrl) }));

    await expect.poll(
      () => expected.filter((e) => names(o.pageErrors, e.url).length === 0).map((e) => e.name),
      { timeout: 45000, intervals: [500] },
    ).toEqual([]);
    await page.waitForTimeout(1000);

    const marked = await unreachableHosts(page);
    const summary = expected.map((e) => ({
      variant: e.name,
      pageErrors: names(o.pageErrors, e.url).length,
      logPosts: names(o.logPosts, e.url).length,
    }));
    console.log('[#1115 same-origin]', JSON.stringify(summary), 'marked:', JSON.stringify(marked));

    for (const s of summary) {
      expect.soft(s.pageErrors, `${s.variant}: an authoring failure must stay an uncaught error`).toBeGreaterThan(0);
      expect.soft(s.logPosts, `${s.variant}: an authoring failure must reach the error log`).toBeGreaterThan(0);
    }
    expect(marked, 'a same-origin failure must never be labelled unreachable').toEqual([]);
  });

  test('only an http(s) url on ANOTHER origin counts as third-party; anything authored here does not', async ({ page }) => {
    // A malformed src fails instantly, before any behavior can listen, so it is
    // proved at the classifier rather than through a race with module loading.
    await page.goto('/demos/test-harness.html');
    const verdicts = await page.evaluate(async () => {
      const { isThirdPartyMedia } = await import('/src/wb-viewmodels/media-unreachable.js');
      const cases: Record<string, string> = {
        remoteHttps: 'https://archive.org/download/x/01.mp3',
        remoteHttp: 'http://www.w3schools.com/html/horse.mp3',
        protocolRelativeRemote: '//cdn.pixabay.com/video.mp4',
        sameOriginAbsolute: `${location.origin}/demos/audio.mp3`,
        rootRelative: '/tests/fixtures/broken-audio-0-bytes.mp3',
        relative: '../audio.mp3',
        malformedScheme: 'htp:/nope.mp3',
        dataUri: 'data:audio/mp3;base64,AAAA',
        blobUri: 'blob:https://archive.org/1234',
        empty: '',
      };
      return Object.fromEntries(Object.entries(cases).map(([k, v]) => [k, isThirdPartyMedia(v)]));
    });
    expect(verdicts).toEqual({
      remoteHttps: true,
      remoteHttp: true,
      protocolRelativeRemote: true,
      sameOriginAbsolute: false,
      rootRelative: false,
      relative: false,
      malformedScheme: false,
      dataUri: false,
      blobUri: false,
      empty: false,
    });
  });
});
