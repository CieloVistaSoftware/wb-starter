/**
 * /api/fixes IS COMPUTED ONCE, NOT ON EVERY LOAD
 * ==============================================
 * #1054. The route walks the whole git history and cross-references every
 * `#NNNN` against the issue list — measured at 8.2s and 10.6s returning 3.86MB,
 * recomputed from scratch every time. The Fix Viewer shows no rows until it
 * resolves, which is how "it's just hanging" happened: it was working, silently,
 * for longer than anyone waits.
 *
 * Asserted on the CACHE HEADER and on time, not on time alone. A timing-only
 * test would pass on a fast machine with no cache at all, and fail on a slow one
 * that is working perfectly — the assertion has to name the mechanism.
 */

import { test, expect } from '@playwright/test';

test('the second call to /api/fixes is served from cache, and fast', async ({ request, baseURL }) => {
  test.slow(); // the FIRST call legitimately takes ~10s; that is the thing being fixed.

  // Force a recompute so the first leg is always a genuine miss, whatever ran
  // before this test.
  const first = await request.get(`${baseURL}/api/fixes?refresh=1`, { timeout: 120_000 });
  expect(first.ok(), 'the route did not answer at all').toBeTruthy();
  const firstBody = await first.json();

  expect(
    Array.isArray(firstBody.rows) && firstBody.rows.length,
    'No rows came back, so this test cannot tell a working cache from a broken route. ' +
    '(`gh` unauthenticated or rate-limited will do this.)',
  ).toBeTruthy();
  expect(first.headers()['x-fixes-cache']).toBe('miss');

  const startedAt = Date.now();
  const second = await request.get(`${baseURL}/api/fixes`, { timeout: 120_000 });
  const elapsed = Date.now() - startedAt;
  const secondBody = await second.json();

  expect(
    second.headers()['x-fixes-cache'],
    'The second call recomputed. HEAD has not moved between these two requests, so the\n' +
    'answer was already known — see data/fixes-cache.json.',
  ).toBe('hit');

  expect(
    secondBody.rows.length,
    'The cached payload does not match the computed one, which makes the cache a liar\n' +
    'rather than an optimisation.',
  ).toBe(firstBody.rows.length);

  // "Well under a second" per the issue. Generous here because CI machines are
  // not this one, and the mechanism is already proven by the header above; this
  // guards against a "cache" that reads and re-derives.
  expect(
    elapsed,
    `The cached call took ${elapsed}ms. It is being served from cache but is still slow, ` +
    'so something is re-deriving the payload rather than handing it back.',
  ).toBeLessThan(3000);

  console.log(`[#1054] cached /api/fixes: ${elapsed}ms, ${secondBody.rows.length} rows`);
});
