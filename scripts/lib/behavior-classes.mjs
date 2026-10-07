/**
 * behavior-classes.mjs — what classes does this behavior put on my element?
 * =========================================================================
 * #1096 / #1093. John: "the user must easily be able to find the class for
 * current element."
 *
 * Today they cannot. Of 156 schemas, 8 declare their classes; of 178 behavior
 * docs, 2 list any. The only truth is the JavaScript — `card.js` alone has 40
 * `classList.add` calls across 3,533 lines. So an author who wants to style a
 * `<article>` has to read the implementation.
 *
 * Extracted from source rather than hand-listed, for the obvious reason: a
 * hand-written list is wrong the first time someone adds a class and does not
 * update it, and nothing would catch that. This reads what the code actually
 * does.
 *
 * TEMPLATE CLASSES ARE INCLUDED DELIBERATELY
 *
 *   element.classList.add(`x-mark--${variant}`)
 *
 * The exact name depends on a runtime value, so it cannot be listed literally.
 * It is reported as `x-mark--{variant}` — a pattern, which is still far more
 * use to a reader than silence, and names the attribute that decides it.
 */
import { readFileSync, existsSync } from 'node:fs';

/**
 * The body of one exported behavior function, so classes are attributed to the
 * behavior that adds them rather than to every behavior sharing the file.
 *
 * This matters more than it sounds. `card.js` implements 19 card behaviors in
 * 3,533 lines; scanning the whole file would tell a reader that `cardimage`
 * applies `x-cardpricing__cta`, which is worse than telling them nothing —
 * they would write CSS against a class their element never gets.
 *
 * Brace-matched from the function's opening `{`, not regex-delimited: a
 * template literal or a nested function containing `}` ends the wrong scan, and
 * #693 is this repo's record of a char-count approach getting exactly that
 * wrong.
 *
 * @param {string} src   module source
 * @param {string} name  exported function name
 * @returns {string|null} the function body, or null if it is not in this file
 */
export function functionBody(src, name) {
  const text = String(src ?? '');
  const re = new RegExp(`export\\s+(?:async\\s+)?function\\s+${name}\\s*\\(`, 'm');
  const m = text.match(re);
  if (!m) return null;

  const open = text.indexOf('{', m.index + m[0].length - 1);
  if (open === -1) return null;

  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    const c = text[i];
    if (c === '{') depth += 1;
    else if (c === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(open, i + 1);
    }
  }
  return text.slice(open);   // unbalanced: better to over-report than to lose it
}

/**
 * Every class a source file adds, as literals plus interpolated patterns.
 *
 * @param {string} src  the module's source
 * @returns {{ literal: string[], pattern: string[] }}
 */
export function classesAddedIn(src) {
  const literal = new Set();
  const pattern = new Set();
  const text = String(src ?? '');

  // classList.add('x-foo')  /  classList.add('x-foo', 'x-bar')
  for (const m of text.matchAll(/classList\.add\(([^)]*)\)/g)) {
    for (const q of m[1].matchAll(/'(x-[a-zA-Z0-9_-]+)'/g)) literal.add(q[1]);
  }

  // classList.add(`x-foo--${variant}`) -> x-foo--{variant}
  for (const m of text.matchAll(/classList\.add\(\s*`([^`]+)`/g)) {
    const shape = m[1].replace(/\$\{([^}]*)\}/g, (_all, expr) => {
      // `${config.variant}` and `${v}` both read better as {variant} / {v}
      const name = String(expr).trim().split('.').pop().replace(/[^\w]/g, '');
      return `{${name || '…'}}`;
    });
    if (shape.startsWith('x-')) pattern.add(shape);
  }

  return { literal: [...literal].sort(), pattern: [...pattern].sort() };
}

/** Does any stylesheet define a rule for this class? */
export function hasRule(cssText, cls) {
  // A pattern like `x-mark--{variant}` cannot be matched literally; check its
  // stem, which is what a modifier rule would share.
  const stem = cls.includes('{') ? cls.slice(0, cls.indexOf('{')) : cls;
  if (!stem || stem === 'x-') return false;
  return cssText.includes('.' + stem);
}

/** Concatenate every stylesheet once, for repeated hasRule() checks. */
export function allCss(readdirSync, root = 'src/styles') {
  let out = '';
  const walk = (dir) => {
    let entries = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.css') && existsSync(p)) out += readFileSync(p, 'utf8');
    }
  };
  walk(root);
  return out;
}

/**
 * NAMING CONFORMANCE (#1096)
 * ==========================
 * The convention in docs/standards/CSS-CLASS-CONVENTION.md:
 *
 *   x-{behavior}               the host element
 *   x-{behavior}__{part}       DOM the behavior builds inside the host
 *   x-{behavior}--{modifier}   a variant or state of the host
 *
 * where {behavior} is a REGISTERED behavior name. A class that breaks it fails
 * one of two ways: its base names a concept rather than a behavior
 * (`x-pricing` for `cardpricing`), or it has a shape the rule has no slot for
 * (`x-card-image`: the `cardimage` behavior, or the `image` part of `card`?).
 */

/** {behavior}, then an optional __part, then an optional --modifier. Words inside a part or modifier may be hyphenated. */
export const CONVENTION = /^x-([a-z0-9]+)(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$/;

/**
 * Every registered behavior name, lowercased.
 *
 * Two registries, because tag-map.js alone is not the whole surface: it lists
 * 124 names, while index.js's behaviorModules -- what getBehavior() actually
 * resolves -- lists every behavior a page can use, `clipboard`, `lazy` and
 * `countdown` included. Checking against tag-map.js only reported real
 * behavior names as concepts.
 *
 * @param {string} root  repository root
 * @returns {Set<string>}
 */
export function registeredBehaviorNames(root) {
  const names = new Set();
  const tagMap = readFileSync(`${root}/src/core/tag-map.js`, 'utf8');
  for (const m of tagMap.matchAll(/^\s*'[^']+'\s*:\s*'([a-zA-Z][\w-]*)'/gm)) names.add(m[1].toLowerCase());
  const index = readFileSync(`${root}/src/wb-viewmodels/index.js`, 'utf8');
  const start = index.indexOf('const behaviorModules = {');
  const end = index.indexOf('\n};', start);
  if (start !== -1) {
    for (const m of index.slice(start, end).matchAll(/(?:^|[,{]\s*|\n\s*)'?([a-zA-Z][\w-]*)'?\s*:/g)) names.add(m[1].toLowerCase());
  }
  return names;
}

/**
 * Every x- class a behavior module puts on an element, mapped to the modules
 * that do it. Reads `classList.add(...)` and `classList.toggle(...)` string
 * arguments and `className = '...'` assignments. A template literal is kept
 * with each `${…}` replaced by `v`, so `x-alert--${variant}` is judged by its
 * shape, `x-alert--v`.
 *
 * @param {Array<{ file: string, src: string }>} modules
 * @returns {Map<string, Set<string>>}
 */
export function behaviorClassNames(modules) {
  const out = new Map();
  const note = (cls, file) => {
    if (!cls.startsWith('x-')) return;
    if (!out.has(cls)) out.set(cls, new Set());
    out.get(cls).add(file);
  };
  const strings = (args) => [...args.matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`/g)]
    .map((m) => (m[1] ?? m[2] ?? m[3]).replace(/\$\{[^}]*\}/g, 'v'));
  for (const { file, src } of modules) {
    // Arguments up to the closing paren, stepping over whole strings so a
    // `${tag.toLowerCase()}` inside a template does not end the call early.
    for (const m of src.matchAll(/classList\.(?:add|toggle)\(((?:`[^`]*`|'[^'\n]*'|"[^"\n]*"|[^)'"`])*)\)/g)) {
      const args = strings(m[1]);
      // toggle(name, force): only the first argument is a class.
      const classes = /classList\.toggle/.test(m[0]) ? args.slice(0, 1) : args;
      for (const s of classes) for (const cls of s.split(/\s+/)) note(cls, file);
    }
    for (const m of src.matchAll(/\.className\s*=\s*('[^'\n]*'|"[^"\n]*"|`[^`]*`)/g)) {
      for (const s of strings(m[1])) for (const cls of s.split(/\s+/)) note(cls, file);
    }
  }
  return out;
}

/**
 * Sort each class into conforming or one of the two failures.
 *
 * @param {Map<string, Set<string>>} classes  from behaviorClassNames()
 * @param {Set<string>} names                 from registeredBehaviorNames()
 * @returns {{ conform: string[], baseNotBehavior: string[], wrongShape: string[] }}
 */
export function classifyClassNames(classes, names) {
  const conform = [];
  const baseNotBehavior = [];
  const wrongShape = [];
  for (const cls of [...classes.keys()].sort()) {
    const m = cls.match(CONVENTION);
    if (!m) wrongShape.push(cls);
    else if (!names.has(m[1])) baseNotBehavior.push(cls);
    else conform.push(cls);
  }
  return { conform, baseNotBehavior, wrongShape };
}
