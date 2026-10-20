/**
 * schema-index.js -- the site's schema index (data/schema-index.json), loaded
 * once per page and shared by every reader (#1550).
 *
 * The index lists every behavior that HAS a schema, with its properties and
 * baseClass. declared-modifiers.js reads it to apply declared modifiers (#770,
 * #1147, #1831), and
 * teach-by-example.js reads it to know whether a schema exists before asking
 * for one: 51 registered behaviors (x-lazy, x-datepicker, x-hotkey, ...) have
 * no *.schema.json, and fetching one by name for each was a 404 plus an
 * ENOENT line in the server log on every page that used them.
 *
 * Loaded lazily, cached, never thrown: a page without the index behaves as if
 * nothing were listed.
 */

let index = null;
let pending = null;

/** The index if it has already arrived (name -> entry), else null. */
export function schemaIndexNow() {
  return index;
}

/**
 * Fetch the index once; every caller shares the one request.
 * @returns {Promise<Record<string, object>>} name -> entry ({} when unavailable)
 */
export function loadSchemaIndex() {
  if (index) return Promise.resolve(index);
  if (pending) return pending;
  if (typeof fetch !== 'function') { index = {}; return Promise.resolve(index); }
  // The index ships beside this module: data/ is two levels up from
  // src/core/, in the repo and in the npm package alike. Resolving against the
  // page instead broke twice: from public/doc-viewer.html and every page under
  // pages/, demos/ and articles/ (#1053), and on any other site that loads
  // wb.js from the package, which asked that site for a file only the package
  // has (#1944). The module's own URL is right in every one of those cases.
  let url;
  try {
    url = new URL('../../data/schema-index.json', import.meta.url).href;
  } catch {
    index = {};
    return Promise.resolve(index);
  }
  pending = fetch(url)
    .then((r) => (r.ok ? r.json() : null))
    .then((idx) => {
      const byName = {};
      for (const sc of (idx && idx.schemas) || []) {
        if (sc && sc.name) byName[sc.name] = sc;
      }
      index = byName;
      return index;
    })
    .catch(() => { index = {}; return index; });
  return pending;
}
