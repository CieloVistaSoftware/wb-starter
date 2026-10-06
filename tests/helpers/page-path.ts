/**
 * The address the site gives a page (#1001): `/themes`, `/` for home, and
 * `/?page=docs` for the two pages that share a folder's name. The same
 * function the site uses (src/core/routes.js), so a spec that looks a nav link
 * up by its href follows the site instead of a copy of its rule.
 */
import { pageHref } from '../../src/core/routes.js';

/** A page's href on the test server, which serves the site at its root. */
export function pagePath(page: string, params = ''): string {
  return pageHref(page, params, 'http://localhost/');
}
