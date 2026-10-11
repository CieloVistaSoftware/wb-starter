/**
 * Which class names the loaded stylesheets actually define.
 * -----------------------------------------------------------------------------
 * #885: two places independently mapped a declared enum property to a modifier
 * class -- declared-modifiers.js's applyDeclaredModifiers() (#770) and schema-builder.js's
 * applyProperty(). Both were right for `size`/`variant`, which are style axes,
 * and wrong for `icon="star"` and `target="_self"`, which are values. The
 * result was `class="x-button x-button--star x-button--start x-button--primary
 * x-button--md x-button--_self"`, where three of those names match no CSS
 * anywhere.
 *
 * wb.js's own comment already states the principle both were breaking:
 *
 *     Only a declared value becomes a class. A typo must not mint a class
 *     that silently matches no CSS and looks like it worked.
 *
 * A valid value that matches no CSS is the same failure as a typo that
 * matches no CSS.
 *
 * Rather than keeping a list of which properties are presentational -- which
 * drifts the moment a schema gains a property, and which would have to be
 * kept in both callers -- ask the stylesheets. A behavior's CSS is loaded by
 * ensureBehaviorCss() before its inject runs, so the answer is available by
 * the time either caller needs it.
 *
 * ONE implementation, imported by both callers: the duplicate mapping is what
 * let the two drift apart in the first place.
 */

let cache = null;
let cachedSheetCount = -1;
// class -> the selector lists (split into parts) of every rule that names it.
let rulesByClass = null;

/**
 * Does any loaded stylesheet define a rule using this class?
 * @param {string} cls - class name, no leading dot
 * @returns {boolean}
 */
export function styleSheetDefinesClass(cls) {
  try {
    const sheets = document.styleSheets;
    if (cache === null || sheets.length !== cachedSheetCount) {
      const found = new Set();
      const byClass = new Map();
      for (const sheet of Array.from(sheets)) {
        let rules;
        // A cross-origin sheet throws here. Skip it rather than treat it as
        // empty -- an unreadable sheet is unknown, not absent.
        try { rules = sheet.cssRules; } catch { continue; }
        if (!rules) continue;
        // A rule's own selector first, THEN any nested rules. The old walk
        // took "has cssRules" to mean "a grouping rule (@media, @layer)" and
        // skipped the selector -- but since CSS nesting (Chrome 112) every
        // CSSStyleRule has a cssRules list too, empty. So no selector was ever
        // recorded, every class read as undefined, and no declared modifier
        // (.x-hero--cosmic, x-button--primary, ...) was applied in Chromium
        // (#1147).
        const walk = (list) => {
          for (const rule of Array.from(list)) {
            if (rule.selectorText) {
              let parts = null;
              for (const m of rule.selectorText.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
                found.add(m[1]);
                parts = parts || splitSelectorList(rule.selectorText);
                if (!byClass.has(m[1])) byClass.set(m[1], []);
                const lists = byClass.get(m[1]);
                if (lists[lists.length - 1] !== parts) lists.push(parts);
              }
            }
            if (rule.cssRules && rule.cssRules.length) walk(rule.cssRules);
          }
        };
        walk(rules);
      }
      cache = found;
      rulesByClass = byClass;
      cachedSheetCount = sheets.length;
    }
    return cache.has(cls);
  } catch {
    // Unreadable environment: emit as before rather than silently strip
    // styling a page might depend on.
    return true;
  }
}

/** Drop the cache — for tests that inject a stylesheet mid-run. */
export function resetStyleRegistry() {
  cache = null;
  rulesByClass = null;
  cachedSheetCount = -1;
}

/**
 * Would adding this class to this element change nothing, because every rule
 * that uses it already reaches the element through another selector in the
 * SAME rule? (#1831)
 *
 * a8a7362e moved cards from class injection to specificity: card.css writes
 * `.x-card--elevated, [elevated] { ... }`, `.x-card--glass:hover,
 * [variant="glass"]:hover { ... }`, `.x-card--auto` beside `article` -- the
 * class and the attribute are aliases in one rule, and the card is styled by
 * the attribute it already carries. Stamping the class anyway is the
 * "class injected after the fact" that commit removed. A class some rule
 * styles ONLY by class (.x-hero--cosmic, .x-card--success for featured-tone,
 * .x-cardnotification--elevated) still adds something, so it still lands.
 *
 * "Another selector in the same rule" is checked structurally: the other
 * selector must be the same selector with the class swapped for a simple
 * selector (`[elevated]`, `article`, `:is([x-card], ...)[variant="glass"]`)
 * that the element matches -- so `.C:hover` is covered by `[a]:hover` but not
 * by `[a]`, and `.C > *` by `[a] > *`. `:is(.C, [a])` inside one selector
 * counts too. Anything unreadable answers "not covered": emitting a class a
 * page may need is the safe direction.
 *
 * @param {Element} element
 * @param {string} cls - class name, no leading dot
 * @returns {boolean}
 */
export function classAddsNothing(element, cls) {
  try {
    if (!styleSheetDefinesClass(cls) || !rulesByClass) return false;
    const lists = rulesByClass.get(cls);
    if (!lists || !lists.length) return false;
    return lists.every((parts) => parts.every((part) =>
      !hasClassToken(part, cls) || partIsCovered(element, cls, part, parts)));
  } catch {
    return false;
  }
}

/** Split a selector list on its top-level commas. */
function splitSelectorList(text) {
  const out = [];
  let depth = 0, inStr = '', start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) { if (c === inStr && text[i - 1] !== '\\') inStr = ''; continue; }
    if (c === '"' || c === "'") inStr = c;
    else if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === ',' && depth === 0) { out.push(text.slice(start, i).trim()); start = i + 1; }
  }
  out.push(text.slice(start).trim());
  return out;
}

const CLASS_TOKEN = /\.(-?[_a-zA-Z][\w-]*)/g;
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// A simple selector standing in for a class: a tag or *, an :is()/:where()
// group, and/or attribute selectors.
const TAG = '(?:[a-zA-Z][\\w-]*|\\*)';
const IS = '(?::(?:is|where)\\((?:[^()]|\\([^()]*\\))*\\))';
const ATTR = '(?:\\[[^\\]]+\\])';
// Non-empty by construction, so `.a.b` against `[x][y]` splits one attribute
// to each class instead of handing both to the first.
const ALIAS = `(${TAG}${IS}?${ATTR}*|${IS}${ATTR}*|${ATTR}+)`;

function hasClassToken(part, cls) {
  for (const m of part.matchAll(CLASS_TOKEN)) if (m[1] === cls) return true;
  return false;
}

function partIsCovered(element, cls, part, parts) {
  // `:is(.C, [a])` / `:where(...)`: covered in place when a sibling item matches.
  for (const m of part.matchAll(/:(?:is|where)\(((?:[^()]|\([^()]*\))*)\)/g)) {
    const items = splitSelectorList(m[1]);
    if (items.includes('.' + cls) && items.some((it) => it !== '.' + cls && safeMatches(element, it))) return true;
  }
  // A twin elsewhere in the rule: the same selector with each class token
  // swapped for an alias. The alias in C's place must match the element.
  const tokens = [];
  let pattern = '';
  let last = 0;
  for (const m of part.matchAll(CLASS_TOKEN)) {
    pattern += escapeRe(part.slice(last, m.index)) + ALIAS;
    tokens.push(m[1]);
    last = m.index + m[0].length;
  }
  pattern += escapeRe(part.slice(last));
  const re = new RegExp('^' + pattern + '$');
  for (const other of parts) {
    if (other === part) continue;
    const m = other.match(re);
    if (!m) continue;
    let ok = false;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] !== cls) continue;
      const alias = m[i + 1];
      // An alias that weighs NOTHING -- a :where() group, or * -- does not
      // stand in for the class: the twin selector loses to rules the class
      // form beat. hero.css's golden rule is `.x-hero.x-hero--golden-ratio,
      // [x-hero]:where([goldenratio]...)`; the :where() twin is (0,1,0) against
      // (0,2,0), the hero's own min-height won, and a goldenRatio hero rendered
      // 480x576 instead of 1.618. A tag alias still counts: a base card IS its
      // <article> (a8a7362e), and `article` beside `.x-card--auto` is how
      // card.css says so.
      ok = !!alias && safeMatches(element, alias) && !weighsNothing(alias);
      if (!ok) break;
    }
    if (ok) return true;
  }
  return false;
}

/**
 * Does this simple-selector alias have zero specificity? Counts what CSS
 * counts: :where() adds nothing, :is()/:not() weigh their heaviest item, *
 * weighs nothing. Unparseable answers "yes" -- emitting the class is the safe
 * direction.
 */
function weighsNothing(alias) {
  try {
    const [a, b, c] = weightOf(alias);
    return a === 0 && b === 0 && c === 0;
  } catch {
    return true;
  }
}

function weightOf(selector) {
  let a = 0, b = 0, c = 0;
  let rest = selector.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, '');
  rest = rest.replace(/:(?:is|not|has)\(((?:[^()]|\([^()]*\))*)\)/g, (_, inner) => {
    let best = [0, 0, 0];
    for (const item of splitSelectorList(inner)) {
      const w = weightOf(item);
      if (w[0] > best[0] || (w[0] === best[0] && (w[1] > best[1] || (w[1] === best[1] && w[2] > best[2])))) best = w;
    }
    a += best[0]; b += best[1]; c += best[2];
    return '';
  });
  rest = rest.replace(/\[[^\]]*\]/g, () => { b++; return ''; });
  rest = rest.replace(/#[\w-]+/g, () => { a++; return ''; });
  rest = rest.replace(/\.[\w-]+/g, () => { b++; return ''; });
  rest = rest.replace(/::[\w-]+/g, () => { c++; return ''; });
  rest = rest.replace(/:[\w-]+/g, () => { b++; return ''; });
  if (/^[a-zA-Z][\w-]*/.test(rest.trim())) c++;
  return [a, b, c];
}

function safeMatches(element, selector) {
  try { return element.matches(selector); } catch { return false; }
}
