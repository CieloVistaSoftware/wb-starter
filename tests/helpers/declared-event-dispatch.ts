/**
 * Does a behavior dispatch the events its schema declares? (#344)
 *
 * The source-schema check used to answer this by asking whether the event name
 * appeared, quoted, inside the exported behavior function's own body. That
 * missed three real dispatch shapes and accepted one non-dispatch:
 *
 *   - A HELPER IN THE SAME MODULE. toast() shows its toast through
 *     createToast(), which is where wb:toast:hide and wb:toast:action are
 *     fired. confirm() and prompt() both open their dialog through
 *     openDialog(). The event is in the module; it is just one call away.
 *   - A COMPUTED NAME. `wb:cardbutton:${kind}` with kind 'primary' or
 *     'secondary'; `wb:${kind}:ok` with kind 'confirm'.
 *   - THE WRONG FUNCTION. The body was sliced out of every viewmodel file
 *     concatenated, so the FIRST `export function sticky` won: layouts.js's,
 *     not sticky.js's, which is the one index.js loads. A function exported
 *     under a camelCase alias (switch -> switchInput, copybutton ->
 *     copyButton) was never found at all, so its events were never checked.
 *   - A COMMENT. A name mentioned in a comment counted as dispatched.
 *
 * So: start from the function index.js actually runs, in the module it
 * actually loads, follow every module-level function that code references
 * (transitively), drop comments, and then look for the name. A computed name
 * counts only when every interpolated part is a string literal that same
 * reachable code contains, so `wb:${kind}:ok` proves wb:confirm:ok inside
 * confirm() (which passes 'confirm') and proves nothing for wb:other:ok.
 */
import { blockEnd } from '../base';

type Mode = 'comments' | 'comments+strings';

/**
 * Blank out comments (and, for 'comments+strings', the text of string and
 * template literals, keeping `${}` expressions) without moving any index.
 */
export function mask(source: string, mode: Mode): string {
  const out = source.split('');
  const blank = (from: number, to: number) => {
    for (let k = from; k < to && k < out.length; k++) if (out[k] !== '\n') out[k] = ' ';
  };
  const strings = mode === 'comments+strings';
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    const n = source[i + 1];
    if (c === '/' && n === '/') {
      const end = source.indexOf('\n', i);
      const stop = end === -1 ? source.length : end;
      blank(i, stop);
      i = stop;
      continue;
    }
    if (c === '/' && n === '*') {
      const end = source.indexOf('*/', i + 2);
      const stop = end === -1 ? source.length : end + 2;
      blank(i, stop);
      i = stop;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < source.length && source[j] !== c && source[j] !== '\n') j += source[j] === '\\' ? 2 : 1;
      if (strings) blank(i + 1, j);
      i = j + 1;
      continue;
    }
    if (c === '`') {
      let j = i + 1;
      let textStart = j;
      while (j < source.length && source[j] !== '`') {
        if (source[j] === '\\') { j += 2; continue; }
        if (source[j] === '$' && source[j + 1] === '{') {
          if (strings) blank(textStart, j);
          let depth = 1;
          j += 2;
          while (j < source.length && depth > 0) {
            if (source[j] === '{') depth++;
            else if (source[j] === '}') depth--;
            j++;
          }
          textStart = j;
          continue;
        }
        j++;
      }
      if (strings) blank(textStart, j);
      i = j + 1;
      continue;
    }
    i++;
  }
  return out.join('');
}

/** Index just past the `)` matching the `(` at `openIdx`, or -1. */
function parenEnd(source: string, openIdx: number): number {
  let depth = 0;
  for (let i = openIdx; i < source.length; i++) {
    if (source[i] === '(') depth++;
    else if (source[i] === ')' && --depth === 0) return i + 1;
  }
  return -1;
}

/**
 * Every module-level function in `source`, by name -> its full text. Covers
 * `function f(...) {}` and `const f = (...) => {}` / `const f = function (...) {}`
 * written at column 0, with or without `export` / `async`.
 */
export function moduleFunctions(source: string): Map<string, string> {
  const masked = mask(source, 'comments+strings');
  const found = new Map<string, string>();
  const decl = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(|^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?(?:function\b[^(]*)?\(/gm;
  for (const m of masked.matchAll(decl)) {
    const name = m[1] || m[2];
    const open = m.index! + m[0].length - 1;
    const close = parenEnd(masked, open);
    if (close === -1) continue;
    const rest = masked.slice(close).match(/^\s*(?:=>\s*)?\{/);
    if (!rest) continue;
    const brace = close + rest[0].length - 1;
    const end = blockEnd(source, brace);
    if (end === -1) continue;
    if (!found.has(name)) found.set(name, source.slice(m.index!, end));
  }
  return found;
}

/**
 * The code `entry` can run inside its own module: its own text plus, followed
 * transitively, every module-level function it names. Comments are removed.
 * Returns null when the module has no such function.
 */
export function reachableCode(source: string, entry: string): string | null {
  const fns = moduleFunctions(source);
  if (!fns.has(entry)) return null;
  const seen = new Set<string>([entry]);
  const queue = [entry];
  const parts: string[] = [];
  while (queue.length) {
    const name = queue.shift()!;
    const text = fns.get(name)!;
    parts.push(text);
    for (const id of mask(text, 'comments+strings').matchAll(/[A-Za-z_$][\w$]*/g)) {
      if (fns.has(id[0]) && !seen.has(id[0])) { seen.add(id[0]); queue.push(id[0]); }
    }
  }
  return mask(parts.join('\n'), 'comments');
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Is `eventName` written in `code`, literally or as a resolvable template? */
export function dispatchesEvent(code: string, eventName: string): boolean {
  if (new RegExp(`(['"\`])${escapeRe(eventName)}\\1`).test(code)) return true;

  const literals = new Set(
    [...code.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"/g)].map((m) => m[1] ?? m[2]),
  );
  for (const t of code.matchAll(/`([^`]*\$\{[^`]*)`/g)) {
    const pieces = t[1].split(/\$\{[^}]*\}/);
    const re = new RegExp(`^${pieces.map(escapeRe).join('([\\w-]+)')}$`);
    const m = eventName.match(re);
    if (m && m.slice(1).every((part) => literals.has(part))) return true;
  }
  return false;
}
