/**
 * Real paths for the site's pages (#1001, #957).
 *
 * John: "I want regular routing for navigation pull out the pages thing" --
 * routing should look like `http://home/route`. Every page used to live at
 * `/?page=<name>`; now it lives at `/<name>`, and the old form still works
 * (bookmarks, issue links, the 44 content links that carry it) and is
 * rewritten to the path.
 *
 * The site root is where this file's site lives, read from its own URL, so the
 * same code works at `/` locally and at `/wb-starter/` on GitHub Pages, where
 * 404.html serves the shell for any path the site has no file for.
 *
 * Pure functions over URLs; no DOM.
 */

/** The site root: two folders up from src/core/routes.js. */
export const SITE_ROOT = new URL('../../', import.meta.url);

/** A page id: what pages/<id>.html can be named. */
const PAGE_ID = /^[a-z0-9][a-z0-9-]*$/i;

/**
 * Pages whose name is also a real folder of the site (demos/ has its own
 * index.html; docs/ holds the markdown). On GitHub Pages /demos serves that
 * folder, not the page, so these two keep the ?page= address.
 * tests/regression/pages-have-real-paths.spec.ts fails if another page gains
 * a folder of the same name.
 */
export const FOLDER_PAGES = new Set(['demos', 'docs']);

/**
 * The page a URL names, or null for a path that is not a page.
 *
 * @param {string|URL} url
 * @param {string|URL} [root]
 * @returns {{ page: string|null, legacy: boolean, path: string }}
 *   `legacy` when it came from ?page= (so the caller rewrites the URL);
 *   `path` is the URL's path below the root, for a not-found message.
 */
export function pageFromUrl(url, root = SITE_ROOT) {
  const u = new URL(String(url), String(root));
  const fromQuery = u.searchParams.get('page');
  if (fromQuery !== null) {
    return { page: PAGE_ID.test(fromQuery) ? fromQuery : null, legacy: true, path: fromQuery };
  }
  const rootPath = new URL(String(root)).pathname;
  let rest = u.pathname.startsWith(rootPath) ? u.pathname.slice(rootPath.length) : u.pathname.replace(/^\//, '');
  rest = decodeURIComponent(rest).replace(/\/+$/, '');
  if (rest === '' || rest === 'index.html' || rest === '404.html') return { page: 'home', legacy: false, path: '' };
  return { page: PAGE_ID.test(rest) ? rest : null, legacy: false, path: rest };
}

/**
 * The address of a page: `/<root>/<page>`, or the root itself for home. Any
 * other query parameters (`file=`, `section=`) come along.
 *
 * @param {string} page
 * @param {URLSearchParams|string} [params]
 * @param {string|URL} [root]
 * @returns {string} a root-relative path
 */
export function pageHref(page, params = '', root = SITE_ROOT) {
  const rootPath = new URL(String(root)).pathname;
  const search = new URLSearchParams(params);
  search.delete('page');
  if (FOLDER_PAGES.has(page)) search.set('page', page);
  const query = search.toString();
  const path = page === 'home' || FOLDER_PAGES.has(page) ? '' : page;
  return `${rootPath}${path}${query ? `?${query}` : ''}`;
}

/**
 * Is this link one of the site's own pages, by path or by ?page=? Links to
 * files (an extension), other origins, anchors and the API are not.
 *
 * @param {string|URL} url resolved link URL
 * @param {string|URL} [root]
 * @returns {boolean}
 */
export function isPageLink(url, root = SITE_ROOT) {
  const u = new URL(String(url), String(root));
  const r = new URL(String(root));
  if (u.origin !== r.origin || !u.pathname.startsWith(r.pathname)) return false;
  if (u.searchParams.has('page')) return true;
  const rest = u.pathname.slice(r.pathname.length).replace(/\/+$/, '');
  if (rest === '' ) return u.search === '' ;
  return PAGE_ID.test(rest);
}
