/**
 * Third-party media outage -- a warning on the element, not a page error (#1115)
 * ---------------------------------------------------------------------------
 * Demo media is remote by rule (#762). Every media behavior that fails to load
 * throws, per DEMOS-AND-DOCS §30, so the global error handler logs it. That was
 * right while the files lived here and wrong once they did not: archive.org
 * having a bad minute made audio.js throw, the error landed in data/errors.json,
 * and compliance/error-log-empty + compliance/dark-mode failed together. No
 * release could be cut while someone else's server was down.
 *
 * The page cannot tell "their host is unreachable" from "their URL is wrong" --
 * both arrive as the same MediaError, and a cross-origin response is opaque. What
 * it can always tell is WHOSE server it is. So:
 *
 *   same origin, or not http(s) at all (a relative typo, a malformed src,
 *   a data:/blob: URI)  -> this page's defect: the caller throws, unchanged.
 *
 *   another origin over http(s) -> not a defect in this page. Still reported,
 *   never silently: a [WB:media-unreachable] console warning naming the URL,
 *   error="unreachable" on the element, and a bubbling `wb:media:unreachable`
 *   event. The caller's visible fallback (gradient, "unavailable" message)
 *   still applies.
 *
 * This is the same line error-logger.js's resource handler already draws for
 * failed <img>/<script> loads ("SAME-ORIGIN ONLY"), applied at the behaviors that
 * throw their own errors and therefore never reached that check.
 */

/**
 * True when `src` is fetched over http(s) from an origin other than this page's.
 * Anything unparseable or non-http(s) is NOT third-party -- it is authored here.
 */
export function isThirdPartyMedia(src) {
  if (!src || typeof location === 'undefined') return false;
  let url;
  try {
    url = new URL(String(src), document.baseURI);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  return url.origin !== location.origin;
}

/**
 * Report a failed media load that belongs to someone else's server.
 *
 * Returns TRUE when every url in `srcs` is third-party: the failure has been
 * reported here and the caller must NOT throw. Returns FALSE (and does nothing)
 * when any of them is this page's own -- the caller throws as it always has.
 *
 * @param {Element} el       The element whose media failed; receives error="unreachable".
 * @param {string|string[]} srcs  Every url that failed (e.g. an image AND its fallback).
 * @param {string} label     Who is reporting, e.g. "x-audio".
 * @returns {boolean}
 */
export function reportIfThirdPartyMedia(el, srcs, label) {
  const list = (Array.isArray(srcs) ? srcs : [srcs]).filter(Boolean);
  if (!list.length || !list.every(isThirdPartyMedia)) return false;

  const src = list[list.length - 1];
  console.warn(
    `[WB:media-unreachable] ${label}: ${list.join(' and ')} did not load -- ` +
    `a third-party host this page does not control is unreachable, or the URL is wrong. ` +
    `Not logged as a page error (#1115).`
  );
  if (el && el.setAttribute) {
    el.setAttribute('error', 'unreachable');
    el.dispatchEvent(new CustomEvent('wb:media:unreachable', {
      bubbles: true,
      detail: { src, srcs: list, label },
    }));
  }
  return true;
}

export default { isThirdPartyMedia, reportIfThirdPartyMedia };
