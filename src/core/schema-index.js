/**
 * schema-index.js -- the site's schema index (data/schema-index.json), loaded
 * once per page and shared by every reader (#1550).
 *
 * The index lists every behavior that HAS a schema, with its properties and
 * baseClass. wb.js reads it to apply declared modifiers (#770, #1147), and
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
  // schemaPath points at src/wb-models; the index sits at the SITE ROOT in
  // data/. Resolving against document.baseURI is only correct for a document
  // that IS at the site root: from public/doc-viewer.html it produced
  // /wb-starter/public/data/schema-index.json -- a 404 -- and the same for every
  // page under pages/, demos/ and articles/ (#1053). So walk up out of the
  // known content directories first, the same rule pages/behaviors.html's
  // siteRoot() uses. Still relative to the document, so it stays correct at
  // "/" and under "/wb-starter/" alike.
  let url;
  try {
    const root = location.pathname.replace(/(?:public|demos|pages|articles|tests\/fixtures)\/.*$/, '');
    url = new URL('data/schema-index.json', new URL(root, location.href)).href;
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
