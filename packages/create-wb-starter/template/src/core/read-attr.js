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
  const plain = kebab(name);
  for (const attr of [plain, name, `data-${plain}`]) {
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
  const plain = kebab(name);
  for (const attr of [plain, name, `data-${plain}`]) {
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

export default { readFlag, readAttr, readNumber };
