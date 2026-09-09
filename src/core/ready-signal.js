/**
 * ready-signal.js — "this element finished building", kept internal
 * =================================================================
 * #1094. John, looking at rendered markup:
 *
 *   <img src="…" alt="Prime lens on a wooden desk" class="x-img" x-ready="">
 *
 * "x-ready should only be an internal signal."
 *
 * He is right, and the numbers are stark. `x-ready` was stamped onto every
 * element the runtime touched, and:
 *
 *   CSS rules using it .................. 0
 *   runtime code READING it ............. 0   (four src/ files mention it only
 *                                              in comments)
 *   test specs waiting on it ............ 55
 *
 * A test hook, downloaded by every visitor, on every element.
 *
 * WHAT IT MEANS, AND WHY THAT IS WORTH KEEPING
 *
 * SETTLED, not SUCCEEDED. A behavior that threw is still finished, so it is
 * still marked ready; failure is reported separately via `x-error`. Conflating
 * "done" with "worked" would make the signal lie in the one case that matters
 * most.
 *
 * That distinction is load-bearing. #1075 established that `await WB.scan()`
 * resolved on a half-built page — the auto-inject loop dropped its promises — so
 * `WB.ready` was not trustworthy. Per-element readiness is why 55 specs could
 * assert anything at all in the meantime.
 *
 * SO: KEEP THE KNOWLEDGE, DROP THE BROADCAST
 *
 * Readiness lives in a WeakSet here, queryable through `WB.isReady(el)`. The DOM
 * attribute is written ONLY when something explicitly asks for it, which in
 * practice is the test harness via `page.addInitScript`.
 *
 * Deleting the attribute outright was the other option and is worse: 55 specs
 * would go red at once, and #1091 is the record of what happens when tests lose
 * the ability to observe what they assert — they do not fail loudly, they
 * quietly stop asserting.
 */

/**
 * Elements that have finished injection. WeakSet, so a removed element is
 * collected rather than pinned alive by our own bookkeeping.
 */
const ready = new WeakSet();

/**
 * Is the DOM attribute wanted?
 *
 * Off in production. The test harness turns it on before any page script runs,
 * so `[x-ready]` selectors keep working there and nowhere else.
 */
export function exposesReadyAttribute() {
  try {
    if (typeof window === 'undefined') return false;   // SSR, worker, node import
    if (window.__WB_EXPOSE_READY__ === true) return true;

    // `navigator.webdriver` is true in an automated browser and false in a real
    // one — it is the platform's own answer to "is a robot driving this?".
    //
    // Chosen over asking 55 spec files to opt in, for a reason worth stating:
    // an opt-in that each spec must remember is one a new spec will forget, and
    // it fails by the test SILENTLY not waiting — the #1091 shape, where a check
    // stops checking and still reports success. Nobody has to remember this.
    return navigator?.webdriver === true;
  } catch {
    return false;
  }
}

/**
 * Mark an element settled. Called by both runtimes at the same point, so a test
 * written once runs against either — one contract in one place, which is what
 * #923 and #951 were about.
 *
 * @param {Element} element
 */
export function markReady(element, detail = {}) {
  if (!element) return;
  ready.add(element);

  // THE SIGNAL IS AN EVENT. #1094 — John: "minimally x-ready is an event, or a
  // notification; it's not meant to be at any other layer."
  //
  // That is the correction that matters, and my first fix missed it. An
  // attribute is STATE — a fact that persists and can be read at any later
  // moment. Readiness is not state; it is a MOMENT, the instant building
  // finished. Modelling a moment as an attribute is why this ended up in the
  // shipped DOM at all: once it is a fact on the element, it has to live
  // somewhere, and "somewhere" was every visitor's markup.
  //
  // As an event it has no resting place. It fires, whoever cares hears it, and
  // nothing is left behind. Bubbling so a container can wait for its subtree
  // without binding to each child, matching wb:accordion:ready and the rest of
  // the wb: family.
  if (element.isConnected && typeof CustomEvent === 'function') {
    element.dispatchEvent(new CustomEvent('wb:ready', {
      bubbles: true,
      detail: { element, ...detail },
    }));
  }

  // MIGRATION BRIDGE, not the design. 55 specs select on `[x-ready]`, and
  // deleting it in one move would turn all of them green-and-asserting-nothing
  // rather than red — the #1091 failure mode. Written only under automation
  // until those specs move to `wb:ready` / WB.isReady(), then removed.
  if (exposesReadyAttribute() && element.isConnected) {
    element.setAttribute('x-ready', '');
  }
}

/**
 * Has this element finished building? Settled, not necessarily successful.
 *
 * @param {Element} element
 * @returns {boolean}
 */
export function isReady(element) {
  if (!element) return false;
  // The attribute still counts when present: markup can arrive server-rendered
  // or from a previous run with the flag on, and disagreeing with the DOM in
  // front of us would be its own defect.
  return ready.has(element) || (element.hasAttribute?.('x-ready') ?? false);
}
