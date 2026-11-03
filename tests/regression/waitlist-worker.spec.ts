import { test, expect } from '@playwright/test';
import worker from '../../server/waitlist/src/index.js';
import { normalizeEmail, sameSecret, visitorKey, originAllowed, JOIN_LIMIT, MAX_BODY_BYTES } from '../../server/waitlist/src/lib.js';

/**
 * #1961: the WB Pro waitlist is our own Cloudflare Worker
 * (server/waitlist/src/index.js), not a newsletter service. These run the
 * Worker's fetch handler directly, with an in-memory stand-in for its D1
 * database, so they need no Cloudflare account and no browser.
 */

const PAGES = 'https://cielovistasoftware.github.io';

/** An in-memory stand-in for the D1 calls the Worker makes. */
function fakeDb() {
  const rows = new Map<string, string>();
  const attempts: { visitor: string; at: number }[] = [];
  return {
    rows,
    attempts,
    prepare(sql: string) {
      let args: (string | number)[] = [];
      return {
        bind(...values: (string | number)[]) { args = values; return this; },
        async run() {
          if (/^INSERT OR IGNORE INTO waitlist/.test(sql) && !rows.has(String(args[0]))) rows.set(String(args[0]), String(args[1]));
          if (/^INSERT INTO join_attempts/.test(sql)) attempts.push({ visitor: String(args[0]), at: Number(args[1]) });
          if (/^DELETE FROM join_attempts WHERE at </.test(sql)) {
            for (let i = attempts.length - 1; i >= 0; i -= 1) if (attempts[i].at < Number(args[0])) attempts.splice(i, 1);
          }
          return { success: true };
        },
        async first() {
          return { n: attempts.filter((a) => a.visitor === args[0]).length };
        },
        async all() {
          return { results: [...rows].map(([email, joined_at]) => ({ email, joined_at })) };
        },
      };
    },
  };
}

function join(fields: Record<string, string>, origin: string | null = PAGES, ip = '203.0.113.7') {
  const body = new URLSearchParams(fields);
  const headers: Record<string, string> = { 'content-type': 'application/x-www-form-urlencoded', 'cf-connecting-ip': ip };
  if (origin) headers.origin = origin;
  return new Request('https://waitlist.example/join', { method: 'POST', body, headers });
}

test('a sign-up from the Pro page is saved once, lower-cased (#1961)', async () => {
  const DB = fakeDb();
  const env = { DB, PRO_PAGE_URL: `${PAGES}/?page=pro` };

  const first = await worker.fetch(join({ email: '  Ann@Example.com ', website: '' }), env);
  expect(first.status).toBe(200);
  const html = await first.text();
  expect(html).toContain('You are on the list');
  expect(html).toContain('ann@example.com');
  expect(html).toContain(`href="${PAGES}/?page=pro"`);

  await worker.fetch(join({ email: 'ann@example.com', website: '' }), env);
  expect([...DB.rows.keys()]).toEqual(['ann@example.com']);
});

test('the waitlist refuses other sites, bad addresses and bots (#1961)', async () => {
  const DB = fakeDb();
  const env = { DB };

  expect((await worker.fetch(join({ email: 'a@b.co' }, 'https://evil.example'), env)).status).toBe(403);
  expect((await worker.fetch(join({ email: 'a@b.co' }, null), env)).status).toBe(403);
  expect((await worker.fetch(join({ email: 'not-an-address' }, PAGES, '198.51.100.1'), env)).status).toBe(400);

  // The hidden "website" field: a bot is told it worked, and nothing is kept.
  const bot = await worker.fetch(join({ email: 'bot@spam.co', website: 'http://spam' }, PAGES, '198.51.100.2'), env);
  expect(bot.status).toBe(200);
  expect(DB.rows.size).toBe(0);
});

test('only a small form body is accepted (#1961)', async () => {
  const env = { DB: fakeDb() };
  const json = new Request('https://waitlist.example/join', {
    method: 'POST', body: JSON.stringify({ email: 'a@b.co' }),
    headers: { origin: PAGES, 'content-type': 'application/json' },
  });
  expect((await worker.fetch(json, env)).status).toBe(415);

  const big = join({ email: 'a@b.co', filler: 'x'.repeat(MAX_BODY_BYTES) });
  expect((await worker.fetch(big, env)).status).toBe(413);
  expect(env.DB.rows.size).toBe(0);
});

test(`one visitor gets ${JOIN_LIMIT} tries an hour, and the IP is never stored (#1961)`, async () => {
  const DB = fakeDb();
  const env = { DB, IP_SALT: 'test-salt' };
  for (let i = 0; i < JOIN_LIMIT; i += 1) {
    expect((await worker.fetch(join({ email: `p${i}@example.com` }, PAGES, '192.0.2.10'), env)).status).toBe(200);
  }
  const blocked = await worker.fetch(join({ email: 'late@example.com' }, PAGES, '192.0.2.10'), env);
  expect(blocked.status).toBe(429);
  expect(DB.rows.has('late@example.com')).toBe(false);

  // Another visitor is not affected.
  expect((await worker.fetch(join({ email: 'other@example.com' }, PAGES, '192.0.2.99'), env)).status).toBe(200);

  // What is stored is the salted hash, never the address.
  expect(DB.attempts.some((a) => a.visitor.includes('192.0.2.10'))).toBe(false);
  expect(DB.attempts[0].visitor).toBe(await visitorKey('192.0.2.10', 'test-salt'));
  expect(DB.attempts[0].visitor).toMatch(/^[0-9a-f]{64}$/);
});

test('nothing a visitor types is put on the page as markup (#1961)', async () => {
  const res = await worker.fetch(join({ email: '<b>x</b>@a.co' }), { DB: fakeDb() });
  expect(await res.text()).not.toContain('<b>x</b>');
});

test('every answer carries the security headers (#1961)', async () => {
  const env = { DB: fakeDb() };
  for (const res of [
    await worker.fetch(join({ email: 'h@example.com' }), env),
    await worker.fetch(new Request('https://waitlist.example/nope'), env),
    await worker.fetch(new Request('https://waitlist.example/export'), env),
  ]) {
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'none'");
  }
});

test('the list exports as CSV only with the token (#1961)', async () => {
  const DB = fakeDb();
  DB.rows.set('ann@example.com', '2026-11-02T00:00:00.000Z');
  const env = { DB, EXPORT_TOKEN: 's3cret' };
  const get = (auth?: string) => new Request('https://waitlist.example/export', auth ? { headers: { authorization: auth } } : {});

  expect((await worker.fetch(get(), env)).status).toBe(401);
  expect((await worker.fetch(get('Bearer wrong'), env)).status).toBe(401);
  expect((await worker.fetch(get('Bearer s3cre'), env)).status).toBe(401);
  expect((await worker.fetch(get(), { DB })).status).toBe(401);

  const ok = await worker.fetch(get('Bearer s3cret'), env);
  expect(ok.status).toBe(200);
  expect(await ok.text()).toBe('email,joined_at\nann@example.com,2026-11-02T00:00:00.000Z\n');
});

test('sameSecret compares whole strings (#1961)', () => {
  expect(sameSecret('Bearer abc', 'Bearer abc')).toBe(true);
  expect(sameSecret('Bearer ab', 'Bearer abc')).toBe(false);
  expect(sameSecret('Bearer abd', 'Bearer abc')).toBe(false);
  expect(sameSecret('', 'x')).toBe(false);
});

test('normalizeEmail keeps real addresses and rejects the rest (#1961)', () => {
  expect(normalizeEmail(' A@B.CO ')).toBe('a@b.co');
  expect(normalizeEmail('a@b')).toBeNull();
  expect(normalizeEmail('a b@c.co')).toBeNull();
  expect(normalizeEmail(42)).toBeNull();
  expect(normalizeEmail(`${'a'.repeat(250)}@b.co`)).toBeNull();
});

test('localhost may sign up only to a local Worker, on any port (#1961)', async () => {
  // Deployed (no LOCAL_DEV): only the live site.
  expect(originAllowed(PAGES, {})).toBe(true);
  expect(originAllowed('http://localhost:3000', {})).toBe(false);
  // npm run pro:local sets LOCAL_DEV=1; the site may be on 3000 or the next free port.
  expect(originAllowed('http://localhost:3003', { LOCAL_DEV: '1' })).toBe(true);
  expect(originAllowed('http://127.0.0.1:3000', { LOCAL_DEV: '1' })).toBe(true);
  expect(originAllowed('https://evil.example', { LOCAL_DEV: '1' })).toBe(false);
  expect(originAllowed('http://localhost.evil.example:3000', { LOCAL_DEV: '1' })).toBe(false);

  const fromPort3003 = join({ email: 'p3003@example.com' }, 'http://localhost:3003', '192.0.2.50');
  expect((await worker.fetch(fromPort3003, { DB: fakeDb(), LOCAL_DEV: '1' })).status).toBe(200);
  const deployed = join({ email: 'p3003@example.com' }, 'http://localhost:3003', '192.0.2.51');
  expect((await worker.fetch(deployed, { DB: fakeDb() })).status).toBe(403);
});

test('a browser-style multipart form (fetch with FormData) is read (#1961)', async () => {
  // A real multipart boundary has upper-case letters; the Worker once lower-cased
  // it and could not read any form the Pro page sent with fetch (400).
  const body = new FormData();
  body.set('email', 'multi@example.com');
  body.set('website', '');
  const DB = fakeDb();
  const res = await worker.fetch(new Request('https://waitlist.example/join', {
    method: 'POST', body, headers: { origin: PAGES, 'cf-connecting-ip': '192.0.2.77' },
  }), { DB });
  expect(res.status).toBe(200);
  expect(res.headers.get('access-control-allow-origin')).toBe(PAGES);
  expect(DB.rows.has('multi@example.com')).toBe(true);
});
