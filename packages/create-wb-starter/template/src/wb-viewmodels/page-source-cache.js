/**
 * Shared "pristine page source" cache.
 * -----------------------------------------------------------------------------
 * Several behaviors (demo, mdhtml) need the ORIGINAL, as-authored HTML of an
 * element they're attached to — not its live innerHTML, which by the time an
 * async behavior runs may already have been mutated by WB scanning/enhancing
 * nested elements (e.g. a `<div x-gallery>` embedded inside a `<div x-mdhtml>`
 * code sample). Fetching the page's own source over the network sidesteps
 * that race entirely: it's always the pristine authored text, independent of
 * any DOM mutation that's happened since parse time.
 * -----------------------------------------------------------------------------
 */

let _pageSource = null;
let _pageSourcePromise = null;

// #580: <div x-demo>/<div x-mdhtml> callers below match themselves against this
// source by ORDINAL POSITION -- "I'm the Nth <div x-mdhtml> in the live DOM, so
// give me the Nth <div x-mdhtml>...</div> block in the source text". That
// only holds if "occurrences in the raw text" and "elements in the live DOM"
// count the same tags. They don't when a <template x-view="..."> holds one
// of these tags as part of its OWN template markup (wb-views.js's DOM
// templates commonly do -- e.g. demos/wb-views-demo.html's
// `<template x-view="example-block">` embeds a literal
// `<div x-mdhtml>{{code}}</div>` as the placeholder every rendered
// instance is built from). A <template>'s content is inert: the browser
// never parses it into the live document tree, so
// `document.querySelectorAll('x-mdhtml')` correctly never counts it -- but
// the naive regex scan below has no concept of <template> boundaries and
// counts it as occurrence #0 anyway. Every live element's index was off by
// one as a result: the page's very first real <div x-mdhtml> got matched to
// the template's own placeholder text and rendered the literal, un-
// interpolated "{{code}}" string as its "source", and every element after
// it displayed the PREVIOUS element's content instead of its own. Confirmed
// live on demos/wb-views-demo.html's "Standard Buttons (x-button)" example
// -- stripping <template>...</template> blocks before the ordinal scan
// restores parity between the two counts, matching what the live DOM
// already does.
// HTML comments are just as inert as <template> content -- never parsed as
// real elements -- but prose INSIDE a comment can still contain a literal
// tag-shaped substring (e.g. a doc comment explaining "<div x-demo>'s HTML-source
// extraction has no way to represent a React root..." literally contains the
// text "<div x-demo>"). The naive regex scan below has no concept of comment
// boundaries either, so that prose mention got counted as a real occurrence
// and, worse, its non-greedy capture then scanned forward for the next
// literal "</div>" ANYWHERE later in the file (real or not) -- on
// demos/frameworks.html this swallowed everything from a React-section
// comment all the way down through Vue/Svelte/Angular/Solid to the actual
// closing tag of the one real <div x-demo> (wrapping the HTMX section), so
// EVERY unrelated framework's markup got attributed to the HTMX demo as "its
// source". Strip comments alongside inert templates before scanning.
function stripInertMarkup(html) {
  return html
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

export function getPageSource() {
  if (_pageSource) return Promise.resolve(_pageSource);
  if (_pageSourcePromise) return _pageSourcePromise;
  _pageSourcePromise = fetch(location.href).then((r) => r.text()).then((text) => {
    _pageSource = stripInertMarkup(text);
    return _pageSource;
  });
  return _pageSourcePromise;
}

/** Count how many <tagName>...</tagName> occurrences the (template-stripped) source contains. */
function countTagOccurrences(source, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>[\\s\\S]*?<\\/${tagName}>`, 'gi');
  return (source.match(regex) || []).length;
}

/**
 * Extract the idx-th <tagName>...</tagName> block's inner content from source.
 *
 * #580: ordinal matching only means anything if "occurrences in the raw
 * source" and "elements in the live DOM" are counting the SAME set of tags.
 * They don't on pages like demos/wb-views-demo.html, where most <div x-mdhtml>
 * elements are entirely SYNTHESIZED at runtime (wb-views.js's `{{code}}`
 * template interpolation) and have zero literal representation in the raw
 * file at all -- only a handful of hand-authored ones (e.g. its "How It
 * Works" example) exist as real source text. Stripping inert <template>
 * blocks/comments (stripInertMarkup, above) fixes the off-by-one when the counts
 * are otherwise equal, but can't fix a page where they're fundamentally
 * different sets. `liveCount`, when passed, is the caller's own
 * `document.querySelectorAll(tagName).length` -- if it doesn't match what's
 * actually in the source, ordinal position is meaningless for this page, so
 * every call returns '' (empty) rather than confidently returning the WRONG
 * element's content. Callers already fall back to the live element's own
 * innerHTML when this returns falsy.
 */
export function extractTagBlock(source, tagName, idx, liveCount) {
  if (liveCount !== undefined && countTagOccurrences(source, tagName) !== liveCount) {
    return '';
  }
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  let match;
  let i = 0;
  while ((match = regex.exec(source)) !== null) {
    if (i === idx) return match[1];
    i++;
  }
  return '';
}

/**
 * Attribute-host source extraction (#934).
 *
 * Every pattern here is a regex LITERAL and the dynamic parts are compared as
 * STRINGS. Building these with `new RegExp('...\s...')` is what broke the
 * first attempt: one escaping layer too many turned `\s` into a literal `s`,
 * so ` x-demo columns="1"` did not match and every panel silently fell
 * through to the generated DOM -- the exact failure being fixed.
 */
const OPEN_TAG = /<([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
const ANY_TAG = /<(\/?)([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)(\/?)>/g;
const ATTR = /([a-zA-Z_:][-\w:.]*)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>]*))?/g;

/** Does this attribute text carry `attrName` as a whole attribute name? */
function attrPresent(attrText, attrName) {
  const re = new RegExp(ATTR.source, 'g');
  let m;
  while ((m = re.exec(attrText)) !== null) {
    if (m[1] === attrName) return true;
  }
  return false;
}

/**
 * Count elements carrying `attrName` in raw source text.
 *
 * The tag-based pair above cannot see them: authored markup is
 * `<div x-demo>`, not `<x-demo>`, ever since 4.0.0 removed custom elements.
 */
function countAttrOccurrences(source, attrName) {
  const open = new RegExp(OPEN_TAG.source, 'g');
  let m, n = 0;
  while ((m = open.exec(source)) !== null) {
    if (attrPresent(m[2], attrName)) n++;
  }
  return n;
}

/**
 * Extract the idx-th `<tag attrName ...>...</tag>` block's INNER content.
 *
 * A lazy `<tag ...>(.*?)</tag>` cannot do this: `<div x-demo>` contains
 * further `<div>`s, so it stops at the FIRST `</div>` and returns a truncated
 * fragment. Walk forward balancing opens and closes of the same tag name --
 * the same reason a brace-matcher beats a character count.
 *
 * Returns '' when source and live counts disagree, matching extractTagBlock's
 * #580 contract: an ordinal means nothing if the two sides are not counting
 * the same set, and a wrong answer is worse than none.
 */
export function extractAttrBlock(source, attrName, idx, liveCount) {
  if (idx < 0) return '';
  if (liveCount !== undefined && countAttrOccurrences(source, attrName) !== liveCount) {
    return '';
  }

  const open = new RegExp(OPEN_TAG.source, 'g');
  let m, i = 0;
  while ((m = open.exec(source)) !== null) {
    if (!attrPresent(m[2], attrName)) continue;
    if (i++ !== idx) continue;

    if (m[2].trimEnd().endsWith('/')) return '';   // self-closing host

    const tag = m[1].toLowerCase();
    const start = m.index + m[0].length;
    const scan = new RegExp(ANY_TAG.source, 'gi');
    scan.lastIndex = start;
    let depth = 1, t;
    while ((t = scan.exec(source)) !== null) {
      if (t[2].toLowerCase() !== tag) continue;
      if (t[1] === '/') {
        if (--depth === 0) return source.slice(start, t.index);
      } else if (t[4] !== '/') {
        depth++;
      }
    }
    return '';   // unbalanced source -- say nothing rather than guess
  }
  return '';
}
