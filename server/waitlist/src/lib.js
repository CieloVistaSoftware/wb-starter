/**
 * The waitlist Worker's helpers and limits (#1961). Kept out of index.js:
 * a Worker's main module may export only handlers, and Cloudflare's runtime
 * refuses a number or array exported beside the default handler.
 */

/** Pages that may send sign-ups. Anything else is refused. */
export const ALLOWED_ORIGINS = [
  'https://cielovistasoftware.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

/** Where "Back to WB Pro" goes when wrangler.toml sets no PRO_PAGE_URL. */
export const DEFAULT_PRO_PAGE = 'https://cielovistasoftware.github.io/';

/** Longest address accepted (RFC 5321 limit). */
export const MAX_EMAIL_LENGTH = 254;

/** Largest form body accepted. A real sign-up is well under 1 KB. */
export const MAX_BODY_BYTES = 2048;

/** Sign-up attempts allowed per visitor per window. */
export const JOIN_LIMIT = 5;

/** The rate-limit window: one hour. */
export const JOIN_WINDOW_MS = 60 * 60 * 1000;

/** One "@", something before it, a dot somewhere after it, no spaces. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Headers on every answer. */
const SECURITY_HEADERS = {
  'cache-control': 'no-store',
  'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
};

/**
 * A Response with the security headers added.
 * @param {BodyInit | null} body
 * @param {number} status
 * @param {Record<string, string>} [headers]
 */
export function respond(body, status, headers = {}) {
  return new Response(body, { status, headers: { ...SECURITY_HEADERS, ...headers } });
}

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
 * Compare two strings in constant time, so a wrong token takes as long to
 * reject as a nearly-right one.
 * @param {string} a
 * @param {string} b
 */
export function sameSecret(a, b) {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  const len = Math.max(x.length, y.length);
  for (let i = 0; i < len; i += 1) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

/**
 * Salted SHA-256 of the visitor's IP address, hex. Only this is stored.
 * @param {string} ip
 * @param {string} salt
 */
export async function visitorKey(ip, salt) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}|${ip}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Escape text for HTML, so nothing a visitor typed is ever run as markup.
 * @param {string} text
 */
export function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

