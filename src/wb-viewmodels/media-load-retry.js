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
    el.style.display = 'none';
    if (!el.nextElementSibling || !el.nextElementSibling.classList.contains('wb-media-load-failed')) {
      const msg = document.createElement('div');
      msg.className = 'wb-media-load-failed';
      msg.textContent = `⚠ ${config.label} unavailable`;
      el.insertAdjacentElement('afterend', msg);
    }
    el.dispatchEvent(new CustomEvent(config.failedEvent, {
      bubbles: true,
      detail: { src: config.currentSrc(el), attempts: attempt }
    }));
  }

  function retry() {
    if (settled) return;
    if (attempt >= maxAttempts) { giveUp(); return; }
    const delay = baseDelayMs * Math.pow(2, attempt - 1);
    console.warn(`[WB:media-retry] ${config.label} attempt ${attempt}/${maxAttempts} not ready -- retrying in ${delay}ms -- ${traceLabel(el)} src=${config.currentSrc(el)}`);
    attempt++;
    setTimeout(() => {
      if (settled) return;
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
  scheduleCheck();

  return cleanup;
}

export function attachVideoLoadRetry(videoEl, options = {}) {
  return attachLoadRetry(videoEl, {
    options,
    label: 'Video',
    successEvents: ['loadeddata', 'canplay'],
    failedClass: 'wb-video--load-failed',
    failedEvent: 'wb:video:load-failed',
    currentSrc: (el) => el.currentSrc || el.src,
    // HAVE_CURRENT_DATA (2) or higher means a real frame is available.
    isReady: (el) => el.readyState >= 2 && !el.error,
    reload: (el) => el.load(),
  });
}

export function attachImageLoadRetry(imgEl, options = {}) {
  const originalSrc = imgEl.getAttribute('src') || imgEl.src;
  return attachLoadRetry(imgEl, {
    options,
    label: 'Image',
    successEvents: ['load'],
    failedClass: 'wb-img--load-failed',
    failedEvent: 'wb:image:load-failed',
    currentSrc: (el) => el.currentSrc || el.src,
    isReady: (el) => el.complete && el.naturalWidth > 0,
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
