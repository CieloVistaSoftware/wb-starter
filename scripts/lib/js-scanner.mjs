/**
 * A JavaScript source scanner that knows what a quote means.
 *
 * WHY THIS IS SHARED
 *
 * Two tools needed to strip comments from JS, and each grew its own scanner.
 * Both then hit the same class of bug from opposite directions, because a
 * naive scanner cannot tell these apart:
 *
 *   const s = "it's fine";        a quote INSIDE a string
 *   // it's fine                  a quote inside a COMMENT
 *   /\sstyle\s*=\s*["']/          quotes inside a REGEX character class
 *   await page.goto('http://x')   a `//` inside a string
 *
 * Treating any of those as an opening quote desyncs everything after it.
 * Measured in tests/compliance/tests-must-assert.spec.ts: an apostrophe in a
 * `//` comment inflated its findings from 23 to 40, and a `["']` inside a
 * regex literal ran a phantom string 135 lines down the file, so a whole
 * region stopped being processed and one test's body was computed 21 lines
 * short of its own expect().
 *
 * scripts/test-wb-demo-integrity.mjs already solved this properly, including
 * the character-class case. Copying it a third time is how the first two
 * diverged, so it lives here now and both import it.
 */

/**
 * Characters after which a `/` starts a REGEX rather than being division --
 * the standard heuristic: start of input, or the previous significant token
 * is an operator/punctuator rather than an identifier, number, `)`, `]`, or
 * a closing quote.
 */
const REGEX_CONTEXT_RE = /[([{,;:!&|?+\-*%^~=<>]/;

/**
 * Strip JS comments, leaving strings, template literals and regex literals
 * intact. Line comments are removed up to (not including) the newline; block
 * comments collapse to a single space so token boundaries are not joined.
 *
 * @param {string} code
 * @returns {string}
 */
export function stripJsComments(code) {
  let out = '';
  let i = 0;
  const n = code.length;
  let lastSignificant = '';

  while (i < n) {
    const c = code[i];
    const c2 = i + 1 < n ? code[i + 1] : '';

    if (c === '/' && c2 === '/') {
      i += 2;
      while (i < n && code[i] !== '\n') i++;
      continue;
    }

    if (c === '/' && c2 === '*') {
      i += 2;
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) i++;
      i = Math.min(i + 2, n);
      out += ' ';
      continue;
    }

    // Strings and templates: copy verbatim, honouring backslash escapes, so a
    // `//` or an apostrophe inside one is never mistaken for syntax.
    if (c === "'" || c === '"' || c === '`') {
      const quote = c;
      out += c;
      i++;
      while (i < n) {
        const cj = code[i];
        out += cj;
        if (cj === '\\' && i + 1 < n) {
          out += code[i + 1];
          i += 2;
          continue;
        }
        i++;
        if (cj === quote) break;
      }
      lastSignificant = quote;
      continue;
    }

    // Regex literal, only where a `/` is syntactically plausible. `inClass`
    // is what makes `["']` safe: quotes and even a `/` inside [...] are data,
    // not delimiters.
    if (c === '/' && (lastSignificant === '' || REGEX_CONTEXT_RE.test(lastSignificant))) {
      let j = i + 1;
      let inClass = false;
      let sawClose = false;
      let buf = '/';
      while (j < n) {
        const cj = code[j];
        if (cj === '\n') break;          // a regex literal cannot span lines
        buf += cj;
        if (cj === '\\' && j + 1 < n) {
          buf += code[j + 1];
          j += 2;
          continue;
        }
        if (cj === '[') inClass = true;
        else if (cj === ']') inClass = false;
        else if (cj === '/' && !inClass) { j++; sawClose = true; break; }
        j++;
      }
      if (sawClose) {
        while (j < n && /[a-z]/i.test(code[j])) { buf += code[j]; j++; }
        out += buf;
        i = j;
        lastSignificant = '/';
        continue;
      }
      // No closing `/` before end of line: it was division after all.
    }

    out += c;
    if (!/\s/.test(c)) lastSignificant = c;
    i++;
  }

  return out;
}
