/**
 * Extract `<div x-demo>` blocks from HTML.
 *
 * WHY THIS EXISTS
 *
 * These blocks used to be `<wb-demo>...</wb-demo>`, which a regex could match
 * safely: the closing tag was unique, so `<wb-demo[^>]*>([\s\S]*?)<\/wb-demo>`
 * could not run past the end of a block.
 *
 * Removing component tags made the host a `<div>`, and `</div>` is the most
 * common closing tag in any document. The equivalent regex would stop at the
 * FIRST `</div>` inside the block -- which is almost never the block's own --
 * silently truncating every demo that contains any nested element. It would
 * not error. It would just quietly return the wrong thing.
 *
 * So the scan counts depth instead. `<div` opens, `</div>` closes, and the
 * block ends when depth returns to zero.
 */

/** Match a `<div ... x-demo ...>` opening tag, capturing its attributes. */
const OPEN = /<div\b([^>]*\bx-demo\b[^>]*)>/gi;

/** Any div open or close, for depth counting. */
const DIV = /<div\b[^>]*>|<\/div\s*>/gi;

/**
 * @param {string} html
 * @returns {Array<{ attrs: string, inner: string, start: number, end: number }>}
 */
export function extractDemoBlocks(html) {
  const blocks = [];
  OPEN.lastIndex = 0;
  let m;

  while ((m = OPEN.exec(html))) {
    const innerStart = m.index + m[0].length;

    DIV.lastIndex = innerStart;
    let depth = 1;
    let innerEnd = -1;
    let d;

    while ((d = DIV.exec(html))) {
      // A self-closing <div/> is not valid HTML for a container, but if one
      // appears it must not change depth.
      if (d[0].startsWith('</')) {
        if (--depth === 0) { innerEnd = d.index; break; }
      } else if (!d[0].endsWith('/>')) {
        depth++;
      }
    }

    if (innerEnd < 0) break;  // unbalanced: stop rather than guess

    blocks.push({
      attrs: m[1].trim(),
      inner: html.slice(innerStart, innerEnd),
      start: m.index,
      end: DIV.lastIndex,
    });

    OPEN.lastIndex = DIV.lastIndex;
  }

  return blocks;
}

/** Every demo block's inner HTML. */
export function demoInnerBlocks(html) {
  return extractDemoBlocks(html).map((b) => b.inner);
}

/** The document with every demo block removed. */
export function stripDemoBlocks(html) {
  const blocks = extractDemoBlocks(html);
  let out = '';
  let cursor = 0;
  for (const b of blocks) {
    out += html.slice(cursor, b.start);
    cursor = b.end;
  }
  return out + html.slice(cursor);
}

/** How many demo blocks the document contains. */
export function countDemoBlocks(html) {
  return extractDemoBlocks(html).length;
}
