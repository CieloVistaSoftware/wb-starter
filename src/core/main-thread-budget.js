/**
 * main-thread-budget.js — keep the runtime's build work out of long tasks (#961)
 * =============================================================================
 *
 * WHY THIS EXISTS, measured rather than assumed: on
 * tests/fixtures/cards-permutation-matrix.html the lazy runtime built every
 * card, demo and code panel near the viewport in ONE main-thread task of 1.4s
 * to 4.5s (PerformanceObserver 'longtask'). Nothing in it was a loop the code
 * wrote: each WB.inject() awaits its behavior module, and once that module is
 * cached the await resolves as a MICROTASK. Hundreds of injections, the
 * MutationObserver deliveries they caused and the DOM they built all ran in
 * the same microtask checkpoint, and a browser cannot paint, answer input or
 * run anything else until a checkpoint drains. A test's `locator.evaluate()`
 * waited behind it for seconds, which is the intermittent
 * card-variant-surface.spec.ts failure.
 *
 * WHAT IT DOES: work is measured in SLICES. A slice starts the first time
 * anything asks within a task; once it has run for SLICE_BUDGET_MS, the next
 * caller waits for a fresh task (a MessageChannel message — not setTimeout(0),
 * which is clamped to 4ms once nested). The caller must re-check
 * synchronously, right before doing the work:
 *
 *     while (sliceOverBudget()) await nextSlice();
 *     doTheExpensiveSynchronousPart();
 *
 * A helper that awaited internally and then returned would hand control back
 * one microtask late, after every other waiter had already passed the same
 * check, and they would all run in one task again.
 *
 * WHY 50ms: the browser's own definition of a long task. Measured on both
 * card pages at 24, 50 and 100ms: the longest script entry stayed ~100ms
 * either way (the unit running when the budget runs out finishes first), but
 * 24ms handed the page back so often that each slice was followed by the
 * browser restyling a page of thousands of elements, and the bordered card
 * took up to twice as long to build. 50ms kept the build time near main's.
 *
 * scheduler.yield() was tried first and dropped: its continuations outrank
 * ordinary tasks, so a page with hundreds of queued injections starved
 * everything else, and evaluates from a test waited up to 5.9s.
 */

export const SLICE_BUDGET_MS = 50;

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

let sliceStart = -1;
let sliceGen = 0;
/** @type {Promise<void> | null} */
let pending = null;

/** Run `fn` in a later task, ahead of timers. */
function postTask(fn) {
  const Channel = globalThis.MessageChannel;
  if (typeof Channel === 'function') {
    const ch = new Channel();
    ch.port1.onmessage = () => { ch.port1.close(); fn(); };
    ch.port2.postMessage(0);
  } else {
    setTimeout(fn, 0);
  }
}

function startSlice() {
  sliceStart = now();
  const gen = ++sliceGen;
  // The slice belongs to this task: forget it at the next task boundary, so a
  // later, unrelated task starts with a full budget instead of an old clock.
  postTask(() => { if (gen === sliceGen) sliceStart = -1; });
}

/**
 * Has the current task's slice used its budget? Starts a slice if none is
 * running. Synchronous on purpose (see the header).
 * @returns {boolean}
 */
export function sliceOverBudget() {
  if (sliceStart < 0) { startSlice(); return false; }
  return now() - sliceStart >= SLICE_BUDGET_MS;
}

/**
 * Resolve in a new task, with a fresh slice started. Every caller waiting in
 * the same round shares one yield.
 * @returns {Promise<void>}
 */
export function nextSlice() {
  if (!pending) {
    pending = new Promise((resolve) => postTask(resolve)).then(() => {
      pending = null;
      startSlice();
    });
  }
  return pending;
}
