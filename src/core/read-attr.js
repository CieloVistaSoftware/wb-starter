/**
 * read-attr.js — one reader for author-facing attributes (#752)
 *
 * Behaviors used to read only the `data-*` spelling while every schema, doc
 * and example taught the plain one, so the documented markup silently did
 * nothing. It shipped four separate times before anyone connected them:
 *
 *   #697  <fieldset collapsible>       ignored
 *   #751  <form ajax>                  ignored — submitting did nothing at all
 *   #752  <fieldset collapsible>       ignored again, different file
 *   #754  <input size="lg">            ignored
 *
 * and it is still why several navbar/details/tabs/header/footer specs fail on
 * bare `sticky` and `variant`.
 *
 * Each of those was fixed where it was reported. This is the reader they
 * should all have shared, so the class closes instead of the next instance.
 *
 * Precedence, highest first:
 *   1. an explicit value passed in options (programmatic use wins)
 *   2. the plain attribute            — `collapsible`, `size="lg"`
 *   3. the data-* attribute           — `data-collapsible`, `data-size="lg"`
 *
 * `"false"` and `"0"` read as FALSE for flags. A bare `hasAttribute()` check
 * treats `collapsible="false"` as ON, which is the opposite of what the markup
 * says — the #747 trap, where `showclose="false"` still showed the control.
 *
 * Parsing the value is only half of it. The attribute has to be FOUND, and
 * which spellings get looked up used to depend on the name the CALLER passed:
 * reading under `'show-close'` never saw `showClose`. See `spellings()`.
 */

/** `iconPosition` → `icon-position`; `size` → `size`. */
function kebab(name) {
  return name.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
}

/** `icon-position` → `iconPosition`, for dataset lookups. */
function camel(name) {
  return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Every attribute spelling that counts as `name`, highest precedence first.
 *
 * The camelCase spelling is in this list because the NAME a behavior passed in
 * decided which markup it could see. `readFlag(el, 'show-close')` looked up
 * `show-close` and `data-show-close` and never `showClose` — so
 * `<dialog showClose="false">`, the spelling dialog.schema.json declares and
 * ATTRIBUTE-NAMING-STANDARD.md calls canonical (#1125), matched nothing, fell
 * back to the default and turned the close button ON. That is the half of the
 * #747 trap nobody had named: `"false"` parsing as false is no use until the
 * attribute is FOUND. Reading under either spelling now finds either markup,
 * so a behavior still calling with a dashed name is correct too and no page
 * already written breaks.
 *
 * `hasAttribute`/`getAttribute` lower-case their argument on an HTML element,
 * so `showClose` here matches the `showclose` the parser actually stored.
 */
function spellings(name) {
  const plain = kebab(name);
  return [...new Set([plain, name, camel(name), `data-${plain}`])];
}

/**
 * `el.getAttribute(name)` for a multi-word attribute, under either spelling:
 * the raw value of `icon-position` or `iconPosition`, or null when neither is
 * authored.
 *
 * #1125: 110 option reads called `getAttribute('icon-position')` directly.
 * HTML stores the canonical `iconPosition` as `iconposition`, so those reads
 * never saw it and the default won with no error (#1124's six identical
 * hero headings). readAttr() would have found it, but it also changes what
 * an empty value and an absent one return, and reads `data-*`, which those
 * call sites did not. This keeps getAttribute's exact contract -- null when
 * absent, `""` when bare -- and adds only the camelCase spelling, so each
 * call site could switch without its own logic changing.
 *
 * @param {Element} el
 * @param {string} name  either spelling (`icon-position`, `iconPosition`)
 * @returns {string|null}
 */
export function authoredAttr(el, name) {
  if (!el || !el.getAttribute) return null;
  for (const attr of new Set([kebab(name), camel(name)])) {
    if (el.hasAttribute(attr)) return el.getAttribute(attr);
  }
  return null;
}

/**
 * Is this attribute authored at all, under any accepted spelling?
 *
 * Presence only — the VALUE is never consulted, so `modal-title=""` counts.
 * Use it where an author's having supplied an attribute is itself the
 * question (dialog's trigger-vs-definition gate), never to read a flag: a
 * flag's value is what decides, and `readFlag` is what parses it (#747).
 *
 * @param {Element} el
 * @param {string} name
 * @returns {boolean}
 */
export function hasAuthoredAttr(el, name) {
  if (!el || !el.hasAttribute) return false;
  return spellings(name).some((attr) => el.hasAttribute(attr));
}

/**
 * Read a boolean attribute. Present with no value is true; `"false"`/`"0"` is
 * false; absent falls back to `fallback`.
 *
 * @param {Element} el
 * @param {string} name  plain attribute name (`collapsible`, `iconOnly`)
 * @param {boolean} [fallback=false]
 * @returns {boolean}
 */
export function readFlag(el, name, fallback = false) {
  if (!el || !el.getAttribute) return fallback;
  for (const attr of spellings(name)) {
    if (!el.hasAttribute(attr)) continue;
    const v = el.getAttribute(attr);
    // A bare attribute (`collapsible`) has the empty string as its value.
    if (v === 'false' || v === '0') return false;
    return true;
  }
  return fallback;
}

/**
 * Read a string attribute.
 *
 * @param {Element} el
 * @param {string} name  plain attribute name (`size`, `iconPosition`)
 * @param {string} [fallback='']
 * @returns {string}
 */
export function readAttr(el, name, fallback = '') {
  if (!el || !el.getAttribute) return fallback;
  for (const attr of spellings(name)) {
    const v = el.getAttribute(attr);
    if (v !== null && v !== '') return v;
  }
  // dataset covers `data-icon-position` reached as `iconPosition`, which is
  // how much of the existing code spells it.
  const ds = el.dataset && el.dataset[camel(name)];
  return ds !== undefined && ds !== '' ? ds : fallback;
}

/**
 * Read a numeric attribute. Returns `fallback` when absent or unparseable —
 * never NaN, which silently poisons any arithmetic downstream.
 *
 * @param {Element} el
 * @param {string} name
 * @param {number} [fallback=0]
 * @returns {number}
 */
export function readNumber(el, name, fallback = 0) {
  const raw = readAttr(el, name, '');
  if (raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Read a string option a behavior accepts from its options object OR the
 * element: `options[name]`, then readAttr(), then the literal attribute.
 *
 * #883: card.js and layouts.js spelled this out by hand ~150 times as
 * `options.x || readAttr(element, 'x') || element.getAttribute('x')`, the
 * single largest source of the duplicate clusters the code audit found. This
 * is that exact expression, so a caller's `|| 'default'` keeps working and an
 * absent value still comes back as `null`, as it did inline.
 *
 * @param {Element} el
 * @param {object} options  the behavior's options object
 * @param {string} name     option / plain attribute name (`maxWidth`)
 * @param {string} [attr]   literal attribute for the last lookup; defaults
 *                          to the kebab spelling (`max-width`)
 * @returns {*}
 */
export function readOption(el, options, name, attr = kebab(name)) {
  return options[name] || readAttr(el, name) || el.getAttribute(attr);
}

export default { readFlag, readAttr, readNumber, readOption, hasAuthoredAttr, authoredAttr };
