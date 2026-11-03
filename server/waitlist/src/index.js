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
 */

/** Pages that may send sign-ups. Anything else is refused. */
export const ALLOWED_ORIGINS = [
  'https://cielovistasoftware.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

/** Where "Back to WB Pro" goes when wrangler.toml sets no PRO_PAGE_URL. */
const DEFAULT_PRO_PAGE = 'https://cielovistasoftware.github.io/';

/** Longest address accepted (RFC 5321 limit). */
const MAX_EMAIL_LENGTH = 254;

/** One "@", something before it, a dot somewhere after it, no spaces. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Lower-cased and trimmed address, or null when it is not one we accept.
 * @param {unknown} value
 * @returns {string | null}
 */
export function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length === 0 || email.length > MAX_EMAIL_LENGTH) return null;
  return EMAIL_PATTERN.test(email) ? email : null;
}

/**
 * Escape text for HTML, so nothing a visitor typed is ever run as markup.
 * @param {string} text
 */
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

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
  return new Response(html, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

/**
 * Handle a sign-up.
 * @param {Request} request
 * @param {{ DB: D1Database, PRO_PAGE_URL?: string }} env
 */
async function join(request, env) {
  const answer = (status, heading, message) => page(status, heading, message, env.PRO_PAGE_URL);
  const origin = request.headers.get('origin');
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return answer(403, 'Not accepted', 'Sign-ups are only taken from the WB Pro page.');
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return answer(400, 'Something went wrong', 'The form could not be read. Please try again.');
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
  const expected = env.EXPORT_TOKEN ? `Bearer ${env.EXPORT_TOKEN}` : null;
  if (!expected || request.headers.get('authorization') !== expected) {
    return new Response('Not allowed\n', { status: 401 });
  }
  const { results } = await env.DB
    .prepare('SELECT email, joined_at FROM waitlist ORDER BY joined_at')
    .all();
  const rows = ['email,joined_at', ...results.map((row) => `${row.email},${row.joined_at}`)];
  return new Response(rows.join('\n') + '\n', {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="pro-waitlist.csv"' },
  });
}

export default {
  /**
   * @param {Request} request
   * @param {{ DB: D1Database, EXPORT_TOKEN?: string, PRO_PAGE_URL?: string }} env
   */
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (request.method === 'POST' && pathname === '/join') return join(request, env);
    if (request.method === 'GET' && pathname === '/export') return exportList(request, env);
    return new Response('Not found\n', { status: 404 });
  },
};
