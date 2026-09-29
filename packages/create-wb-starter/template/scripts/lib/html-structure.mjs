/**
 * Structural HTML checks that report only unambiguous defects.
 *
 * WHY THIS EXISTS
 *
 * tests/regression/html-validity.spec.ts used regex heuristics, and the first
 * of them was `/>\s*$/gm` — "a line ending in `>`". That matches nearly every
 * line of well-formed HTML, so the check called all ten of its files malformed
 * and had been failing on correct markup. Its tag-balance check then compared
 * raw open/close COUNTS with a `- 5` fudge factor, which cannot detect
 * anything: five mismatched tags pass, and a `</input>` closing three `<div>`s
 * (the real bug that once hung the renderer) balances perfectly by count.
 *
 * A checker that fires on valid input teaches people to ignore it. So this
 * reports only things that are defects under any reading of the spec:
 *
 *   1. a closing tag for a void element   `</input>`, `</br>`, `</img>`
 *   2. a closing tag matching nothing open `</div>` with no open <div>
 *   3. a mis-nested close                  `<div><span></div>`
 *   4. a container still open at EOF       an unclosed <section>
 *
 * Deliberately NOT reported: an omitted end tag for an element whose end tag
 * is optional in HTML (`<li>`, `<td>`, `<p>`, `<option>`…). Those are valid,
 * common, and flagging them is how a checker earns its reputation for crying
 * wolf.
 */

/** Elements that never have an end tag. */
const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
  'meta', 'param', 'source', 'track', 'wbr',
]);

/** Elements whose end tag HTML lets you omit — never reported as unclosed. */
const OPTIONAL_END = new Set([
  'li', 'dt', 'dd', 'p', 'rt', 'rp', 'optgroup', 'option',
  'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'colgroup', 'caption',
]);

/** Raw-text elements: everything until the matching close is TEXT, not markup. */
const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title']);

/**
 * @param {string} html
 * @returns {{ line: number, message: string }[]}
 */
export function findStructuralErrors(html) {
  const errors = [];
  const stack = [];
  let i = 0;

  const lineAt = (index) => html.slice(0, index).split('\n').length;

  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) break;

    // Comments and doctype/CDATA carry no structure.
    if (html.startsWith('<!--', lt)) {
      const close = html.indexOf('-->', lt + 4);
      i = close === -1 ? html.length : close + 3;
      continue;
    }
    if (html.startsWith('<!', lt) || html.startsWith('<?', lt)) {
      const close = html.indexOf('>', lt);
      i = close === -1 ? html.length : close + 1;
      continue;
    }

    const isClose = html[lt + 1] === '/';
    const nameMatch = /^[a-zA-Z][a-zA-Z0-9-]*/.exec(html.slice(lt + (isClose ? 2 : 1)));
    if (!nameMatch) { i = lt + 1; continue; } // a bare `<` in text

    const name = nameMatch[0].toLowerCase();

    // Find this tag's own `>`, ignoring any inside a quoted attribute value.
    let j = lt + 1;
    let quote = null;
    while (j < html.length) {
      const c = html[j];
      if (quote) { if (c === quote) quote = null; }
      else if (c === '"' || c === "'") quote = c;
      else if (c === '>') break;
      j++;
    }
    if (j >= html.length) break;

    const selfClosing = html[j - 1] === '/';

    if (isClose) {
      if (VOID.has(name)) {
        errors.push({ line: lineAt(lt), message: `</${name}> — ${name} is a void element and has no closing tag` });
      } else {
        const at = stack.map((e) => e.name).lastIndexOf(name);
        if (at === -1) {
          errors.push({ line: lineAt(lt), message: `</${name}> closes nothing — no <${name}> is open here` });
        } else {
          // Everything above it was left open. Only complain about the ones
          // whose end tag is NOT optional.
          for (let k = stack.length - 1; k > at; k--) {
            if (!OPTIONAL_END.has(stack[k].name)) {
              errors.push({
                line: lineAt(stack[k].index),
                message: `<${stack[k].name}> is still open where </${name}> appears (line ${lineAt(lt)})`,
              });
            }
          }
          stack.length = at;
        }
      }
    } else if (!VOID.has(name) && !selfClosing) {
      if (RAW_TEXT.has(name)) {
        // Skip the body wholesale: `a > b` and `=>` inside a script are text.
        const close = html.toLowerCase().indexOf(`</${name}`, j);
        if (close === -1) {
          errors.push({ line: lineAt(lt), message: `<${name}> is never closed` });
          break;
        }
        // Skip PAST the closing tag, not up to it — landing on it would make
        // the next iteration read `</script>` as an orphaned close.
        const closeEnd = html.indexOf('>', close);
        i = closeEnd === -1 ? html.length : closeEnd + 1;
        continue;
      }
      stack.push({ name, index: lt });
    }

    i = j + 1;
  }

  for (const open of stack) {
    if (!OPTIONAL_END.has(open.name)) {
      errors.push({ line: lineAt(open.index), message: `<${open.name}> is never closed` });
    }
  }

  return errors;
}
