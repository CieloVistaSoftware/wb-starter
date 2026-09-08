/**
 * injection-tracker.js — the runtime's idle signal (#961 / #962)
 * ==============================================================
 *
 * Both runtimes already tracked in-flight injections and neither could report
 * on them: wb.js keeps a `WeakMap` (which cannot even be counted) and
 * wb-lazy.js a `Map` keyed by element. So "wait until WB has finished
 * building" was unexpressable from outside, and 491 `waitForTimeout` calls in
 * tests/ guess at a DURATION instead. A guess about duration is wrong whenever
 * the machine is slower than the guess — which is #961, ~20 tests changing
 * state between identical runs.
 *
 * This is ONE implementation imported by both runtimes rather than the same
 * idea written twice. A contract implemented in two places drifts, which is
 * exactly how #923 and #951 happened, and #970's own comment says so.
 *
 * WHAT IDLE MEANS: no injection is in flight ON AN ELEMENT THAT IS STILL IN THE
 * DOCUMENT. It does NOT mean "everything on the page is injected" —
 * wb-lazy.js defers below-the-fold elements to an IntersectionObserver
 * deliberately, so a test that cares about one of those must scroll first and
 * then await idle (or await that element's `x-ready`).
 *
 * WHY "STILL IN THE DOCUMENT" IS PART OF IT, measured rather than assumed:
 * `page.setContent()` (document.open/write/close, used by 29 spec files right
 * after a goto) rips the SPA's boot elements out mid-injection. Those
 * injections can never complete and can never affect anything a test looks at,
 * but a naive counter counts them forever. Measured 2026-09-08, whenIdle
 * rejecting on a page that was otherwise perfectly built:
 *
 *   WB.whenIdle: 22 injection(s) still in flight after 15000ms —
 *   ripple x14, release, themecontrol, notes, button x3, header, footer
 *
 * — every one of them on an element that had been destroyed. Counting work
 * that cannot change the live document makes the signal useless exactly where
 * it is needed. Held via WeakRef so an abandoned injection cannot leak its
 * element either.
 *
 * WHY A QUIET WINDOW: the counter legitimately touches zero mid-build. The
 * MutationObserver in observe() only sees a behavior's inserted nodes on a
 * LATER task, so injection A can finish (count 0) before the injections it
 * caused have started. Resolving on the first zero would hand back the same
 * mid-construction sample the sleeps do. `quiet` requires the zero to HOLD;
 * it is bounded by real work finishing, not a guess at how long work takes.
 * It also re-reads the count at the end of the window, so an element that was
 * briefly detached while a behavior rebuilt it is counted again on its return.
 *
 * WHY IT REJECTS: nothing dies silently. A whenIdle() that quietly resolved on
 * timeout would turn a hung build into a passing test, which is the failure
 * mode this whole file exists to remove.
 */

/**
 * @typedef {{ name: string, ref: any }} InjectionRecord
 */

/**
 * Create an injection tracker.
 */
export function createInjectionTracker() {
  /** @type {Set<InjectionRecord>} */
  const inFlight = new Set();
  /** @type {Set<() => void>} */
  const waiters = new Set();

  const canWeakRef = typeof WeakRef === 'function';

  /**
   * Is this injection still able to change the live document?
   * No element recorded -> counted, because we cannot prove otherwise and a
   * signal must never under-report. Element collected -> definitely gone.
   * @param {InjectionRecord} rec
   */
  function isLive(rec) {
    if (!rec.ref) return true;
    const el = canWeakRef ? rec.ref.deref() : rec.ref;
    if (!el) return false;
    return el.isConnected !== false;
  }

  /**
   * @param {string} [behaviorName]
   * @param {any} [element]
   * @returns {InjectionRecord} pass it back to end()
   */
  function start(behaviorName = '?', element = null) {
    const ref = element ? (canWeakRef ? new WeakRef(element) : element) : null;
    /** @type {InjectionRecord} */
    const rec = { name: behaviorName, ref };
    inFlight.add(rec);
    return rec;
  }

  function count() {
    let n = 0;
    for (const rec of inFlight) if (isLive(rec)) n++;
    return n;
  }

  /**
   * What is in flight right now, as `name xN` strings. "Timed out" on its own
   * has cost this project enough time already — a stuck readiness signal must
   * say what it is stuck on.
   * @returns {string}
   */
  function describe() {
    /** @type {Map<string, number>} */
    const byName = new Map();
    for (const rec of inFlight) {
      if (!isLive(rec)) continue;
      byName.set(rec.name, (byName.get(rec.name) || 0) + 1);
    }
    const parts = [];
    for (const [name, n] of byName) parts.push(n > 1 ? `${name} x${n}` : name);
    return parts.length ? parts.join(', ') : 'nothing';
  }

  /** @param {InjectionRecord} rec */
  function end(rec) {
    if (rec) inFlight.delete(rec);
    if (count() === 0 && waiters.size > 0) {
      // Snapshot and clear before notifying: a waiter that re-arms (because
      // the zero did not hold) must land in the NEXT round, not this one.
      const round = Array.from(waiters);
      waiters.clear();
      for (const notify of round) notify();
    }
  }

  /**
   * Resolve once no live injection has been in flight for `quiet` milliseconds.
   *
   * @param {{ timeout?: number, quiet?: number }} [options]
   * @returns {Promise<void>} rejects if still busy after `timeout` ms
   */
  function whenIdle({ timeout = 10000, quiet = 50 } = {}) {
    return new Promise((resolve, reject) => {
      let settled = false;
      /** @type {any} */
      let quietTimer = null;

      const deadlineTimer = setTimeout(() => {
        if (settled) return;
        settled = true;
        waiters.delete(onZero);
        clearTimeout(quietTimer);
        reject(new Error(
          `WB.whenIdle: ${count()} injection(s) still in flight after ${timeout}ms — ` +
          `${describe()}. On the lazy runtime an element below the fold is not ` +
          `injected until it intersects — scroll to it first, then await idle.`
        ));
      }, timeout);

      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(deadlineTimer);
        waiters.delete(onZero);
        resolve();
      };

      // Confirm the zero HOLDS. If work restarted during the window, go back
      // to waiting for the next zero rather than resolving on a gap.
      const confirmQuiet = () => {
        clearTimeout(quietTimer);
        quietTimer = setTimeout(() => {
          if (settled) return;
          if (count() === 0) finish();
          else waiters.add(onZero);
        }, quiet);
      };

      const onZero = () => { if (!settled) confirmQuiet(); };

      if (count() === 0) confirmQuiet();
      else waiters.add(onZero);
    });
  }

  return { start, end, count, describe, whenIdle };
}
