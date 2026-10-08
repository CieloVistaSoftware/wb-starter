/**
 * latest-wins.js — only the newest run of an async job may write its result.
 * ===========================================================================
 *
 * A job the reader can start again before it finishes -- a navigation, a
 * Behaviors-page render, a doc fetch -- has the same trap every time: each run
 * awaits something (a fetch, a module, a scan), and the runs finish in whatever
 * order those resolve, not the order they were asked for. Unguarded, the LAST
 * to finish paints the screen, which is often the one the reader already moved
 * on from:
 *
 *   - #1519: a slow older navigation painted over the page asked for after it.
 *   - #1488: a slow doc landed under the behavior picked after it.
 *   - #950/#771: the Behaviors panel showed one row's header over another
 *     row's source.
 *
 * Each of those was fixed with its own hand-rolled counter (site-engine's
 * `_navSeq`, behaviors.html's `renderSeq`, the doc panel's node check). This is
 * the one implementation they share, so a new async feature gets the guard by
 * calling it instead of rediscovering the bug.
 *
 *   const docs = latestWins();
 *   async function showDoc(name) {
 *     const run = docs.begin();              // supersedes any earlier run
 *     const res = await fetch(url, { signal: run.signal });
 *     const md = await res.text();
 *     if (!run.isCurrent()) return;          // a newer run owns the screen
 *     panel.innerHTML = render(md);
 *   }
 *
 * begin() is synchronous: take the ticket BEFORE the first await, or a run
 * started in between could be mistaken for this one.
 *
 * Starting a run aborts the previous run's `signal`, so a superseded fetch is
 * cancelled instead of finishing for nobody. A fetch aborted that way rejects
 * with an AbortError; `run.isCurrent()` is already false by then, so the caller
 * drops it like any other stale result (isAbort() tells the two apart where a
 * catch block needs to).
 */

/**
 * @typedef {object} Run
 * @property {number} id         1 for the first run, then 2, 3, ...
 * @property {AbortSignal|null} signal aborted once a newer run begins (null where AbortController is missing)
 * @property {() => boolean} isCurrent true while no newer run has begun
 */

/**
 * Create a latest-wins guard for one job.
 * @returns {{ begin: () => Run, current: () => Run | null, cancel: () => void }}
 */
export function latestWins() {
  let seq = 0;
  /** @type {Run | null} */
  let latest = null;
  /** @type {AbortController | null} */
  let controller = null;

  const abortPrevious = () => {
    if (controller) controller.abort();
    controller = null;
  };

  /** Start a run; every earlier run stops being current and its signal aborts. */
  function begin() {
    abortPrevious();
    controller = typeof AbortController === 'function' ? new AbortController() : null;
    const id = ++seq;
    latest = {
      id,
      signal: controller ? controller.signal : null,
      isCurrent: () => id === seq,
    };
    return latest;
  }

  /** The newest run, or null before the first. */
  function current() {
    return latest;
  }

  /** Supersede every run without starting a new one (e.g. the panel is closed). */
  function cancel() {
    abortPrevious();
    seq++;
    latest = null;
  }

  return { begin, current, cancel };
}

/**
 * Was this rejection a superseded run's fetch being aborted?
 * @param {unknown} err
 */
export function isAbort(err) {
  return !!err && typeof err === 'object' && /** @type {any} */ (err).name === 'AbortError';
}
