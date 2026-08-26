/**
 * Raw HTML inside markdown, with fenced code removed.
 *
 * A markdown doc has two kinds of HTML: LIVE html the browser parses and
 * renders, and SAMPLE html inside ``` fences that is only ever displayed as
 * text. They need opposite treatment, and conflating them is a mistake worth
 * naming: three separate scans I wrote today miscounted `<div>` because they
 * looked at fenced samples, inline-code spans, or comments as if that text
 * were real markup.
 *
 * One helper, so the next tool does not grow its own.
 */

/** The doc with fenced blocks blanked out (line numbers preserved). */
export function stripFences(md) {
  const lines = String(md).split('\n');
  let inFence = false;
  return lines
    .map((ln) => {
      if (/^\s*(```|~~~)/.test(ln)) {
        inFence = !inFence;
        return '';
      }
      return inFence ? '' : ln;
    })
    .join('\n');
}

/** Also blank inline `code` spans, which routinely contain tag-like text. */
export function stripInlineCode(text) {
  return String(text).replace(/`[^`\n]*`/g, '');
}

/** Live markup only: no fenced blocks, no inline code. */
export function liveHtml(md) {
  return stripInlineCode(stripFences(md));
}

/**
 * HTML elements that cannot have a closing tag. Writing `</input>` does not
 * close anything -- the parser discards it, so whatever was genuinely open
 * STAYS open and swallows the rest of the document.
 */
export const VOID_ELEMENTS = [
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
];

/**
 * Closing tags for void elements in LIVE markup.
 * @returns {Array<{tag: string, line: number}>}
 */
export function findVoidClosingTags(md) {
  const text = liveHtml(md);
  const re = new RegExp(`</\\s*(${VOID_ELEMENTS.join('|')})\\s*>`, 'gi');
  const out = [];
  text.split('\n').forEach((ln, i) => {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(ln))) out.push({ tag: m[1].toLowerCase(), line: i + 1 });
  });
  return out;
}
