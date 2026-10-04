/**
 * WHITESPACE INSIDE <pre> AND <code> IS CONTENT, NOT FORMATTING
 * ============================================================
 * #1015 — John, pointing at the source panel of the `code` behavior's demo:
 * "This didn't parse correct." A ~20-line JavaScript example rendered as one
 * wrapped run-on paragraph.
 *
 * formatHtml() in src/wb-viewmodels/demo.js is the demo source pretty-printer.
 * It collapsed every text node's whitespace, which is right for prose and
 * destroys a code example: the body of <code language="javascript"> is ONE text
 * node holding every line, so all of them became one.
 *
 * WHY THIS TEST IS SHAPED THIS WAY. The first attempt at #1015 special-cased
 * the text node — split on newline, strip the common indent, re-indent to the
 * walker's depth — and a test that only asked "are there newlines now?" would
 * have passed it. That is not preservation: every line came back shifted by the
 * element's depth, and the walker was still putting `<code>` on its own
 * indented line inside the `<pre>`, injecting a blank first line and trailing
 * whitespace that a <pre> renders. So the assertions below are on the EXACT
 * bytes: the body string must appear in the output unchanged, and the opening
 * and closing tags must sit on the same lines as the first and last bytes of
 * that body.
 *
 * Measured against origin/main before the fix (2026-10-03): the same input came
 * back with `<pre>` and `<code>` on separate lines and every code line indented
 * by 6 extra spaces — the verbatim body was absent from the output.
 */

import { test, expect } from '../fixtures/offline';

const NL = String.fromCharCode(10);

/**
 * The example body, exactly as an author writes it between the tags: a leading
 * newline, two levels of its own indentation, a trailing newline.
 */
const BODY_LINES = [
  '',
  '// Debounce -- delay a call until the caller stops firing.',
  'export function debounce(fn, wait = 200) {',
  '  let timer = null;',
  '  return function debounced(...args) {',
  '    clearTimeout(timer);',
  '  };',
  '}',
  '',
];

type Formatted = { out: string; lines: string[] };

/** formatHtml() needs a real parser, so it runs in the page, not in Node. */
async function format(page: import('@playwright/test').Page, raw: string): Promise<Formatted> {
  return page.evaluate(async ({ source, nl }) => {
    const m: any = await import('/src/wb-viewmodels/demo.js');
    const out: string = m.formatHtml(source);
    return { out, lines: out.split(nl) };
  }, { source: raw, nl: NL });
}

test.describe('formatHtml treats pre/code/textarea as opaque (#1015)', () => {
  test('a multi-line <pre><code> body survives byte for byte (#1015)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const body = BODY_LINES.join(NL);
    const raw = '<div x-demo columns="1">' + NL
      + '  <pre><code language="javascript">' + body + '</code></pre>' + NL
      + '</div>';

    const { out, lines } = await format(page, raw);

    // THE claim: the body is in the output unchanged — same newlines, same
    // leading indentation, nothing inserted and nothing stripped.
    expect(out).toContain(body);

    // And spelled out line by line, so a failure says which line moved.
    const open = lines.findIndex((l) => l.indexOf('<pre>') !== -1);
    expect(open, 'the <pre> must still be emitted').toBeGreaterThan(-1);
    // Nesting: <code> stays on the <pre>'s own line. Pushing it one line down
    // puts a newline inside the <pre>, which renders as a blank first line.
    expect(lines[open]).toBe('  <pre><code language="javascript">');
    expect(lines[open + 1]).toBe('// Debounce -- delay a call until the caller stops firing.');
    expect(lines[open + 2]).toBe('export function debounce(fn, wait = 200) {');
    // Two spaces, not two-plus-the-walker's-depth.
    expect(lines[open + 3]).toBe('  let timer = null;');
    expect(lines[open + 4]).toBe('  return function debounced(...args) {');
    // Four spaces: the author's second level, unchanged.
    expect(lines[open + 5]).toBe('    clearTimeout(timer);');
    expect(lines[open + 6]).toBe('  };');
    expect(lines[open + 7]).toBe('}');
    // The trailing newline of the body is the author's; the closing tags join
    // the empty line it produced rather than adding one of their own.
    expect(lines[open + 8]).toBe('</code></pre>');
  });

  test('prose outside the code block still collapses (#1015)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const raw = '<div x-demo>' + NL
      + '  <p>Some   prose with' + NL + '  an author line break.</p>' + NL
      + '</div>';

    const { out } = await format(page, raw);

    // The opaque rule must not leak into prose: an author's arbitrary wrapping
    // inside a <p> is not content and is still collapsed to one line.
    expect(out).toContain('    Some prose with an author line break.');
    expect(out).not.toContain('Some   prose');
  });

  test('a bare <pre> and a <textarea> are opaque too (#1015)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // The bodies as the HTML PARSER hands them over, which is what the
    // formatter can possibly preserve. A single newline immediately after a
    // <pre> or <textarea> start tag is dropped by the parser itself (HTML
    // spec), identically in the demo panel and in the live example above it,
    // so these start at "line one" rather than at a newline. Everything after
    // that first character is the formatter's responsibility.
    const preBody = ['line one', '    line two indented', ''].join(NL);
    const areaBody = ['first', '  second', ''].join(NL);
    const raw = '<div x-demo>' + NL
      + '  <pre>' + NL + preBody + '</pre>' + NL
      + '  <textarea>' + NL + areaBody + '</textarea>' + NL
      + '</div>';

    const { out } = await format(page, raw);

    // Opening tag, body and closing tag on the same lines as the body's own
    // first and last characters: nothing inserted at either boundary.
    expect(out).toContain('  <pre>' + preBody + '</pre>');
    expect(out).toContain('  <textarea>' + areaBody + '</textarea>');
    // The inner indentation is the author's four spaces, not four plus depth.
    expect(out.split(NL)).toContain('    line two indented');
    expect(out.split(NL)).toContain('  second');
  });
});
