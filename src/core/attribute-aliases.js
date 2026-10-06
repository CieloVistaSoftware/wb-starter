/**
 * Copyright (c) CieloVista Software. All rights reserved.
 *
 * THE attribute alias registry. One place, one time.
 *
 * John: "no drifting allowed of any kind, we will allow aliases but they
 * should be in one place one time (defined)."
 *
 * Before this, aliases lived inline in 9 separate schema files. An alias is a
 * promise that two spellings mean the same thing, and a promise repeated in
 * nine places is nine chances to disagree. Everything that resolves an alias --
 * schema-builder's extractData(), the attribute audit, the docs generator --
 * imports THIS module. Nothing keeps its own list.
 *
 * TWO GENERIC RULES COME FIRST -- they are not aliases and must never be
 * written here as if they were:
 *
 *   1. `data-` is transparent. extractData() (schema-builder.js:231) strips a
 *      leading `data-` before building the data key, so `data-lazy` and `lazy`
 *      already arrive as the same key. Declaring `data-lazy` as an alias of
 *      `lazy` documents a duplicate rather than removing one.
 *   2. kebab and camelCase are the same name. extractData() camelCases every
 *      hyphenated attribute, so authored `full-width` reaches a `fullWidth`
 *      property. Both spellings of ONE word are one name, not two.
 *
 * So the only entries below are genuine SYNONYMS: a different word that means
 * the same option, kept because real markup in the wild already uses it.
 */

/**
 * behavior -> canonical property -> [synonyms]
 * Keyed by the schema's `schemaFor`, without the `x-` prefix.
 */
export const ATTRIBUTE_ALIASES = Object.freeze({
  // <div x-alert type="success"> predates variant= and still ships (#176).
  alert: { variant: ['type'] },
  // <button x-drawer drawer-title="…" drawer-content="…"> predates the schema's
  // plain title/content and still ships (demos/playground.html's example set,
  // the create-wb-starter template). overlay.js's drawer() always read them,
  // but the schema build did not, so the schema-built panel opened on its
  // "this is the title"/"this is the content" defaults instead.
  drawer: { title: ['drawer-title', 'heading'], content: ['drawer-content', 'description'] },
});

/**
 * Renamed behaviors: the old attribute name -> the behavior it now runs.
 * Keyed and valued without the `x-` prefix.
 *
 * A rename keeps the old spelling working for pages written against it, but
 * the old name is NOT a second behavior: it has no doc, schema or examples of
 * its own, and the inventories (tag-map.js, the reference docs, the behaviors
 * page) list only the new name. The two loaders read this table directly --
 * wb-lazy.js adds an `[x-old]` selector, wb-viewmodels/index.js registers the
 * old key -- so the alias is written here once and nowhere else.
 */
export const BEHAVIOR_ALIASES = Object.freeze({
  // #668: a highlight.js theme picker; its sync event was already
  // x:codetheme:sync and its tests were already named code-theme-*.
  codecontrol: 'codetheme',
  // #1105: status-coloured text and window dots; "span" named an HTML
  // element no native element maps to.
  span: 'status',
});

/**
 * Synonyms declared for one property. Never includes the `data-`/camelCase
 * variants, which the two generic rules above already cover.
 * @param {string} behavior schemaFor name, with or without the `x-` prefix
 * @param {string} prop canonical property name
 * @returns {string[]}
 */
export function aliasesFor(behavior, prop) {
  const key = String(behavior || '').replace(/^x-/, '');
  return ATTRIBUTE_ALIASES[key]?.[prop] ?? [];
}

/** Every alias spelling registered for a behavior, flattened. */
export function allAliasesFor(behavior) {
  const key = String(behavior || '').replace(/^x-/, '');
  return Object.values(ATTRIBUTE_ALIASES[key] ?? {}).flat();
}

/** Total registered synonyms, for the compliance gate to assert against. */
export function aliasCount() {
  return Object.values(ATTRIBUTE_ALIASES).reduce(
    (n, props) => n + Object.values(props).reduce((m, list) => m + list.length, 0),
    0,
  );
}
