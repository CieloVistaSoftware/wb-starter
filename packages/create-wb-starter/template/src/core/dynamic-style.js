/**
 * Generated stylesheet rules for values only known at runtime (#779).
 * -----------------------------------------------------------------------------
 * The standard is "no inline styles anywhere" -- tests/regression/
 * no-inline-styles.spec.ts counts every write to `element.style`, custom
 * properties included, because each one ends up in the element's style
 * attribute, where it beats every stylesheet rule and every theme.
 *
 * Static appearance belongs in the behavior's stylesheet, keyed to a class.
 * That leaves the values nobody can write in advance: a width the author typed
 * into an attribute, a measured height, a drag position. For those the spec
 * names the route: "a COMPUTED value belongs in a generated stylesheet rule
 * (CSSStyleSheet.insertRule / adoptedStyleSheets) rather than on the element".
 * This module is that route, in ONE place, so behaviors do not each grow their
 * own copy.
 *
 * HOW
 *
 *   setRule(el, 'size', { width: '240px' })
 *
 * turns the declarations into a rule `[data-x-style~="xs<hash>"] { width: 240px }`
 * inside a constructed stylesheet adopted by the document, and adds the token
 * to the element's `data-x-style` attribute. The element carries a name, never
 * a declaration.
 *
 *   - Identical declarations share one rule (the token is a hash of the text),
 *     so a hundred cards with gap="1rem" add one rule, not a hundred.
 *   - A `slot` lets one element hold several independent values; setting a
 *     slot again replaces that slot's token, and a rule nobody references any
 *     more is deleted, so a drag that produces a thousand positions does not
 *     leave a thousand rules behind.
 *   - Passing null / an empty object clears the slot.
 *
 * WHY adoptedStyleSheets AND NOT A <style> ELEMENT
 *
 * A constructed sheet belongs to the Document object, not to <head>. Tests (and
 * any SPA navigation) that rewrite <head> -- page.setContent() does -- would
 * silently delete a <style> element and with it every runtime value. The
 * <style> path remains only as a fallback for engines without constructable
 * stylesheets.
 *
 * CASCADE
 *
 * Adopted sheets come after the document's own sheets, so a generated rule
 * beats a stylesheet rule of equal specificity (one class / one attribute) --
 * which is what the runtime value is for -- while a theme can still reach it
 * with a more specific rule, which an inline declaration never allowed.
 *
 * Where the behavior's OWN stylesheet sets the same property through a
 * compound selector (`.x-notes--modal .x-notes__drawer`, 0,2,0) the runtime
 * value has to outrank it, so setRule takes a `weight`: the attribute
 * selector repeated that many times (weight 2 = 0,2,0, and later in the
 * cascade). It is the smallest bump that wins, stated at the call site.
 */

const ATTR = 'data-x-style';

/** @type {CSSStyleSheet|null} */
let sheet = null;
/** @type {HTMLStyleElement|null} */
let fallbackEl = null;

/** token -> number of (element, slot) pairs currently using it */
const refs = new Map();
/** element -> Map(slot -> token) */
const slots = new WeakMap();

function getSheet() {
  if (typeof document === 'undefined') return null;
  if (sheet) {
    // Re-adopt if something replaced the document's adopted list.
    if (!fallbackEl && 'adoptedStyleSheets' in document
      && !document.adoptedStyleSheets.includes(sheet)) {
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    }
    if (fallbackEl && !fallbackEl.isConnected) {
      (document.head || document.documentElement).appendChild(fallbackEl);
      sheet = fallbackEl.sheet;
      // The rules died with the detached element; rebuild the ones in use.
      rebuildAll();
    }
    return sheet;
  }
  try {
    // Through globalThis: a browser global the lint environment does not
    // declare. Absent (older engine) -> TypeError -> the <style> fallback.
    sheet = new globalThis.CSSStyleSheet();
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  } catch {
    fallbackEl = document.createElement('style');
    fallbackEl.setAttribute('data-x-dynamic-style', '');
    (document.head || document.documentElement).appendChild(fallbackEl);
    sheet = fallbackEl.sheet;
  }
  return sheet;
}

/** token -> declaration text, so the fallback sheet can be rebuilt */
const texts = new Map();

function rebuildAll() {
  if (!sheet) return;
  for (const [token, text] of texts) insert(token, text);
}

/** token -> selector weight (how many times the attribute selector repeats) */
const weights = new Map();

function selectorFor(token) {
  return `[${ATTR}~="${token}"]`.repeat(weights.get(token) || 1);
}

function insert(token, text) {
  const s = sheet;
  if (!s) return;
  try {
    s.insertRule(`${selectorFor(token)}{${text}}`, s.cssRules.length);
  } catch {
    // An invalid declaration list is dropped, exactly as the browser would
    // have dropped it from a style attribute.
  }
}

function remove(token) {
  const s = sheet;
  if (!s) return;
  const sel = selectorFor(token);
  for (let i = s.cssRules.length - 1; i >= 0; i--) {
    const rule = /** @type {CSSStyleRule} */ (s.cssRules[i]);
    if (rule.selectorText === sel) s.deleteRule(i);
  }
}

/** camelCase -> kebab-case; custom properties pass through untouched. */
function kebab(prop) {
  if (prop.startsWith('--')) return prop;
  return prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
}

/**
 * @param {Record<string, string|number|null|undefined>|string|null|undefined} decls
 * @returns {string}
 */
function toText(decls) {
  if (!decls) return '';
  if (typeof decls === 'string') return decls.trim();
  return Object.entries(decls)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${kebab(k)}:${v}`)
    .join(';');
}

function hash(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return 'xs' + (h >>> 0).toString(36);
}

function release(token) {
  const n = (refs.get(token) || 0) - 1;
  if (n > 0) { refs.set(token, n); return; }
  refs.delete(token);
  texts.delete(token);
  remove(token);
  weights.delete(token);
}

function writeTokens(el, map) {
  const list = [...map.values()];
  if (list.length) el.setAttribute(ATTR, list.join(' '));
  else el.removeAttribute(ATTR);
}

/**
 * Give `el` a runtime value through a generated rule instead of its style
 * attribute.
 *
 * @param {Element} el
 * @param {string} slot - independent channel on this element (e.g. 'size', 'position')
 * @param {Record<string, string|number|null|undefined>|string|null|undefined} decls
 *        - `{ width: '240px', '--x-ratio': '16/9' }` or 'width:240px'. Empty clears.
 * @param {{ weight?: number }} [opts] - weight: see CASCADE above (default 1).
 */
export function setRule(el, slot, decls, opts = {}) {
  if (!el || typeof document === 'undefined') return;
  const text = toText(decls);
  const weight = Math.max(1, Math.floor(opts.weight || 1));
  let map = slots.get(el);
  const prev = map ? map.get(slot) : undefined;
  const token = text ? hash(`${weight}|${text}`) : undefined;
  if (prev === token) return;

  if (token) {
    if (!refs.has(token)) {
      getSheet();
      texts.set(token, text);
      weights.set(token, weight);
      insert(token, text);
    } else {
      getSheet();
    }
    refs.set(token, (refs.get(token) || 0) + 1);
  }
  if (!map) { map = new Map(); slots.set(el, map); }
  if (token) map.set(slot, token); else map.delete(slot);
  writeTokens(el, map);
  if (prev) release(prev);
}

/**
 * Drop every generated value on `el` (teardown).
 * @param {Element} el
 */
export function clearRules(el) {
  const map = el && slots.get(el);
  if (!map) return;
  const tokens = [...map.values()];
  map.clear();
  el.removeAttribute(ATTR);
  for (const t of tokens) release(t);
}

/**
 * clearRules() for `root` and every descendant that carries a generated value
 * -- for a container of runtime-built children (particles, rows) about to be
 * removed, so its rules are released with it rather than left in the sheet.
 * @param {Element} root
 */
export function clearRulesIn(root) {
  if (!root) return;
  clearRules(root);
  if (root.querySelectorAll) root.querySelectorAll(`[${ATTR}]`).forEach((el) => clearRules(el));
}

/**
 * The entries of `values` that are set and differ from `defaults`.
 *
 * A behavior's defaults live in its stylesheet. Re-stating a default in a
 * generated rule would pin it at that rule's specificity and order, which is
 * how a theme gets locked out of a value nobody asked to set (#779's
 * `--glow-color` example). So only what the author actually changed travels.
 *
 * @param {Record<string, any>} values
 * @param {Record<string, any>} [defaults]
 * @returns {Record<string, any>}
 */
export function onlyChanged(values, defaults = {}) {
  /** @type {Record<string, any>} */
  const out = {};
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined || v === null || v === '') continue;
    if (Object.prototype.hasOwnProperty.call(defaults, k) && String(defaults[k]) === String(v)) continue;
    out[k] = v;
  }
  return out;
}
