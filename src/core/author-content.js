/**
 * author-content.js — what the author wrote between a behavior's tags (#417)
 * ===========================================================================
 *
 * The rule (ATTRIBUTE-NAMING-STANDARD.md, "Primary Value: Content Wins"):
 * a behavior's PRIMARY value can be written two ways --
 *
 *     <span x-badge label="New"></span>      the attribute
 *     <span x-badge>New</span>               the content between the tags
 *
 * -- and when both are given, the CONTENT wins. The attribute is the
 * fallback, used only when there is no author content. Same order #968 set for
 * `content` in schema-builder.js's extractData().
 *
 * "Is there author content" used to be answered three different ways:
 *   - badge() and button.js each carried their own copy of #618's test, which
 *     skips the x-demo doc-link icon (demo.js appends it as a child before the
 *     behavior runs, so a bare textContent check took it for author text);
 *   - chip/input/rating/progress read `_wbOriginalContent || textContent`;
 *   - everything else read `element.textContent.trim()` and nothing more.
 * This module is the one answer they share.
 *
 * Two traps it closes:
 *   1. Not everything inside the host is the author's. The doc-link icon is
 *      the one known case (NOT_AUTHORED); comments and whitespace never count.
 *   2. A behavior that BUILDS children must not read them back as author
 *      content when it runs again on the same element (a re-scan, or remove()
 *      then inject()). authorText() captures the text the FIRST time any
 *      behavior asks -- before anything was built -- and returns that capture
 *      from then on, so the second run sees what the author wrote, not what the
 *      first run made.
 */

/**
 * behavior -> its primary attribute: the behaviors whose content between the
 * tags is that value. The same table as ATTRIBUTE-NAMING-STANDARD.md's
 * "Primary Value: Content Wins" and tests/regression/
 * primary-value-content-wins.spec.ts (which fails when the three differ).
 * scripts/generate-site.mjs reads it: a generated demo that sets this
 * attribute must not also get placeholder children, which would now win.
 */
const CARD_BODIES = ['card', 'cardbutton', 'carddraggable', 'cardexpandable', 'cardfile',
  'cardhero', 'cardhorizontal', 'cardimage', 'cardlink', 'cardminimizable', 'cardoverlay',
  'cardportfolio', 'cardpricing', 'cardproduct', 'cardprofile', 'cardstats', 'cardvideo'];
// WB Pro behaviors (stagelight, confetti, fireworks, snow, typewriter,
// countup) left this table with the move to the pack (#1953).
export const PRIMARY_VALUE_ATTRIBUTE = Object.freeze({
  badge: 'label', pill: 'label', button: 'label', chip: 'label', spinner: 'label',
  checkbox: 'label', switch: 'label', radio: 'label', floatinglabel: 'label',
  print: 'label', share: 'label', fullscreen: 'label', clipboard: 'label', scroll: 'label',
  alert: 'message', empty: 'message', cardnotification: 'message',
  divider: 'text', link: 'text',
  avatar: 'initials',
  stat: 'value', input: 'value', textarea: 'value', progress: 'value', rating: 'value', stepper: 'value',
  cardtestimonial: 'quote',
  ...Object.fromEntries(CARD_BODIES.map((name) => [name, 'content'])),
});

/** Classes of nodes that sit inside a host but were not written by its author. */
const NOT_AUTHORED = ['x-demo__card-doc-link'];

/** Is this child node one the author wrote? Text (blank or not) and any element not on NOT_AUTHORED. */
function isAuthorsNode(node) {
  if (!node) return false;
  if (node.nodeType === 3) return true;
  if (node.nodeType !== 1) return false; // comments, processing instructions
  const cl = /** @type {Element} */ (node).classList;
  return !NOT_AUTHORED.some((c) => cl && cl.contains(c));
}

/**
 * Is this child node author CONTENT? An element the author wrote, or text
 * that is not blank. Whitespace and comments are not content.
 *
 * @param {Node} node
 * @returns {boolean}
 */
export function isAuthoredNode(node) {
  if (!isAuthorsNode(node)) return false;
  return node.nodeType === 1 || (node.textContent || '').trim() !== '';
}

/**
 * The host's authored child nodes, live and in order -- whitespace text
 * between them included, so moving them keeps `<b>A</b> <i>B</i>` spaced.
 * Empty when there is no author content at all.
 *
 * @param {Element} el
 * @returns {Node[]}
 */
export function authoredNodes(el) {
  if (!el || !el.childNodes) return [];
  const nodes = Array.from(el.childNodes).filter(isAuthorsNode);
  return nodes.some(isAuthoredNode) ? nodes : [];
}

/**
 * Does the host hold author content right now? A live check: use it where the
 * behavior's only output is the value itself (a badge's text), so a re-run
 * finding its own earlier output is correct -- it is the same value.
 *
 * @param {Element} el
 * @returns {boolean}
 */
export function hasAuthorContent(el) {
  return authoredNodes(el).length > 0;
}

/**
 * The authored content as markup (rich content: a card body, an alert
 * message). Live; a card guards its own re-entry (composeCard's alreadyBuilt).
 *
 * @param {Element} el
 * @returns {string}
 */
export function authorHTML(el) {
  return authoredNodes(el)
    .map((n) => (n.nodeType === 3 ? escapeText(n.textContent || '') : /** @type {Element} */ (n).outerHTML))
    .join('')
    .trim();
}

function escapeText(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Text of a fragment of markup, through the same authored-node filter. */
function textOfMarkup(markup) {
  if (!markup) return '';
  const tpl = document.createElement('template');
  tpl.innerHTML = String(markup);
  return Array.from(tpl.content.childNodes).filter(isAuthorsNode)
    .map((n) => n.textContent || '').join('').trim();
}

/**
 * The author's text for the primary value, captured once per element.
 *
 * Where it comes from, first match:
 *   1. an earlier capture on this element (`_wbAuthoredText`) -- the re-scan
 *      guard: what a behavior built is never read back as authored;
 *   2. `_wbOriginalContent`, the pre-wipe content schema-builder.js stashes
 *      when it rebuilds a host from $view before the behavior runs;
 *   3. the host's authored child nodes.
 *
 * Kept as a plain JS property, not an attribute (Law 11), the same way
 * schema-builder keeps `_wbOriginalContent`.
 *
 * @param {Element & {_wbAuthoredText?: string, _wbOriginalContent?: string}} el
 * @returns {string}
 */
export function authorText(el) {
  if (!el) return '';
  if (typeof el._wbAuthoredText === 'string') return el._wbAuthoredText;
  const text = el._wbOriginalContent !== undefined
    ? textOfMarkup(el._wbOriginalContent)
    : authoredNodes(el).map((n) => n.textContent || '').join('').trim();
  try { el._wbAuthoredText = text; } catch { /* frozen host: just don't cache */ }
  return text;
}

/**
 * Resolve a primary value: the author's text when there is any, else the
 * attribute's value (or `fallback` when that is absent or empty).
 *
 * @param {Element} el
 * @param {string|null|undefined} attrValue  the attribute, already read
 * @param {string} [fallback='']
 * @returns {string}
 */
export function contentOrAttr(el, attrValue, fallback = '') {
  const text = authorText(el);
  if (text) return text;
  return attrValue != null && attrValue !== '' ? String(attrValue) : fallback;
}
