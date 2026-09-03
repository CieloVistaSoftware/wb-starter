/**
 * Replacement guard — one rule, one file (#923).
 *
 * When auto-injection wants to add a behavior to an element that ALREADY
 * carries an explicit `x-*` behavior of the same family, only the explicit one
 * should run. `<article x-cardimage>` must render ONE card, not two.
 *
 * This lived in three places and was wrong in all of them:
 *
 *   1. wb.js's getAutoInjectBehavior() had the rule but nothing on the actual
 *      injection path called it.
 *   2. wb.js's two autoInjectMappings loops injected unconditionally, each
 *      carrying the comment "We don't check for other attributes here anymore."
 *   3. wb-lazy.js had its own copy gated on `hasBehavior(other)` — the module
 *      being REGISTERED at that instant. Under the lazy runtime it usually is
 *      not, which is exactly the #763 incident, so the guard missed and both
 *      behaviors ran.
 *
 * Deciding on the ATTRIBUTE rather than the registry is what makes this
 * independent of load order — the only way the race actually closes.
 */
import { behaviorModules } from '../wb-viewmodels/index.js';
import { logError } from './error-logger.js';

/** Framework directives that are not behaviors. */
const DIRECTIVES = new Set(['behavior', 'eager', 'hydrated', 'ignore', 'cloak']);

/**
 * The family a behavior belongs to, DERIVED — never restated.
 *
 * A behavior's family is the module it loads: index.js maps `article: 'card'`,
 * which is the system saying, in one place, that an <article> IS a card.
 * `card`, `cardimage` and `cardhero` all map to 'card' too, so they share a
 * root with it.
 *
 * #765 inferred this from the SPELLING of the names ("card -> cardportfolio")
 * and silently went inert when nativeMap moved article -> article (#880):
 * 'card'.startsWith('article') is false. A hand-written map would rot the same
 * way, so read the registry.
 *
 * `basename` because module values may be paths ('semantics/timeline').
 */
export function familyRoot(behavior) {
  const mod = behaviorModules[behavior];
  if (!mod) return behavior;
  return String(mod).split('/').pop() || behavior;
}

/**
 * Is `candidate` (a behavior auto-injection wants to add) REPLACED by an
 * explicit x-* behavior already on this element?
 *
 * Replacement vs addition, in #765's words:
 *   REPLACEMENT  <article x-cardportfolio>  cardportfolio IS a card. Both build
 *                a whole card, so running both renders it twice.
 *   ADDITIVE     <article x-ripple>         ripple decorates a card, it is not
 *                an alternative to one. Suppressing here would mean asking for
 *                a card with a ripple and getting only a ripple.
 *
 * @param {Element} element
 * @param {string} candidate behavior auto-injection proposes to add
 * @param {string} [prefix] attribute prefix, default 'x'
 * @returns {boolean} true when an explicit attribute already covers it
 */
export function isReplacedByExplicitBehavior(element, candidate, prefix = 'x') {
  const prefixAttr = `${prefix}-`;
  const family = familyRoot(candidate);

  // #967 -- John: "<input x-behavior=\"input\"> ... this should never happen."
  //
  // The loop below only inspects attribute NAMES beginning with `x-`, so
  // `x-behavior="textarea"` reaches it as the attribute named `behavior` and
  // never as the behavior named `textarea`. The commonest spelling of this
  // defect is therefore unguarded.
  //
  // THE CHECK IS WRITTEN AND DELIBERATELY NOT ENABLED. Turning it on reports
  // through logError(), and there are already 60 such usages in demos, pages,
  // src and tests (17 `<pre x-behavior="pre">`, 19 `<textarea>`, 8 `<table>`,
  // 7 `<code>`, 6 `<button>`, ...). Measured: enabling it flooded every page
  // carrying one and broke 74 tests -- `all-demos-smoke`,
  // `every-page-loads-without-errors`, `dark-mode`, `doc-viewer-code-panel` and
  // others all assert "no JS errors on this page", and a new error is still an
  // error however correct it is.
  //
  // Order matters: clean the 60 usages FIRST, then enable this, so it only ever
  // fires on a mistake someone just made. Enabling it now would mean 60 known
  // problems shouting on every page load, which is how a real signal gets
  // muted. Note `<span x-behavior="chip">` and `<button x-behavior="tooltip">`
  // are NOT redundant and must stay silent -- span maps to nothing, and tooltip
  // is a different behavior. #967 carries the cleanup.

  for (const attr of element.attributes) {
    if (!attr.name.startsWith(prefixAttr)) continue;
    const other = attr.name.slice(prefixAttr.length);
    if (other === candidate) continue;                 // its own attribute (#746)
    if (DIRECTIVES.has(other) || other.endsWith('-init')) continue;
    if (other.startsWith(family)) {
      // John: "if a behavior is an unknown duplicate ... a runtime error
      // should tell the user they don't need both."
      //
      // Only the EXACT duplicate qualifies. `<article x-cardimage>` is not
      // redundant: <article> gives you a card and x-cardimage selects a
      // variant, so the attribute earns its place. `<article x-card>` is --
      // the tag already means card, so the attribute adds nothing.
      if (other === family) reportRedundant(element, other);
      return true;
    }
  }
  return false;
}

/** Elements already reported, so a re-scan does not log the same host twice. */
const reported = new WeakSet();

/**
 * Tell the author they wrote the same behavior twice (#935).
 *
 * Reported through logError() -- the framework's own channel, which the Error
 * Log page reads -- rather than console.warn, so it is visible where users
 * already look for problems. Once per element: scan() and the MutationObserver
 * both reach the same host, and a repeated message reads like a repeated bug.
 */
function reportRedundant(element, attrBehavior, authored = `x-${attrBehavior}`) {
  if (reported.has(element)) return;
  reported.add(element);

  const tag = element.tagName.toLowerCase();
  // #967: quote what the author actually WROTE. The same redundancy has two
  // spellings -- `x-textarea` and `x-behavior="textarea"` -- and telling someone
  // to remove an attribute they did not write is a worse bug than the one being
  // reported: they search the file, find nothing, and learn to ignore the message.
  logError(
    `<${tag} ${authored}> says the same thing twice: <${tag}> already IS ` +
    `the ${attrBehavior} behavior, so ${authored} adds nothing. ` +
    `Drop it and keep <${tag}> -- the behavior still runs.`,
    { source: 'replacement-guard', element: tag, behavior: attrBehavior, authored, redundant: true }
  );
}
