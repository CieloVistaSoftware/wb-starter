/**
 * Does this markup reach a behavior? One answer, read from the registry (#1169).
 * -----------------------------------------------------------------------------
 * The doc viewer asks it twice, and asked it wrong both times:
 *
 *   - mdhtml.js decides whether an ```html fence is shown LIVE (promoted to a
 *     <div x-demo>) or left as read-only text;
 *   - public/doc-viewer.html decides whether a rendered doc needs the runtime
 *     at all.
 *
 * Each kept its own copy of the same test: "a tag that starts with wb-, or an
 * attribute that starts with x-". Both halves were the pre-4.0.0 contract. 4.0.0
 * (f624fcc9) retired every wb- tag and made the SEMANTIC ELEMENT the behavior
 * (<article> IS a card, <details> IS the details behavior), so the wb- half
 * matched nothing and the semantic half was never added. A doc example written
 * the way DEMOS-AND-DOCS-STANDARDS section 32 says to write it -- plain
 * semantic HTML, no x- attribute -- was never shown working.
 *
 * The answer lives in the registries the runtime itself dispatches on, so it is
 * read from them here and nowhere else:
 *
 *   - tag-map.js nativeMap           a tag (or tag[attr="value"]) that IS a
 *                                    behavior, e.g. details, input[type="range"]
 *   - tag-map.js extensionMap        x-name -> behavior
 *   - wb-viewmodels/index.js         behaviorModules: every behavior that can
 *                                    load. `x-{name}` reaches `name` when the
 *                                    module exists -- the rule wb-lazy.js's
 *                                    knownBehaviorAttributes() applies too.
 *   - semantic-attributes.js         plain property attributes that attach a
 *                                    behavior (tooltip=, badge=, ripple, ...)
 *   - x-behavior="a b"               the generic dispatch attribute
 *
 * Pure: no DOM needed. The same decision runs in the browser (on elements) and
 * in Node (on text, for the regression specs), so the specs test the function
 * the viewer calls instead of a lookalike of it.
 */
import { nativeMap, extensionMap } from './tag-map.js';
import { resolveBehaviorName } from '../wb-viewmodels/index.js';
import { SEMANTIC_PROPERTY_ATTRIBUTES } from './semantic-attributes.js';
import { DIRECTIVES } from './replacement-guard.js';

/** x-{name} for a runtime switch (x-ignore, x-eager, ...), not a behavior. */
const isDirective = (name) => name.startsWith('x-') && DIRECTIVES.has(name.slice(2)) && name !== 'x-behavior';

// nativeMap keys are `tag` or `tag[attr="value"]`. Parsed once, here, so the
// match below never needs Element.matches() and works on text in Node too.
const NATIVE_SELECTOR = /^([a-z][a-z0-9-]*)(?:\[([a-z][a-z0-9-]*)="([^"]*)"\])?$/;

/** nativeMap selectors this reader cannot parse. The spec asserts it is empty. */
export const UNREADABLE_NATIVE_SELECTORS = [];

const NATIVE = Object.entries(nativeMap).flatMap(([selector, behavior]) => {
  const m = selector.match(NATIVE_SELECTOR);
  if (!m) {
    UNREADABLE_NATIVE_SELECTORS.push(selector);
    return [];
  }
  return [{ tag: m[1], attr: m[2] || null, value: m[3] ?? null, behavior }];
});

/** Normalize an attribute bag: a Map, a plain object, or a NamedNodeMap. */
function attributeMap(attrs) {
  const out = new Map();
  if (!attrs) return out;
  if (typeof attrs.length === 'number' && typeof attrs.item === 'function') {
    for (const a of Array.from(attrs)) out.set(a.name.toLowerCase(), a.value);
    return out;
  }
  const entries = attrs instanceof Map ? attrs.entries() : Object.entries(attrs);
  for (const [k, v] of entries) out.set(String(k).toLowerCase(), v == null ? '' : String(v));
  return out;
}

/**
 * The behavior an element's tag (and type-like attribute) implies through
 * nativeMap, or null. First match wins, as getNativeBehavior() does.
 * @param {string} tag
 * @param {Map<string,string>|Object|NamedNodeMap} [attrs]
 * @returns {string|null}
 */
export function nativeBehaviorFor(tag, attrs) {
  const t = String(tag || '').toLowerCase();
  const a = attributeMap(attrs);
  for (const n of NATIVE) {
    if (n.tag !== t) continue;
    if (n.attr && String(a.get(n.attr) ?? '').toLowerCase() !== n.value.toLowerCase()) continue;
    return n.behavior;
  }
  return null;
}

/**
 * The behaviors one attribute reaches (usually zero or one; x-behavior can
 * name several).
 * @param {string} name
 * @param {string} [value]
 * @returns {string[]}
 */
export function attributeBehaviorsFor(name, value = '') {
  const n = String(name || '').toLowerCase();
  if (isDirective(n)) return [];
  if (n === 'x-behavior') {
    return String(value || '').split(/\s+/).map(resolveBehaviorName).filter(Boolean);
  }
  if (typeof extensionMap[n] === 'string') return [extensionMap[n]];
  // resolveBehaviorName folds case: the parser has lowercased the name (#1195).
  if (n.startsWith('x-') && resolveBehaviorName(n.slice(2))) return [resolveBehaviorName(n.slice(2))];
  if (typeof SEMANTIC_PROPERTY_ATTRIBUTES[n] === 'string') return [SEMANTIC_PROPERTY_ATTRIBUTES[n]];
  return [];
}

/**
 * Every behavior one element reaches. `x-ignore` declines the native one (the
 * element keeps its tag and loses its implied behavior); explicit attributes
 * still count, because the runtime still honours them.
 * @param {{tag: string, attrs?: Map<string,string>|Object|NamedNodeMap}} el
 * @returns {string[]}
 */
export function elementBehaviors({ tag, attrs }) {
  const a = attributeMap(attrs);
  const out = [];
  if (!a.has('x-ignore')) {
    const native = nativeBehaviorFor(tag, a);
    if (native) out.push(native);
  }
  for (const [name, value] of a) out.push(...attributeBehaviorsFor(name, value));
  return [...new Set(out)];
}

/**
 * The x- attributes on this element that name the behavior its own tag (or
 * type) already implies: <details x-details>, <input type="password"
 * x-password>. Section 32 of DEMOS-AND-DOCS-STANDARDS and #1141: the element
 * is the behavior, and the redundant attribute can suppress it (#746).
 * @param {{tag: string, attrs?: Map<string,string>|Object|NamedNodeMap}} el
 * @returns {string[]} attribute names
 */
export function redundantAttributes({ tag, attrs }) {
  const a = attributeMap(attrs);
  if (a.has('x-ignore')) return [];
  const native = nativeBehaviorFor(tag, a);
  if (!native) return [];
  return [...a.keys()].filter((name) => name.startsWith('x-') && name !== 'x-behavior'
    && attributeBehaviorsFor(name, a.get(name)).includes(native));
}

/**
 * True if this element reaches any behavior. Takes a DOM Element or a
 * `{ tag, attrs }` description of one.
 */
export function reachesBehavior(el) {
  if (!el) return false;
  if (el.nodeType === 1) return elementBehaviors({ tag: el.localName || el.tagName, attrs: el.attributes }).length > 0;
  return elementBehaviors(el).length > 0;
}

const COMMENT = /<!--[\s\S]*?-->/g;
// Raw-text and inert content: nothing inside is an element the runtime sees.
const RAW_TEXT = /<(script|style|textarea|template)\b([^>]*)>[\s\S]*?<\/\1\s*>/gi;
const START_TAG = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>]+))?)*)\s*\/?>/g;
const ATTRIBUTE = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+)))?/g;

/**
 * Start tags in an HTML string, as `{ tag, attrs, index }`. Comments and the
 * bodies of script/style/textarea/template are skipped, as a parser would.
 * @param {string} html
 */
export function startTags(html) {
  const text = String(html || '')
    .replace(COMMENT, (s) => ' '.repeat(s.length))
    .replace(RAW_TEXT, (s, tag, attrs) => {
      const open = `<${tag}${attrs}>`;
      return open + ' '.repeat(Math.max(0, s.length - open.length));
    });
  const out = [];
  for (const m of text.matchAll(START_TAG)) {
    const attrs = new Map();
    for (const a of (m[2] || '').matchAll(ATTRIBUTE)) {
      attrs.set(a[1].toLowerCase(), a[2] ?? a[3] ?? a[4] ?? '');
    }
    out.push({ tag: m[1].toLowerCase(), attrs, index: m.index });
  }
  return out;
}

/** True if any element in this HTML string reaches a behavior. */
export function markupReachesBehavior(html) {
  return startTags(html).some((t) => reachesBehavior(t));
}

// Document-level tags mark a whole-file illustration ("here is your
// index.html"), not a snippet. Rendering one live instantiates its <link> and
// <script> tags against the viewer's own location (V3-GUIDE.md's
// <link href="src/styles/themes.css"> 404'd at /public/src/styles/themes.css).
const DOCUMENT_LEVEL = /<\s*(!doctype|html|head|body)\b/i;

/**
 * Fence languages that mean "illustration: highlight it, never run it" (#1197),
 * mapped to the language they are highlighted as.
 *
 * BAD / WRONG markup, "DOM becomes" output and a fence quoted inside a fence
 * are written in html fences so they read as HTML, and markup that reaches a
 * behavior is rendered live. Before #1169 such blocks stayed text by accident
 * (they had no x- attribute); once a semantic tag counts, they need a marker
 * that says what the author meant. One hyphenated word, because marked keeps
 * only the first word of the info string: html-static becomes
 * class="language-html-static". Documented in docs/code-examples-standard.md
 * Rule 4 and DEMOS-AND-DOCS-STANDARDS section 1.
 */
export const ILLUSTRATION_LANGUAGES = Object.freeze({ 'html-static': 'html' });

/** The language a fence is highlighted as: html-static -> html, else itself. */
export function highlightLanguage(language) {
  const lang = String(language || '').toLowerCase();
  return ILLUSTRATION_LANGUAGES[lang] || lang;
}

/**
 * Is this code example shown LIVE? The one decision the doc viewer makes for
 * every fence.
 *
 * @param {{ language?: string, source: string }} example
 *   language: the fence's language ('' when the fence has none)
 * @returns {boolean}
 */
export function isLiveExample({ language = '', source = '' }) {
  const lang = String(language || '').toLowerCase();
  if (lang in ILLUSTRATION_LANGUAGES) return false;   // the author said: never run this
  const isHtml = lang === 'html' || (lang === '' && /^\s*</.test(source));
  if (!isHtml) return false;
  if (DOCUMENT_LEVEL.test(source)) return false;
  return markupReachesBehavior(source);
}
