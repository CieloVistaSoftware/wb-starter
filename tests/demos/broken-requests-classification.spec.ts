import { test, expect, type Page, type Request } from '@playwright/test';
import {
  describeFailedRequest,
  describeErrorResponse,
  watchBrokenRequests,
} from '../helpers/broken-requests';

/**
 * Guard for #1116: what all-demos-smoke counts as a broken same-origin request.
 *
 * The gate failed demos/autoinject.html on four `net::ERR_ABORTED` media
 * requests -- the browser cancelling ranged audio fetches after buffering, with
 * every player at readyState 4 and no error. The fix exempts exactly that case.
 * This spec exists so the exemption cannot quietly widen: "ignore aborted media"
 * turning into "ignore media" is how #514 and #763 happened.
 *
 * Part 1 enumerates the parameter space (resource type x error text x origin)
 * against an oracle written independently of the helper. Part 2 drives a real
 * browser through the SAME listener wiring all-demos-smoke uses, including a
 * reproduction of the original failure: Chrome buffering four same-origin
 * players and cancelling their range requests. No media file is added to the
 * repo (#762): every media response here is synthesized in memory and served
 * by page.route, or is a path that does not exist.
 */

// ── Parameter space ─────────────────────────────────────────────────────────

const ORIGIN = 'http://localhost:4173';

/** Every value Playwright's request.resourceType() can return. */
const RESOURCE_TYPES = [
  'document', 'stylesheet', 'image', 'media', 'font', 'script', 'texttrack',
  'xhr', 'fetch', 'eventsource', 'websocket', 'manifest', 'other',
] as const;

/**
 * Error texts. Chromium's real ones, the other engines' spellings of an abort
 * (which must NOT ride the Chromium exemption), and edges that differ from
 * `net::ERR_ABORTED` by one character, case or whitespace.
 */
const ERROR_TEXTS = [
  'net::ERR_ABORTED',
  'net::ERR_FAILED',
  'net::ERR_CONNECTION_RESET',
  'net::ERR_CONNECTION_CLOSED',
  'net::ERR_CONNECTION_REFUSED',
  'net::ERR_EMPTY_RESPONSE',
  'net::ERR_TIMED_OUT',
  'net::ERR_CACHE_MISS',
  'net::ERR_BLOCKED_BY_CLIENT',
  'net::ERR_BLOCKED_BY_RESPONSE',
  'NS_BINDING_ABORTED',
  'cancelled',
  '',
  'net::err_aborted',
  ' net::ERR_ABORTED',
  'net::ERR_ABORTED ',
] as const;

/** Where the request went, relative to the dev server at `origin`. */
const ORIGIN_CASES = [
  { name: 'same-origin',            origin: ORIGIN, url: `${ORIGIN}/demos/audio.mp3`,                    same: true },
  { name: 'same-origin, query',     origin: ORIGIN, url: `${ORIGIN}/src/core/wb.js?v=2`,                 same: true },
  { name: 'cross-origin host',      origin: ORIGIN, url: 'https://www.w3schools.com/html/horse.mp3',     same: false },
  { name: 'cross-origin port',      origin: ORIGIN, url: 'http://localhost:4999/demos/audio.mp3',         same: false },
  { name: 'cross-origin scheme',    origin: ORIGIN, url: 'https://localhost:4173/demos/audio.mp3',        same: false },
  { name: 'no baseURL',             origin: '',     url: `${ORIGIN}/demos/audio.mp3`,                    same: false },
] as const;

/**
 * The oracle, written from the rule rather than from the helper: a request
 * failure is reported only when it is same-origin, and is NOT a media request
 * that the browser aborted.
 */
function oracleReportsFailure(type: string, errorText: string, same: boolean): boolean {
  if (!same) return false;
  const bufferingAbort = type === 'media' && errorText === 'net::ERR_ABORTED';
  return !bufferingAbort;
}

test.describe('#1116 requestfailed classification -- full parameter space', () => {
  test('the space has the size it was designed with', () => {
    // A list quietly shrinking to the cases that pass is a check that stopped looking.
    expect(RESOURCE_TYPES.length * ERROR_TEXTS.length * ORIGIN_CASES.length).toBe(13 * 16 * 6);
  });

  for (const oc of ORIGIN_CASES) {
    for (const type of RESOURCE_TYPES) {
      test(`${oc.name} x ${type}`, () => {
        for (const errorText of ERROR_TEXTS) {
          const row = `${oc.name} | ${type} | ${JSON.stringify(errorText)}`;
          const line = describeFailedRequest({ url: oc.url, resourceType: type, errorText }, oc.origin);
          const expected = oracleReportsFailure(type, errorText, oc.same);
          expect.soft(line !== null, `reported? ${row}`).toBe(expected);
          if (expected) {
            const pathPart = oc.url.slice(oc.origin.length);
            expect.soft(line, `report line ${row}`).toBe(`FAILED ${errorText} ${pathPart}`.trim());
          }
        }
      });
    }
  }
});

test.describe('#1116 response classification -- status is the only thing that matters', () => {
  const STATUSES = [100, 200, 204, 206, 301, 304, 399, 400, 401, 403, 404, 410, 416, 499, 500, 503, 599];

  for (const oc of ORIGIN_CASES) {
    test(`${oc.name} x every status`, () => {
      for (const status of STATUSES) {
        const line = describeErrorResponse(oc.url, status, oc.origin);
        const expected = oc.same && status >= 400;
        expect.soft(line !== null, `reported? ${oc.name} | ${status}`).toBe(expected);
        if (expected) expect.soft(line).toBe(`${status} ${oc.url.slice(oc.origin.length)}`);
      }
    });
  }
});

// ── Real browser, real wiring ───────────────────────────────────────────────

/**
 * Load a same-origin page with no scripts and attach the gate's own listeners.
 * Also returns every raw requestfailed event, so a test can prove the failure
 * it is about actually happened -- an exemption test that passes because
 * nothing failed proves nothing.
 */
async function openFixture(page: Page, baseURL: string | undefined) {
  const origin = baseURL ? new URL(baseURL).origin : '';
  expect(origin, 'baseURL must be set or nothing is same-origin').not.toBe('');
  await page.goto('/tests/fixtures/blank.html');
  const broken = watchBrokenRequests(page, origin);
  const raw: Request[] = [];
  page.on('requestfailed', (req) => raw.push(req));
  return { origin, broken, raw };
}

/** A silent 16-bit mono PCM wav, built in memory -- no media file in the repo (#762). */
function silentWav(seconds: number, rate = 44100): Buffer {
  const dataLen = seconds * rate * 2;
  const wav = Buffer.alloc(44 + dataLen);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + dataLen, 4); wav.write('WAVE', 8);
  wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(dataLen, 40);
  return wav;
}

/** Serve `body` at `glob` the way a static server does: honour Range with 206. */
async function serveRanged(page: Page, glob: string, body: Buffer, contentType: string): Promise<string[]> {
  const ranges: string[] = [];
  await page.route(glob, (route) => {
    const range = route.request().headers()['range'] ?? '';
    ranges.push(range);
    const m = /bytes=(\d+)-(\d*)/.exec(range);
    if (!m) return route.fulfill({ status: 200, contentType, headers: { 'accept-ranges': 'bytes' }, body });
    const start = Number(m[1]);
    const end = m[2] ? Math.min(Number(m[2]), body.length - 1) : body.length - 1;
    return route.fulfill({
      status: 206,
      contentType,
      headers: { 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${body.length}` },
      body: body.subarray(start, end + 1),
    });
  });
  return ranges;
}

test.describe('#1116 guards in a real browser (the all-demos-smoke wiring)', () => {
  test('the original failure: players that buffer and cancel their range request are NOT reported', async ({ page, baseURL }) => {
    const { broken, raw } = await openFixture(page, baseURL);
    const url = '/__1116__/buffered.wav';
    const ranges = await serveRanged(page, `**${url}`, silentWav(60), 'audio/wav');

    // Four players, as on demos/autoinject.html when #1116 was filed.
    await page.evaluate((src) => {
      for (let i = 0; i < 4; i++) {
        const a = document.createElement('audio');
        a.preload = 'metadata';
        a.controls = true;
        a.src = src;
        document.body.append(a);
      }
    }, url);

    // The browser really did cancel them, in the vocabulary the helper keys on.
    await expect.poll(() => raw.filter((r) => r.url().endsWith(url)).length, { timeout: 15000 }).toBe(4);
    for (const r of raw.filter((r) => r.url().endsWith(url))) {
      expect(r.resourceType()).toBe('media');
      expect(r.failure()?.errorText).toBe('net::ERR_ABORTED');
    }
    expect(ranges, 'each player opened a ranged request').toEqual(['bytes=0-', 'bytes=0-', 'bytes=0-', 'bytes=0-']);

    // ...and nothing was broken: every player is loaded, none errored.
    await page.waitForFunction(() => [...document.querySelectorAll('audio')].every((a) => a.readyState === 4));
    const errors = await page.evaluate(() => [...document.querySelectorAll('audio')].map((a) => a.error?.code ?? null));
    expect(errors).toEqual([null, null, null, null]);

    expect(broken).toEqual([]);
  });

  test('guard 1: a same-origin media 404 IS reported (response path)', async ({ page, baseURL }) => {
    const { broken } = await openFixture(page, baseURL);
    const responded = page.waitForResponse((r) => r.url().includes('/__1116__/missing-audio.mp3'));
    await page.evaluate(() => {
      const a = document.createElement('audio');
      a.preload = 'auto';
      a.src = '/__1116__/missing-audio.mp3';
      document.body.append(a);
    });
    const res = await responded;
    expect(res.status()).toBe(404);
    await expect.poll(() => broken).toContain('404 /__1116__/missing-audio.mp3');
  });

  test('guard 2: an aborted same-origin module fetch IS reported', async ({ page, baseURL }) => {
    const { broken, raw } = await openFixture(page, baseURL);
    await page.route('**/__1116__/module.js', (route) => route.abort('aborted'));

    const failed = page.waitForEvent('requestfailed', (r) => r.url().includes('/__1116__/module.js'));
    await page.evaluate(() => {
      const s = document.createElement('script');
      s.type = 'module';
      s.src = '/__1116__/module.js';
      document.body.append(s);
    });
    await failed;

    const hit = raw.find((r) => r.url().includes('/__1116__/module.js'))!;
    expect(hit.resourceType()).toBe('script');
    expect(hit.failure()?.errorText).toBe('net::ERR_ABORTED');
    expect(broken).toEqual(['FAILED net::ERR_ABORTED /__1116__/module.js']);
  });

  test('a same-origin media connection reset IS reported (only the abort is exempt)', async ({ page, baseURL }) => {
    const { broken } = await openFixture(page, baseURL);
    await page.route('**/__1116__/reset.mp3', (route) => route.abort('connectionreset'));

    const failed = page.waitForEvent('requestfailed', (r) => r.url().includes('/__1116__/reset.mp3'));
    await page.evaluate(() => {
      const a = document.createElement('audio');
      a.preload = 'auto';
      a.src = '/__1116__/reset.mp3';
      document.body.append(a);
    });
    const req = await failed;

    expect(req.resourceType()).toBe('media');
    expect(broken).toEqual([`FAILED ${req.failure()?.errorText} /__1116__/reset.mp3`]);
    expect(req.failure()?.errorText).toBe('net::ERR_CONNECTION_RESET');
  });
});
