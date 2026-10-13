/**
 * site-root.js — the URL of the site's root folder, from any page.
 * ================================================================
 *
 * Works from '/', '/demos/x.html', '/demos/site/x.html', '/pages/x.html',
 * '/public/doc-viewer.html' and '/tests/fixtures/x.html', locally or under a
 * GitHub Pages sub-path ('/wb-starter/').
 *
 * Moved here from demo.js so the file card can use it too (a file card's
 * href names a file in the site, and must reach it from every page).
 *
 * #454: 'tests/fixtures' was missing from this list. Pages living there fell
 * through to the fallback below, which only strips the trailing filename, so
 * siteRoot() was '/tests/fixtures/' instead of '/' and every doc link keyed
 * off it broke.
 */
export function siteRoot() {
  const stripped = location.pathname.replace(/(?:public|demos|pages|articles|tests\/fixtures)\/.*$/, '');
  // At the site root the path is a bare 'index.html' with no recognized
  // directory segment for the regex above to match, so it's a no-op there --
  // strip the trailing filename directly, which also covers the GitHub Pages
  // sub-path case ('/wb-starter/index.html').
  return stripped.replace(/[^/]*$/, '');
}

/**
 * A site-relative path ('files/report.pdf') as a URL that works from any
 * page. Anything else -- an absolute URL, a '/'-rooted path, a data: or
 * blob: URL -- is returned unchanged, because it already says where it is.
 */
export function fromSiteRoot(path) {
  const value = String(path || '').trim();
  if (!value || /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(value)) return value;
  return siteRoot() + value.replace(/^\.\//, '');
}
