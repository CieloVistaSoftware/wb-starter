/**
 * Element matching shared by both runtimes.
 *
 * WHY THIS FILE EXISTS
 *
 * There are two engines on purpose: `wb.js` attaches behaviors eagerly and
 * `wb-lazy.js` defers them behind an IntersectionObserver. That split is a
 * real design decision and this does not change it.
 *
 * What the split did NOT need to duplicate is how an element is FOUND. Both
 * engines answer the same question -- "which elements under this root match
 * this selector" -- and each answered it independently, eight times between
 * them. The answers drifted:
 *
 *   wb.js       scan()    5 of 6 dispatch loops missed the root element
 *   wb.js       observe() handled the node itself, so it worked
 *   wb-lazy.js  scan()    2 loops fixed, the auto-inject loop still missed it
 *
 * `Element.querySelectorAll()` matches DESCENDANTS ONLY. So `WB.scan(el)` on
 * the element that CARRIES the behavior attribute found nothing, did nothing,
 * and resolved cleanly. Awaiting it could not help -- no work was scheduled.
 * The MutationObserver then swept the node a few hundred milliseconds later,
 * which made a deterministic no-op look like flakiness (#845).
 *
 * The fix is one line. It was written three separate times, correctly twice.
 * That is not a discipline problem, it is a structure problem: there were
 * eight places to remember. Now there is one.
 */

/**
 * Elements under `root` matching `selector`, INCLUDING `root` itself.
 *
 * @param {Element|Document|DocumentFragment} root
 * @param {string} selector
 * @returns {Element[]}
 */
export function matchingElements(root, selector) {
  const descendants = Array.from(root.querySelectorAll(selector));
  // Document and DocumentFragment have no matches(); only an Element can
  // itself be a hit, so the optional call is the guard.
  return root.matches?.(selector) ? [root, ...descendants] : descendants;
}
