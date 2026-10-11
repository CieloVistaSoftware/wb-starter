/**
 * data-attributes.mjs -- the rule behind tests/compliance/no-data-attributes.spec.ts
 * (#224): zero data-* attributes, apart from a closed list of framework state
 * hooks. Shared so that packages/site-migrate checks the page it proposes
 * against the same list and the same pattern (#1832).
 */

// Framework state hooks, NOT wb-*/x-* behavior config. Each was already
// ratified with verified reasoning in demos-no-legacy-data-attrs.spec.ts; this
// list was left empty and so demanded renames that other specs assert against,
// making the pair unsatisfiable (#895). The spec's docstring reserved exactly
// this exemption — it just never propagated here.
//
//   data-theme             set on documentElement, read by darkmode.js, keyed
//                          by 9 stylesheets. Root-element state, not config.
//   data-code-width        CSS attribute-selector hook (x-demo[data-code-width]),
//                          never read by JS. code-panel-width-compliance.spec.ts
//                          and code-panel-50vw-min-width.spec.ts assert this
//                          exact name — renaming regresses them (#550).
//   data-x-expected-errors <html> flag read by error-logger.js.
//                          expected-error-log-suppression.spec.ts asserts this
//                          exact name — renaming regresses it (#550).
//
// Closed list. Behavior CONFIG in data-* form is still a failure; see #895 for
// the per-behavior rename pass that is deliberately not covered here.
export const ALLOWED = new Set([
  'data-theme',
  'data-code-width',
  'data-x-expected-errors',
]);

/**
 * Extract offending data-* names. In HTML/MD, data-* appears as an attribute
 * (`data-x=` — real markup, escaped code samples, or CSS `[data-x=…]` selectors).
 * In JSON it appears either as a declared/name value (`"data-x"`) or inside an
 * embedded markup string (`data-x=`). Prose mentions ("use data-size to…") match
 * neither, so they don't false-positive.
 * @param {string} content
 * @param {boolean} isJson
 * @returns {string[]}
 */
export function offenders(content, isJson) {
  const re = isJson
    ? /"(data-[a-z][a-z0-9-]*)"|\b(data-[a-z][a-z0-9-]*)=/gi
    : /\b(data-[a-z][a-z0-9-]*)(?==)/gi;
  const found = [];
  for (const m of content.matchAll(re)) {
    const name = (m[1] || m[2] || '').toLowerCase();
    if (name && !ALLOWED.has(name)) found.push(name);
  }
  return [...new Set(found)].sort();
}
