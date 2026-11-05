/**
 * WB Pro waitlist (#1961): a Cloudflare Worker that takes an email address
 * from the Pro page's "Join the waitlist" form and keeps it in a D1 database.
 *
 * The live site is static (GitHub Pages), so it cannot store anything itself;
 * this Worker is the one piece that does. See server/waitlist/README.md.
 *
 *   POST /join    form fields: email, and "website", which must stay empty
 *                 (people never see it; bots fill it in). Answers with a
 *                 small HTML page, so the form works without JavaScript.
 *   GET  /export  the list as CSV. Needs "Authorization: Bearer <token>",
 *                 where the token is the EXPORT_TOKEN secret.
 *
 * Security (John, 2026-11-02: "keep cloudflare database and make it secure"):
 *   - only the live site and localhost may post (Origin check);
 *   - only url-encoded or multipart form bodies, at most MAX_BODY_BYTES;
 *   - at most JOIN_LIMIT attempts per visitor per JOIN_WINDOW_MS, counted by a
 *     salted SHA-256 of the IP address -- the address itself is never stored;
 *   - a hidden trap field: bots are told it worked and nothing is stored;
 *   - parameterized SQL only; every visitor-typed value escaped in the page;
 *   - the export token is compared in constant time;
 *   - every answer carries no-store, no-framing and a deny-by-default CSP.
 */

import {
  originAllowed, MAX_BODY_BYTES, JOIN_LIMIT, JOIN_WINDOW_MS, DEFAULT_PRO_PAGE, centralTime,
  respond, normalizeEmail, sameSecret, visitorKey, escapeHtml,
} from './lib.js';

/**
 * A small, self-contained page: the answer the visitor sees after the form.
 * @param {number} status
 * @param {string} heading
 * @param {string} message
 * @param {string} [proPage] - the Pro page's address (PRO_PAGE_URL)
 */
function page(status, heading, message, proPage = DEFAULT_PRO_PAGE) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(heading)} - WB Pro</title>
<style>
body{margin:0;font-family:system-ui,sans-serif;background:#f4f6f9;color:#141a24}
main{max-width:560px;margin:64px auto;padding:0 16px;line-height:1.5}
a{color:#0b5cad}
</style>
</head>
<body>
<main>
<h1>${escapeHtml(heading)}</h1>
<p>${escapeHtml(message)}</p>
<p><a href="${escapeHtml(proPage)}">Back to WB Pro</a></p>
</main>
</body>
</html>`;
  return respond(html, status, { 'content-type': 'text/html; charset=utf-8' });
}

/**
 * Count this attempt and say whether the visitor is over the limit. Old
 * attempts are deleted as it goes, so the table only holds the last hour.
 * @param {D1Database} db
 * @param {string} key - visitorKey()
 * @param {number} now - ms since epoch
 * @returns {Promise<boolean>} true when this attempt is over the limit
 */
async function overLimit(db, key, now) {
  const since = now - JOIN_WINDOW_MS;
  await db.prepare('DELETE FROM join_attempts WHERE at < ?1').bind(since).run();
  const row = await db.prepare('SELECT COUNT(*) AS n FROM join_attempts WHERE visitor = ?1').bind(key).first();
  const count = Number(row?.n ?? 0);
  if (count >= JOIN_LIMIT) return true;
  await db.prepare('INSERT INTO join_attempts (visitor, at) VALUES (?1, ?2)').bind(key, now).run();
  return false;
}

/**
 * Handle a sign-up.
 * @param {Request} request
 * @param {{ DB: D1Database, PRO_PAGE_URL?: string, IP_SALT?: string, LOCAL_DEV?: string }} env
 */
async function join(request, env) {
  const origin = request.headers.get('origin');
  // The Pro page sends the form with fetch (ajax) and shows the outcome in
  // place, so it must be allowed to read the answer: CORS for allowed pages only.
  const cors = originAllowed(origin, env) ? { 'access-control-allow-origin': origin, vary: 'Origin' } : {};
  const answer = (status, heading, message) => {
    const res = page(status, heading, message, env.PRO_PAGE_URL);
    for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
    return res;
  };

  if (!originAllowed(origin, env)) {
    return answer(403, 'Not accepted', 'Sign-ups are only taken from the WB Pro page.');
  }

  // Checked lower-cased, but parsed with the header as sent: a multipart
  // boundary is case-sensitive, and lower-casing it made every browser
  // FormData (fetch) body unreadable -- 400 "The form could not be read".
  const rawType = request.headers.get('content-type') || '';
  const type = rawType.toLowerCase();
  if (!type.startsWith('application/x-www-form-urlencoded') && !type.startsWith('multipart/form-data')) {
    return answer(415, 'Not accepted', 'Sign-ups are only taken from the WB Pro page.');
  }

  const declared = Number(request.headers.get('content-length') || '0');
  if (declared > MAX_BODY_BYTES) {
    return answer(413, 'Too large', 'That was more than a sign-up form sends.');
  }
  const raw = await request.arrayBuffer();
  if (raw.byteLength > MAX_BODY_BYTES) {
    return answer(413, 'Too large', 'That was more than a sign-up form sends.');
  }

  let form;
  try {
    form = await new Response(raw, { headers: { 'content-type': rawType } }).formData();
  } catch {
    return answer(400, 'Something went wrong', 'The form could not be read. Please try again.');
  }

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const key = await visitorKey(ip, env.IP_SALT || 'pro-waitlist');
  try {
    if (await overLimit(env.DB, key, Date.now())) {
      return answer(429, 'Too many tries', 'Please wait an hour and try again.');
    }
  } catch (error) {
    console.error('[waitlist] rate limit check failed', error);
    return answer(500, 'Something went wrong', 'Your address was not saved. Please try again in a few minutes.');
  }

  // The hidden "website" field is a trap for bots. Answer as if it worked,
  // so a bot learns nothing, but store nothing.
  if (String(form.get('website') ?? '').trim() !== '') {
    return answer(200, 'You are on the list', 'We will email you when WB Pro goes on sale.');
  }

  const email = normalizeEmail(form.get('email'));
  if (!email) {
    return answer(400, 'Check your email address', 'That does not look like an email address. Please go back and try again.');
  }

  try {
    // INSERT OR IGNORE: joining twice is not an error, and keeps one row.
    await env.DB
      .prepare('INSERT OR IGNORE INTO waitlist (email, joined_at) VALUES (?1, ?2)')
      .bind(email, new Date().toISOString())
      .run();
  } catch (error) {
    console.error('[waitlist] could not save a sign-up', error);
    return answer(500, 'Something went wrong', 'Your address was not saved. Please try again in a few minutes.');
  }

  return answer(200, 'You are on the list', `We will email ${email} when WB Pro goes on sale, with the launch price.`);
}

/**
 * The list as CSV, for the launch email. Only with the export token.
 * @param {Request} request
 * @param {{ DB: D1Database, EXPORT_TOKEN?: string }} env
 */
async function exportList(request, env) {
  const given = request.headers.get('authorization') || '';
  if (!env.EXPORT_TOKEN || !sameSecret(given, `Bearer ${env.EXPORT_TOKEN}`)) {
    return respond('Not allowed\n', 401, { 'content-type': 'text/plain; charset=utf-8' });
  }
  const { results } = await env.DB
    .prepare('SELECT email, joined_at FROM waitlist ORDER BY joined_at')
    .all();
  const rows = ['email,joined_at', ...results.map((row) => `${row.email},${row.joined_at}`)];
  return respond(rows.join('\n') + '\n', 200, {
    'content-type': 'text/csv; charset=utf-8',
    'content-disposition': 'attachment; filename="pro-waitlist.csv"',
  });
}

/** The admin page's shell. Its form posts back here, so form-action is opened to 'self'. */
function adminPage(status, title, body) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)} - WB Pro</title>
<style>
body{margin:0;font-family:system-ui,sans-serif;background:#f4f6f9;color:#141a24}
main{max-width:720px;margin:48px auto;padding:0 16px;line-height:1.5}
label,input,button{display:block;font:inherit}
input{width:100%;max-width:360px;box-sizing:border-box;margin:4px 0 12px;padding:8px}
button{padding:8px 16px}
table{width:100%;border-collapse:collapse;background:#fff}
th,td{text-align:left;padding:8px;border-bottom:1px solid #d5dae2;overflow-wrap:anywhere}
</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>`;
  return respond(html, status, {
    'content-type': 'text/html; charset=utf-8',
    'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  });
}

/** The password form, with an optional message above it. */
function adminLogin(status, message = '') {
  const note = message ? `<p role="alert">${escapeHtml(message)}</p>` : '';
  return adminPage(status, 'Waitlist', `<h1>Waitlist</h1>
${note}<form method="post" action="/admin">
<label for="token">Password (the EXPORT_TOKEN secret)</label>
<input id="token" name="token" type="password" autocomplete="current-password" required>
<button type="submit">Show the list</button>
</form>`);
}

/**
 * POST /admin: the list, for the right password. Only wrong passwords count
 * toward the limit, so looking at the list never locks its owner out.
 */
async function adminList(request, env) {
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES) {
    return adminLogin(413, 'That was too long.');
  }
  let given = '';
  try {
    given = String((await request.formData()).get('token') ?? '');
  } catch {
    return adminLogin(400, 'The form could not be read. Please try again.');
  }
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const key = `admin:${await visitorKey(ip, env.IP_SALT || 'pro-waitlist')}`;
  const now = Date.now();
  await env.DB.prepare('DELETE FROM join_attempts WHERE at < ?1').bind(now - JOIN_WINDOW_MS).run();
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM join_attempts WHERE visitor = ?1').bind(key).first();
  if (Number(row?.n ?? 0) >= JOIN_LIMIT) return adminLogin(429, 'Too many wrong passwords. Please wait an hour.');
  if (!env.EXPORT_TOKEN || !sameSecret(given, env.EXPORT_TOKEN)) {
    await env.DB.prepare('INSERT INTO join_attempts (visitor, at) VALUES (?1, ?2)').bind(key, now).run();
    return adminLogin(401, 'That password is not right.');
  }
  const { results } = await env.DB.prepare('SELECT email, joined_at FROM waitlist ORDER BY joined_at').all();
  const rows = results.map((r) => `<tr><td>${escapeHtml(r.email)}</td><td>${escapeHtml(centralTime(r.joined_at))}</td></tr>`).join('\n');
  const count = results.length;
  return adminPage(200, 'Waitlist', `<h1>Waitlist</h1>
<p>${count} ${count === 1 ? 'person' : 'people'} signed up. Not confirmed: an address here may not belong to the person who typed it.</p>
<table>
<thead><tr><th scope="col">Email</th><th scope="col">Joined</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>`);
}

export default {
  /**
   * @param {Request} request
   * @param {{ DB: D1Database, EXPORT_TOKEN?: string, PRO_PAGE_URL?: string, IP_SALT?: string }} env
   */
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (request.method === 'POST' && pathname === '/join') return join(request, env);
    if (request.method === 'GET' && pathname === '/export') return exportList(request, env);
    if (request.method === 'GET' && pathname === '/admin') return adminLogin(200);
    if (request.method === 'POST' && pathname === '/admin') return adminList(request, env);
    // For npm run pro:local's readiness check; says nothing about the list.
    if (request.method === 'GET' && pathname === '/health') {
      return respond('{"status":"ok","app":"pro-waitlist"}\n', 200, { 'content-type': 'application/json' });
    }
    return respond('Not found\n', 404, { 'content-type': 'text/plain; charset=utf-8' });
  },
};
