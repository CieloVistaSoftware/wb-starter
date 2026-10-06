/**
 * runtime-shared.js — the code both runtimes run, written once (#883).
 *
 * src/core/wb.js (the eager runtime) and src/core/wb-lazy.js (the lazy one)
 * each carried their own word-for-word copy of the pieces below: the in-flight
 * bookkeeping around an injection, marking a failed one, remove(), the
 * readiness API, starting and stopping the DOM observer, the options both
 * init()s read, and init()'s first scan. John: "no duplicates of any code
 * allowed." One contract implemented twice and drifting is how #923 and #951
 * happened, so each lives here once and both runtimes call it.
 *
 * tests/compliance/no-duplicate-code-blocks.spec.ts holds src/ at zero
 * duplicated blocks.
 */
import { Events } from './events.js';
import { isReady } from './ready-signal.js';

/**
 * Record that `behaviorName` is being injected into `element`, so a second
 * caller can await the first instead of injecting twice.
 *
 * @param {WeakMap<Element, Map<string, Promise<void>>>} inFlight
 * @param {Element} element
 * @param {string} behaviorName
 * @returns {() => void} settle: call once the injection has finished, either way
 */
export function beginInFlight(inFlight, element, behaviorName) {
  let settle = () => {};
  const done = new Promise((resolve) => { settle = resolve; });
  if (!inFlight.has(element)) inFlight.set(element, new Map());
  inFlight.get(element).set(behaviorName, done);
  return settle;
}

/**
 * An injection threw: report it with its stack, and mark the element so the
 * failure is visible in the DOM (`x-error`). Settled is not succeeded (#1094).
 *
 * @param {Element} element
 * @param {string} behaviorName
 * @param {unknown} error
 * @param {{ report?: boolean }} [opts] - report: false when the error was already logged
 */
export function failInjection(element, behaviorName, error, { report = true } = {}) {
  if (report) {
    Events.error(`WB:${behaviorName}`, error, {
      element: element.tagName,
      id: element.id,
      behavior: behaviorName,
    });
  }
  element.setAttribute('x-error', 'true');
}

/**
 * Remove one behavior from `element`, or every behavior when `behaviorName` is
 * null, running each cleanup.
 *
 * @param {WeakMap<Element, Array<{ name: string, cleanup?: Function }>>} applied
 * @param {Element} element
 * @param {string|null} behaviorName
 * @param {(name: string) => void} [onRemoved] - told each behavior removed
 */
export function removeApplied(applied, element, behaviorName, onRemoved = () => {}) {
  const elementBehaviors = applied.get(element);
  if (!elementBehaviors) return;

  if (behaviorName) {
    const index = elementBehaviors.findIndex((b) => b.name === behaviorName);
    if (index !== -1) {
      const { cleanup } = elementBehaviors[index];
      if (typeof cleanup === 'function') cleanup();
      elementBehaviors.splice(index, 1);
      onRemoved(behaviorName);
    }
  } else {
    elementBehaviors.forEach(({ name, cleanup }) => {
      if (typeof cleanup === 'function') cleanup();
      onRemoved(name);
    });
    applied.delete(element);
  }
}

/**
 * Give a runtime object the readiness API (#961/#962): pendingCount,
 * pendingBehaviors, whenIdle() and settled(). Both runtimes expose the same
 * contract, so tests and pages can wait on building being over instead of on
 * a `waitForTimeout` guess.
 *
 * - `pendingCount`: injections in flight right now. Zero does NOT mean "the
 *   page is finished": the lazy runtime defers below-the-fold elements on
 *   purpose, and the eager runtime's MutationObserver may start the next round
 *   on a later task. Use whenIdle(), which requires the zero to hold.
 * - `pendingBehaviors`: which behaviors are in flight, e.g. "card x3, table".
 *   A stuck readiness signal has to say what it is stuck on.
 * - `whenIdle({ timeout, quiet })`: resolves once nothing has been in flight
 *   for `quiet` ms; rejects on timeout rather than resolving, because a
 *   readiness signal that gives up quietly turns a hung build into a green test.
 * - `settled(callbackOrOptions, options)`: resolves when every unit of work has
 *   called back. Promise, callback, or listen for `wb:settled`.
 * - `isReady(element)`: has this element finished building (#1094)? The
 *   answer lives in ready-signal.js, not in an attribute on the element. It was
 *   on the eager runtime only, so a page run by wb-lazy.js could not ask.
 *
 * @param {object} runtime - the WB object
 * @param {{ count(): number, describe(): string, whenIdle(o?: object): Promise<void> }} tracker
 * @param {(cb?: unknown, o?: unknown) => Promise<void>} settledCall
 */
export function installReadiness(runtime, tracker, settledCall) {
  Object.defineProperties(runtime, {
    pendingCount: { get: () => tracker.count(), enumerable: true, configurable: true },
    pendingBehaviors: { get: () => tracker.describe(), enumerable: true, configurable: true },
    whenIdle: { value: (options) => tracker.whenIdle(options), writable: true, enumerable: true, configurable: true },
    settled: { value: (cb, options) => settledCall(cb, options), writable: true, enumerable: true, configurable: true },
    isReady: { value: (element) => isReady(element), writable: true, enumerable: true, configurable: true },
  });
}

/**
 * Start `observer` on `root` for added nodes and changed attributes, and keep
 * it on the runtime so disconnect() can find it.
 *
 * @param {{ _observer?: MutationObserver|null }} runtime
 * @param {MutationObserver} observer
 * @param {Node} root
 * @param {string[]} attributeFilter
 * @returns {MutationObserver}
 */
export function startObserving(runtime, observer, root, attributeFilter) {
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter,
  });
  runtime._observer = observer;
  return observer;
}

/** Stop the observer startObserving() kept on the runtime. */
export function stopObserving(runtime) {
  if (runtime._observer) {
    runtime._observer.disconnect();
    runtime._observer = null;
  }
}

/**
 * The init() options both runtimes read, with their shared defaults.
 * `autoInject` has no default here: each runtime's setConfig() call decides
 * what an absent value means.
 *
 * @param {object} options
 */
export function commonInitOptions(options = {}) {
  const {
    scan: shouldScan = true,
    observe: shouldObserve = true,
    theme = null,
    debug = false,
    autoInject,
  } = options;
  return { shouldScan, shouldObserve, theme, debug, autoInject };
}

/**
 * init()'s first scan and observer start, identical in both runtimes.
 *
 * `runtime.ready` is the handle a page or test awaits for the first build
 * (#962). The `loading` branch deliberately does NOT await: init() must keep
 * returning without waiting for DOMContentLoaded; awaiting there would defer
 * the rest of init and change boot timing for every page. The promise is only
 * retained, not waited on.
 *
 * @param {{ ready?: Promise<unknown>, scan(): Promise<unknown>, observe(): unknown }} runtime
 * @param {boolean} shouldScan
 * @param {boolean} shouldObserve
 */
export async function bootDocument(runtime, shouldScan, shouldObserve) {
  if (shouldScan && typeof document !== 'undefined') {
    runtime.ready = document.readyState === 'loading'
      ? new Promise((resolve) => {
          document.addEventListener('DOMContentLoaded', () => resolve(runtime.scan()));
        })
      : runtime.scan();
    if (document.readyState !== 'loading') await runtime.ready;
  } else {
    runtime.ready = Promise.resolve();
  }

  if (shouldObserve && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => runtime.observe());
    } else {
      runtime.observe();
    }
  }
}
