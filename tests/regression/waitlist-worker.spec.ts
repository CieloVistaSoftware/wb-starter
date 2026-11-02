import { test, expect } from '@playwright/test';
import worker, { normalizeEmail } from '../../server/waitlist/src/index.js';

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
  return {
    rows,
    prepare(sql: string) {
      let args: string[] = [];
      return {
        bind(...values: string[]) { args = values; return this; },
        async run() {
          if (/^INSERT OR IGNORE INTO waitlist/.test(sql) && !rows.has(args[0])) rows.set(args[0], args[1]);
          return { success: true };
        },
        async all() {
          return { results: [...rows].map(([email, joined_at]) => ({ email, joined_at })) };
        },
      };
    },
  };
}

function join(fields: Record<string, string>, origin: string | null = PAGES) {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.set(k, v);
  const headers: Record<string, string> = {};
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
  expect((await worker.fetch(join({ email: 'not-an-address' }), env)).status).toBe(400);

  // The hidden "website" field: a bot is told it worked, and nothing is kept.
  const bot = await worker.fetch(join({ email: 'bot@spam.co', website: 'http://spam' }), env);
  expect(bot.status).toBe(200);
  expect(DB.rows.size).toBe(0);
});

test('nothing a visitor types is put on the page as markup (#1961)', async () => {
  const res = await worker.fetch(join({ email: '<b>x</b>@a.co' }), { DB: fakeDb() });
  expect(await res.text()).not.toContain('<b>x</b>');
});

test('the list exports as CSV only with the token (#1961)', async () => {
  const DB = fakeDb();
  DB.rows.set('ann@example.com', '2026-11-02T00:00:00.000Z');
  const env = { DB, EXPORT_TOKEN: 's3cret' };
  const get = (auth?: string) => new Request('https://waitlist.example/export', auth ? { headers: { authorization: auth } } : {});

  expect((await worker.fetch(get(), env)).status).toBe(401);
  expect((await worker.fetch(get('Bearer wrong'), env)).status).toBe(401);
  expect((await worker.fetch(get(), { DB })).status).toBe(401);

  const ok = await worker.fetch(get('Bearer s3cret'), env);
  expect(ok.status).toBe(200);
  expect(await ok.text()).toBe('email,joined_at\nann@example.com,2026-11-02T00:00:00.000Z\n');
});

test('normalizeEmail keeps real addresses and rejects the rest (#1961)', () => {
  expect(normalizeEmail(' A@B.CO ')).toBe('a@b.co');
  expect(normalizeEmail('a@b')).toBeNull();
  expect(normalizeEmail('a b@c.co')).toBeNull();
  expect(normalizeEmail(42)).toBeNull();
  expect(normalizeEmail(`${'a'.repeat(250)}@b.co`)).toBeNull();
});
