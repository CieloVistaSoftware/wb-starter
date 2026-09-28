/**
 * Which class names the loaded stylesheets actually define.
 * -----------------------------------------------------------------------------
 * #885: two places independently mapped a declared enum property to a modifier
 * class -- wb.js's applyDeclaredModifiers() (#770) and schema-builder.js's
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
      for (const sheet of Array.from(sheets)) {
        let rules;
        // A cross-origin sheet throws here. Skip it rather than treat it as
        // empty -- an unreadable sheet is unknown, not absent.
        try { rules = sheet.cssRules; } catch { continue; }
        if (!rules) continue;
        const walk = (list) => {
          for (const rule of Array.from(list)) {
            if (rule.cssRules) { walk(rule.cssRules); continue; }
            if (!rule.selectorText) continue;
            for (const m of rule.selectorText.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) found.add(m[1]);
          }
        };
        walk(rules);
      }
      cache = found;
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
  cachedSheetCount = -1;
}
