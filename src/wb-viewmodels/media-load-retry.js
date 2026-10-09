/**
 * attachVideoLoadRetry / attachImageLoadRetry
 * ---------------------------------------------------------------------------
 * A real <video>/<img>'s src can fail to actually produce a playable frame
 * for reasons that never surface anywhere visible: a flaky/slow external
 * host, a transient network blip, an ad-blocker, a CORS hiccup -- the
 * element just sits there as an empty box forever, with nothing to explain
 * why (#335, extended to images per John: "video and image cards are not
 * rendering did you put in retry?").
 *
 * Both verify the element actually loads (via its native 'error' event AND
 * a timeout-based readiness check, since some failures never fire 'error'
 * at all) and retry with exponential backoff, up to maxAttempts total
 * attempts, before giving up. On final failure, marks the element with a
 * `--load-failed` class (see src/styles/behaviors/card.css) and dispatches
 * a bubbling custom event, so a silent empty box always becomes a visible,
 * diagnosable state instead.
 *
 * Shared by cardvideo()/cardimage() (card.js) and the native <video>/<img>
 * behaviors (semantics/video.js, semantics/img.js) -- all four create/own a
 * real media element and had this exact gap independently.
 */
// Always-on (not gated behind WB_DEBUG) -- media load failures are exactly
// the "well-known thing that should always be traceable" class of event
// John asked for: no ack in the console previously meant no way to tell
// "still retrying" from "silently broken" without instrumenting by hand
// each time. [WB:media-retry] is a fixed, greppable prefix.
import { logError } from '../core/error-logger.js';
import { reportIfThirdPartyMedia } from './media-unreachable.js';

function traceLabel(el) {
  const tag = el.tagName.toLowerCase();
  return el.id ? `<${tag} id="${el.id}">` : `<${tag}>`;
}

function attachLoadRetry(el, config) {
  const { maxAttempts = 5, baseDelayMs = 500, checkTimeoutMs = 4000 } = config.options || {};

  let attempt = 1;
  let settled = false;
  let checkTimer = null;
  const startedAt = Date.now();

  function clearCheckTimer() {
    if (checkTimer) { clearTimeout(checkTimer); checkTimer = null; }
  }

  function cleanup() {
    clearCheckTimer();
    el.removeEventListener('error', onError);
    config.successEvents.forEach(evt => el.removeEventListener(evt, onSuccess));
  }

  function onSuccess() {
    if (settled) return;
    settled = true;
    if (attempt > 1) {
      console.warn(`[WB:media-retry] ${config.label} RECOVERED after ${attempt} attempt(s), ${Date.now() - startedAt}ms -- ${traceLabel(el)} src=${config.currentSrc(el)}`);
    }
    el.classList.remove(config.failedClass);
    cleanup();
  }

  function giveUp() {
    settled = true;
    console.warn(`[WB:media-retry] ${config.label} GAVE UP after ${attempt} attempts, ${Date.now() - startedAt}ms -- ${traceLabel(el)} src=${config.currentSrc(el)} -- showing "unavailable" fallback`);
    cleanup();
    el.classList.add(config.failedClass);
    // CSS ::after generated content does not reliably paint on replaced
    // elements (<video>/<img>) in any browser -- confirmed live: the class
    // applied correctly but nothing rendered, just the native (empty)
    // video/broken-image UI. A real sibling element is the only dependable
    // way to show something. Hide the failed element itself so its native
    // "broken" chrome (video controls with nothing to play, browken-image
    // icon) doesn't sit next to the message looking doubly broken.
    // Hidden by its failedClass (ui-utils.css), not style.display (#779).
    // The message is a part of the media element it stands in for:
    // x-img__load-failed or x-video__load-failed, named by the caller (#1096).
    if (!el.nextElementSibling || !el.nextElementSibling.classList.contains(config.messageClass)) {
      const msg = document.createElement('div');
      msg.classList.add(config.messageClass);
      msg.textContent = `⚠ ${config.label} unavailable`;
      el.insertAdjacentElement('afterend', msg);
    }
    el.dispatchEvent(new CustomEvent(config.failedEvent, {
      bubbles: true,
      detail: { src: config.currentSrc(el), attempts: attempt }
    }));

    // John: "put in runtime errors on image fails."
    //
    // Everything above is a console.warn plus a class and an event -- none of
    // which error-logger.js captures, so an image that never loaded left no
    // entry in the error log and never showed up in CI's JS-errors check. A
    // media file that is missing or unreachable after every retry is a real
    // defect in the page, not a warning.
    //
    // Thrown asynchronously so it reaches window.onerror (which error-logger
    // listens on) WITHOUT unwinding this function -- the fallback UI above has
    // already been applied, and throwing inline would skip the cleanup that
    // callers depend on. Same convention cardoverlay/cardhero/audio already
    // use for their own load failures.
    const failedSrc = config.currentSrc(el);

    // #1115: someone else's server being unreachable is not a defect in this
    // page. The fallback, class and failed event above still applied; the
    // report goes to the element (warning + error="unreachable" + event)
    // instead of the error log. A same-origin failure falls through and stays
    // loud, which is what #763 and "put in runtime errors on image fails" need.
    if (reportIfThirdPartyMedia(el, failedSrc, config.label)) return;

    // #763 -- John, at a "Video unavailable" placeholder: "Where's the runtime
    // error?"
    //
    // It was thrown, and it still reached nobody. The throw below is caught by
    // window.onerror, and error-logger only listens there once
    // setupGlobalErrorHandler() has run -- which happens inside WB.init(). Any
    // page that calls WB.scan() without init() (demos/playground.html does
    // exactly that: `WB.init` is deferred behind ensureWB()) installs no
    // handler, so the throw hit the default handler, printed to devtools, and
    // left no entry anywhere the user can see.
    //
    // logError() is the framework's own channel and is what the Error Log page
    // reads. Calling it directly makes the report unconditional instead of
    // contingent on another subsystem having been initialised first. The throw
    // is kept as well: it carries a stack to devtools, which the log entry
    // does not.
    logError(
      `${config.label} failed to load after ${attempt} attempt(s): ` +
      `${failedSrc || '(no src)'} -- the file is missing or unreachable.`,
      { source: 'media-load-retry', element: traceLabel(el), src: failedSrc, attempts: attempt }
    );

    setTimeout(() => {
      throw new Error(
        `${config.label}: failed to load ${failedSrc || '(no src)'} after ${attempt} attempt(s) -- ` +
        `the file is missing or unreachable. Showing the "unavailable" fallback.`
      );
    }, 0);
  }

  // An element no longer in the document can never be shown, so it is not a
  // load failure: the Behaviors page replaces its example on every row click,
  // and a replaced <img> that had not finished loading was retried five times
  // and then logged as "missing or unreachable" (CI error-log-empty, #997).
  function detached() {
    if (el.isConnected) return false;
    settled = true;
    cleanup();
    return true;
  }

  function retry() {
    if (settled || detached()) return;
    if (attempt >= maxAttempts) { giveUp(); return; }
    const delay = baseDelayMs * Math.pow(2, attempt - 1);
    console.warn(`[WB:media-retry] ${config.label} attempt ${attempt}/${maxAttempts} not ready -- retrying in ${delay}ms -- ${traceLabel(el)} src=${config.currentSrc(el)}`);
    attempt++;
    setTimeout(() => {
      if (settled || detached()) return;
      config.reload(el);
      scheduleCheck();
    }, delay);
  }

  function onError(ev) {
    clearCheckTimer();
    console.warn(`[WB:media-retry] ${config.label} 'error' event -- ${traceLabel(el)} src=${config.currentSrc(el)}`, el.error || ev);
    retry();
  }

  function scheduleCheck() {
    clearCheckTimer();
    checkTimer = setTimeout(() => {
      if (settled) return;
      if (config.isReady(el)) {
        onSuccess();
      } else {
        retry();
      }
    }, checkTimeoutMs);
  }

  el.addEventListener('error', onError);
  config.successEvents.forEach(evt => el.addEventListener(evt, onSuccess));

  // #1342 -- the same timing #1136 fixed in audio.js, now for the shared helper.
  //
  // A media element starts fetching the moment it is parsed; the lazy runtime
  // (#491) only enhances it much later. The one 'error' event does not queue,
  // so by the time the listener above exists the failure can already be over
  // and done with. Nothing below read the element's CURRENT state, so an
  // already-failed element was not noticed until the first checkTimeoutMs
  // (4s) elapsed, and only then started walking the retry ladder -- roughly
  // 25-30s of a dead player or broken image saying nothing (the ~28s symptom
  // recorded on #371).
  //
  // config.isReady() answers the positive half of that question; alreadyFailed()
  // answers the negative half, and it belongs next to isReady rather than as a
  // check each caller has to remember separately -- img.js had one, video.js
  // did not, and only inside its fallback branch at that.
  //
  // retry() is exactly what onError does, which is the point: the error event
  // already happened, it just happened early. A transient failure still gets
  // its full ladder of retries; a real one reaches giveUp() one whole readiness
  // window sooner, and -- the part that matters -- it is being watched at all.
  const alreadyFailed = typeof config.alreadyFailed === 'function'
    ? config.alreadyFailed(el)
    : false;

  // Native loading="lazy" defers the actual network fetch until the
  // browser decides the element is near the viewport -- if the check/retry
  // clock starts immediately regardless, an off-screen-but-perfectly-valid
  // image races its own timeout: confirmed live (cardimage grid, John's
  // "Image unavailable" report) that ZERO network requests were ever made
  // for the src before this gave up, hid the element, and never tried
  // again even once scrolled into view. Gate the clock on real
  // intersection first when the element opted into lazy loading.
  let lazyGate = null;
  if (alreadyFailed) {
    // No lazy gate either: the fetch demonstrably already happened and
    // already failed, so there is no "no request was ever made" race left
    // to wait for -- that was the only reason for the gate.
    console.warn(`[WB:media-retry] ${config.label} had ALREADY failed before this behavior attached -- ${traceLabel(el)} src=${config.currentSrc(el)}`, el.error || '');
    retry();
  } else if (el.loading === 'lazy' && typeof IntersectionObserver !== 'undefined') {
    lazyGate = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        lazyGate.disconnect();
        lazyGate = null;
        scheduleCheck();
      }
    }, { rootMargin: '200px' });
    lazyGate.observe(el);
  } else {
    scheduleCheck();
  }

  return () => {
    if (lazyGate) { lazyGate.disconnect(); lazyGate = null; }
    cleanup();
  };
}

export function attachVideoLoadRetry(videoEl, options = {}) {
  return attachLoadRetry(videoEl, {
    options,
    label: 'Video',
    successEvents: ['loadeddata', 'canplay'],
    failedClass: 'x-video--load-failed',
    messageClass: 'x-video__load-failed',
    failedEvent: 'wb:video:load-failed',
    currentSrc: (el) => el.currentSrc || el.src,
    // HAVE_CURRENT_DATA (2) or higher means a real frame is available.
    isReady: (el) => el.readyState >= 2 && !el.error,
    // #1342: already settled the other way -- the same one-line question
    // audio.js asks (if (audioEl.error) onMediaError();). Covers a src
    // attribute that already failed.
    //
    // NOT also networkState === NETWORK_NO_SOURCE (3), which #1342 proposed:
    // setting that state is the FIRST step of resource selection, before any
    // fetch begins, so a healthy <video> whose src was just assigned reads 3
    // for a moment -- and card.js's cardvideo attaches in exactly that moment.
    // Every good video would have been branded already-failed and needlessly
    // refetched.
    //
    // A <source>-children failure is therefore NOT caught here, and cannot be:
    // measured in x-video-source-children-failure-is-reported.spec.ts, a
    // <source>'s error event fires AT the <source>, does not bubble, and leaves
    // the <video>'s own error null -- resource selection just stops in
    // NETWORK_NO_SOURCE and tells the element nothing. The readiness clock
    // below is what detects that one. Slower, but it reports, which is the
    // whole of #1342's priority:1 half.
    alreadyFailed: (el) => !!el.error,
    reload: (el) => el.load(),
  });
}

export function attachImageLoadRetry(imgEl, options = {}) {
  const originalSrc = imgEl.getAttribute('src') || imgEl.src;
  return attachLoadRetry(imgEl, {
    options,
    label: 'Image',
    successEvents: ['load'],
    failedClass: 'x-img--load-failed',
    messageClass: 'x-img__load-failed',
    failedEvent: 'wb:image:load-failed',
    currentSrc: (el) => el.currentSrc || el.src,
    isReady: (el) => el.complete && el.naturalWidth > 0,
    // #1342: the check img.js already had, but only in its config.fallback
    // branch -- a plain <img x-img> came through here and got the delayed
    // path. `complete` with a zero naturalWidth is the standard way to spot
    // an <img> that already failed; the src guard keeps a srcless <img>
    // (complete, naturalWidth 0, never requested anything) out of it.
    alreadyFailed: (el) => el.complete && el.naturalWidth === 0 && !!el.getAttribute('src'),
    // <img> has no .load() -- re-assigning the identical src string doesn't
    // reliably force a fresh request (browsers may no-op on an unchanged
    // value even after a failure). Cache-bust with a query param instead.
    reload: (el) => {
      const sep = originalSrc.includes('?') ? '&' : '?';
      el.src = `${originalSrc}${sep}_retry=${Date.now()}`;
    },
  });
}

export default { attachVideoLoadRetry, attachImageLoadRetry };
