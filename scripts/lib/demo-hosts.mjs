/**
 * Find every `<div x-demo>` in a page or a Markdown doc, and say what it is (#917).
 *
 * `grep "<div x-demo"` counts a string. A string is not always an element:
 *
 *   - in an .html file it can sit in an HTML comment, or in a <script> (a JS
 *     comment, or markup a script builds);
 *   - in a .md doc it can sit in an inline code span (`<div x-demo>` in prose),
 *     in a fenced block (an ```html example, or a ```text vocabulary list), or
 *     in an HTML comment.
 *
 * And an element's CLOSING tag cannot be found with a regex: a demo holds other
 * <div>s, and `</div>` is the commonest closing tag there is. So this walks the
 * markup keeping a stack of open <div>s, the way the HTML parser pairs them,
 * and a demo's close is the `</div>` that pops it.
 *
 * Returns positions in the ORIGINAL text, so a caller can rewrite exactly the
 * two tags and nothing else.
 */

/** Tokens that matter for pairing <div>s. Comments and raw-text elements are skipped whole. */
const TOKEN = /<!--[\s\S]*?-->|<(script|style|textarea)\b(?:"[^"]*"|'[^']*'|[^>"'])*>[\s\S]*?<\/\1\s*>|<(\/?)div\b((?:"[^"]*"|'[^']*'|[^>"'])*)>/gi;

/** Does an open tag's attribute text carry x-demo as a whole attribute name? */
export function hasXDemo(attrText) {
  return /(?:^|\s)x-demo(?=[\s=/>]|$)/.test(attrText);
}

/**
 * Pair the <div>s in one stretch of live markup.
 * @param {string} text
 * @param {number} base offset of `text` in the whole file
 * @param {string} region label carried onto every result
 */
function pairDivs(text, base, region) {
  const hosts = [];
  const unmatched = [];
  const stack = [];
  TOKEN.lastIndex = 0;
  let m;
  while ((m = TOKEN.exec(text))) {
    if (m[2] === undefined) continue;            // comment or raw-text element
    if (m[2] === '/') {
      const open = stack.pop();
      if (!open) continue;                       // stray </div>: not a demo's business
      if (open.demo) {
        hosts.push({
          region,
          open: { start: base + open.index, end: base + open.index + open.length },
          close: { start: base + m.index, end: base + m.index + m[0].length },
        });
      }
    } else if (!m[3].trimEnd().endsWith('/')) {
      stack.push({ index: m.index, length: m[0].length, demo: hasXDemo(m[3]) });
    }
  }
  for (const open of stack) {
    if (open.demo) unmatched.push({ region, start: base + open.index });
  }
  return { hosts, unmatched };
}

/** Every `<div x-demo` string in `text`, by offset. */
function mentions(text) {
  const out = [];
  const re = /<div\s+x-demo(?=[\s=/>]|$)/g;
  let m;
  while ((m = re.exec(text))) out.push(m.index);
  return out;
}

/** Same-length copy of `text` with [start, end) blanked (newlines kept). */
function blank(text, start, end) {
  return text.slice(0, start) + text.slice(start, end).replace(/[^\n]/g, ' ') + text.slice(end);
}

/** Fenced code blocks in a Markdown doc: [{ start, end, bodyStart, bodyEnd, lang }]. */
export function markdownFences(md) {
  const fences = [];
  const lines = md.split('\n');
  let offset = 0;
  let open = null;
  for (const line of lines) {
    const lineEnd = offset + line.length + 1;
    if (!open) {
      const m = /^\s*(`{3,}|~{3,})\s*([^\s`]*)/.exec(line);
      if (m) open = { start: offset, bodyStart: lineEnd, fence: m[1], lang: m[2].toLowerCase() };
    } else {
      const m = /^\s*(`{3,}|~{3,})\s*$/.exec(line);
      if (m && m[1][0] === open.fence[0] && m[1].length >= open.fence.length) {
        fences.push({ ...open, bodyEnd: offset, end: Math.min(lineEnd, md.length) });
        open = null;
      }
    }
    offset = lineEnd;
  }
  if (open) fences.push({ ...open, bodyEnd: md.length, end: md.length });
  return fences;
}

/** Inline code spans outside fences: [{ start, end }]. A span never crosses a blank line. */
function codeSpans(md) {
  const spans = [];
  const re = /`+/g;
  let m;
  while ((m = re.exec(md))) {
    const ticks = m[0];
    const close = new RegExp(`(?<!\`)${ticks}(?!\`)`, 'g');
    close.lastIndex = m.index + ticks.length;
    const c = close.exec(md);
    if (!c || /\n[ \t]*\n/.test(md.slice(m.index, c.index))) continue;
    spans.push({ start: m.index, end: c.index + ticks.length });
    re.lastIndex = c.index + ticks.length;
  }
  return spans;
}

/**
 * Scan one file's text.
 * @param {string} text
 * @param {'html'|'md'} kind
 * @returns {{ hosts: Array<{region: string, open: {start: number, end: number}, close: {start: number, end: number}}>,
 *             unmatched: Array<{region: string, start: number}>,
 *             other: Array<{region: string, start: number}> }}
 *   hosts: real elements, paired; unmatched: a demo open tag with no close;
 *   other: a `<div x-demo` string that is not live markup (comment, script,
 *   inline code, a non-HTML fence).
 */
export function scanDemoHosts(text, kind) {
  const hosts = [];
  const unmatched = [];
  const claimed = new Set();
  const take = (r) => {
    hosts.push(...r.hosts);
    unmatched.push(...r.unmatched);
    for (const h of r.hosts) claimed.add(h.open.start);
    for (const u of r.unmatched) claimed.add(u.start);
  };

  if (kind === 'html') {
    take(pairDivs(text, 0, 'html'));
  } else {
    // Each HTML fence is its own document (mdhtml.js renders it on its own).
    let body = text;
    for (const f of markdownFences(text)) {
      if (f.lang === 'html' || f.lang === 'html-static') {
        take(pairDivs(text.slice(f.bodyStart, f.bodyEnd), f.bodyStart, `fence:${f.lang}`));
      }
      body = blank(body, f.start, f.end);
    }
    // Comments first, so a backtick inside one cannot pair with one outside.
    body = body.replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, ' '));
    for (const s of codeSpans(body)) body = blank(body, s.start, s.end);
    take(pairDivs(body, 0, 'md'));
  }

  const other = [];
  for (const pos of mentions(text)) {
    if (claimed.has(pos)) continue;
    other.push({ region: describe(text, kind, pos), start: pos });
  }
  return { hosts, unmatched, other };
}

/** Why a `<div x-demo` string at `pos` is not an element. */
function describe(text, kind, pos) {
  const before = text.slice(0, pos);
  const lastOpen = before.lastIndexOf('<!--');
  if (lastOpen >= 0 && before.lastIndexOf('-->') < lastOpen) return 'comment';
  if (kind === 'html') {
    const s = before.search(/<script\b[^>]*>(?![\s\S]*<\/script>)[\s\S]*$/i);
    return s >= 0 ? 'script' : 'other';
  }
  for (const f of markdownFences(text)) {
    if (pos >= f.start && pos < f.end) return `fence:${f.lang || 'plain'}`;
  }
  return 'inline-code';
}
