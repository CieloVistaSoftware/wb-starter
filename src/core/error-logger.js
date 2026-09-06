/**
 * Error Logger
 * Logs errors to data/errors.json and displays them on screen
 */

import { computeSignature, firstMeaningfulFrame, isTestOrigin } from './error-signature.js';

const ERROR_LOG_PATH = 'data/errors.json';
let errorContainer = null;
let errors = [];

/**
 * Initialize the error display container
 */
function initErrorDisplay() {
  if (errorContainer) return;
  
  errorContainer = document.createElement('div');
  errorContainer.id = 'x-error-display';
  errorContainer.style.cssText = `
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    width: 420px;
    max-height: 300px;
    overflow-y: auto;
    background: rgba(20, 20, 20, 0.95);
    color: #fff;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    border: 1px solid #ef4444;
    z-index: 99999;
    display: none;
  `;
  
  errorContainer.innerHTML = `
    <div style="padding:10px 12px;background:#1a1a1a;border-bottom:1px solid #333;display:flex;justify-content:space-between;align-items:center;border-radius:8px 8px 0 0;position:sticky;top:0;">
      <span style="font-weight:bold;color:#ef4444;">❌ Errors (<span id="x-error-count">0</span>)</span>
      <div>
        <button id="x-error-copy" style="background:#3b82f6;border:none;color:#fff;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.6875rem;margin-right:4px;">📋 Copy</button>
        <button id="x-error-clear" style="background:#333;border:none;color:#fff;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.6875rem;margin-right:4px;">Clear</button>
        <button id="x-error-close" style="background:#ef4444;border:none;color:#fff;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.6875rem;">✕</button>
      </div>
    </div>
    <div id="x-error-list" style="padding:8px;"></div>
  `;
  
  document.body.appendChild(errorContainer);
  
  // Copy button - formats errors for sharing
  document.getElementById('x-error-copy').onclick = async () => {
    const copyBtn = document.getElementById('x-error-copy');
    const errorText = errors.map((e, i) => {
      let text = `[${i + 1}] ${e.message}`;
      // Read the RESOLVED location, not the raw details. `details.line` is only
      // set by callers routed through events.js; every direct caller left it
      // undefined, so a pasted report said "mdhtml.js:?" while the record held
      // line 244, parsed from the stack. The paste is what a person files a bug
      // with -- the last place that should be missing the line number.
      const where = e.module || e.details?.file;
      if (where) text += `
    File: ${where}:${e.line || '?'}${e.column ? ':' + e.column : ''}`;
      if (e.function) text += `
    In: ${e.function}()`;
      if (e.count > 1) text += `
    Seen: ${e.count}x (first ${e.firstSeen}, last ${e.lastSeen})`;
      if (e.signature) text += `
    Signature: ${e.signature}`;
      if (e.testOrigin) text += `
    Origin: test fixture, not the app`;
      if (e.solution) text += `
    Solution: ${e.solution}`;
      if (e.to) text += `\n    To: ${e.to}`;
      if (e.details?.reason) text += `\n    Reason: ${e.details.reason}`;
      if (e.details?.response) text += `\n    Response: ${e.details.response}`;
      if (e.details?.src) text += `\n    Src: ${e.details.src}`;
      if (e.details?.stack) text += `\n    Stack:\n${e.details.stack.split('\n').map(l => '      ' + l.trim()).join('\n')}`;
      if (e.details?.column) text += `\n    Column: ${e.details.column}`;
      text += `\n    Time: ${e.timestamp}`;
      text += `\n    URL: ${e.url}`;
      return text;
    }).join('\n\n');
    
    const header = `=== ${errors.length} Error(s) at ${new Date().toLocaleString()} ===\nPage: ${window.location.href}\n\n`;
    
    // #1000 -- John: "copy doesn't copy". There was no fallback: one call to
    // navigator.clipboard, and the entire recovery was a button label that
    // reverted after two seconds. That API rejects whenever the document is not
    // focused -- clicking this with devtools focused is enough -- so the button
    // failed exactly when someone was trying to hand the error over, and said
    // nothing about why. The same fallback pattern already exists in
    // pages/behaviors.html.
    const payload = header + errorText;

    const viaExecCommand = () => {
      // Deprecated, but it works without focus and without permission, which is
      // the whole point of a fallback.
      const ta = document.createElement('textarea');
      ta.value = payload;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      ta.remove();
      return ok;
    };

    const done = (label, bg) => {
      copyBtn.textContent = label;
      copyBtn.style.background = bg;
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy';
        copyBtn.style.background = '#3b82f6';
      }, 2500);
    };

    let copied = false;
    try {
      await navigator.clipboard.writeText(payload);
      copied = true;
    } catch {
      copied = viaExecCommand();
    }

    if (copied) {
      done('✅ Copied!', '#22c55e');
      return;
    }

    // Both routes refused. Say so, and still get the text to the reader --
    // selected in a visible box they can copy by hand beats a shrug.
    done('❌ Blocked — text selected below', '#ef4444');
    const esc = document.getElementById('x-error-copy-fallback');
    if (esc) esc.remove();
    const box = document.createElement('textarea');
    box.id = 'x-error-copy-fallback';
    box.value = payload;
    box.readOnly = true;
    box.style.cssText =
      'width:100%;height:8rem;margin-top:6px;font:0.6875rem/1.4 monospace;' +
      'background:#111827;color:#e5e7eb;border:1px solid #ef4444;border-radius:4px;padding:6px;';
    copyBtn.parentElement?.parentElement?.appendChild(box);
    box.focus();
    box.select();
  };
  
  // Clear button
  document.getElementById('x-error-clear').onclick = () => {
    errors = [];
    document.getElementById('x-error-list').innerHTML = '';
    updateErrorCount();
    clearErrorLogFile();
  };
  
  // Close button
  document.getElementById('x-error-close').onclick = () => {
    errorContainer.style.display = 'none';
  };
}

/**
 * Show an error in the UI and log it
 */
/**
 * The analysis/solution/remedy recorded for a signature, or null if this fault
 * has never been analysed.
 *
 * Loaded once, lazily, and cached. A miss is not an error: an unknown signature
 * is exactly the thing that needs a person, and returning null is what marks it
 * `fixable: false` so it surfaces rather than being quietly retried.
 */
let fixRegistry = null;
let fixRegistryLoading = null;

function lookupFix(signature) {
  if (!fixRegistry) {
    if (!fixRegistryLoading) {
      // Fire and forget: the first few errors on a page may miss the registry,
      // and that is the right trade -- blocking error logging on a fetch would
      // mean an error during startup never gets recorded at all.
      fixRegistryLoading = fetch(new URL('../../data/fix-registry.json', import.meta.url))
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => { fixRegistry = (j && j.entries) || {}; })
        .catch(() => { fixRegistry = {}; });
    }
    return null;
  }
  return fixRegistry[signature] || null;
}

/**
 * Two entries are the SAME OCCURRENCE, not just the same fault.
 *
 * John: "I don't think the error log should log duplicates, rather just add a
 * counter to show how many times. But this is only true if everything is the
 * same."
 *
 * That last clause is the whole rule, and it is why this is deliberately NOT
 * keyed on the signature. The signature is intentionally loose -- it masks paths
 * and numbers so one fault has one identity -- so two documents failing to load
 * share a signature while being two different problems. Collapsing those would
 * hide the second document entirely.
 *
 * This compares everything a reader would use to tell two rows apart: the exact
 * message, where it came from, and what it was pointing at. Anything different,
 * anywhere, and it is a separate row.
 */
function isSameOccurrence(a, b) {
  if (!a || !b) return false;
  return (
    a.message === b.message &&
    a.level === b.level &&
    a.source === b.source &&
    a.module === b.module &&
    a.line === b.line &&
    a.column === b.column &&
    a.function === b.function &&
    a.to === b.to &&
    a.url === b.url &&
    (a.details && a.details.src) === (b.details && b.details.src) &&
    (a.details && a.details.reason) === (b.details && b.details.reason) &&
    a.stack === b.stack
  );
}

export async function logError(message, details = {}) {
  initErrorDisplay();

  // #1010 -- provenance, signature, and the fixable verdict.
  //
  // John: "our error log for each error 1) requires analysis 2) must get a
  // solution on what to do 3) set the fixable flag and then 4) fix the error."
  //
  // Steps 1 and 2 belong to the SIGNATURE, not to the occurrence: five identical
  // "Unable to Load Documentation" rows are one analysis and one solution. So the
  // signature is computed here, and the analysis/solution/fixable come from
  // data/fix-registry.json keyed by it.
  //
  // The frame is parsed from the stack because `source`/`line` were only ever set
  // by callers routed through events.js -- direct callers (mdhtml.js, wb.js's
  // schema catch) left them undefined and the viewer printed "Unknown" and "?:?"
  // over a record that already held the module, the target and the stack.
  const frame = firstMeaningfulFrame(details.stack);
  const signature = computeSignature({
    message,
    // `source` counts as the owner: emitters like replacement-guard identify
    // themselves that way and carry no file, and without this they all collapse
    // to the single owner "unknown" -- which would put unrelated faults from
    // different subsystems under one key, the exact over-collapsing the
    // normaliser is supposed to avoid.
    module: details.module || details.file || details.source,
    level: details.level,
    stack: details.stack,
    code: details.code,
  });
  const known = lookupFix(signature);

  const error = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    signature,
    analysis: known ? known.analysis : null,
    solution: known ? known.solution : null,
    // Derived, never hand-set: an error is fixable when its signature has a
    // remedy that is mechanical AND verifiable. Unknown signatures are not
    // fixable -- that is the honest default, and it is what puts them in front
    // of a person to be analysed.
    fixable: !!(known && known.fixable && known.remedy),
    remedy: known ? known.remedy || null : null,
    verify: known ? known.verify || null : null,
    testOrigin: isTestOrigin({ message, url: window.location.href, details }),
    // #442: optional fields below are only ever populated by callers routed
    // through events.js's Events.error()/log() (source/level/module/line/
    // etc., extracted from a parsed stack trace) -- direct logError() callers
    // (mdhtml.js, wb.js's schema-processing catch) simply omit them and get
    // the original message/details/to shape. Promoting them to top level
    // (rather than leaving them buried in `details`) is what lets
    // errors-viewer.html render them (it reads error.source/level/module/
    // line/stack/interaction), so this one persisted shape now serves both
    // previously-separate systems instead of each needing its own schema.
    level: details.level || 'error',
    // "Unknown" was this field being undefined, not the information being absent.
    source: details.source || details.to || (frame && frame.file) || undefined,
    message: String(message),
    details: details,
    to: details.to || '',
    module: details.module || details.file || (frame && frame.file) || undefined,
    line: details.line ?? (frame && frame.line),
    column: details.column ?? (frame && frame.column),
    function: details.function || (frame && frame.function),
    stack: details.stack,
    frames: details.frames,
    interaction: details.interaction,
    url: window.location.href,
    userAgent: navigator.userAgent
  };
  
  // Repeats are counted, not re-listed (#1010). `count`, `firstSeen` and
  // `lastSeen` say more than N identical rows ever did: five copies of one line
  // tell you nothing about whether it happened five times in a burst or once an
  // hour all day.
  const existing = errors.find((e) => isSameOccurrence(e, error));
  if (existing) {
    existing.count = (existing.count || 1) + 1;
    existing.lastSeen = error.timestamp;
    updateErrorCount();
    // Persisted through the same path a new error takes, so the stored copy
    // carries the updated count rather than the count living only in memory and
    // resetting on reload.
    if (!document.documentElement.hasAttribute('data-x-expected-errors')) {
      await appendErrorToLog(existing);
    }
    console.error('[ErrorLogger]', message, '(x' + existing.count + ')');
    return existing;
  }

  error.count = 1;
  error.firstSeen = error.timestamp;
  error.lastSeen = error.timestamp;
  errors.push(error);
  updateErrorCount();
  
  // Show in UI
  const list = document.getElementById('x-error-list');
  const item = document.createElement('div');
  item.style.cssText = `
    padding: 8px 10px;
    margin-bottom: 6px;
    background: rgba(239, 68, 68, 0.1);
    border-left: 3px solid #ef4444;
    border-radius: 0 4px 4px 0;
    word-break: break-word;
  `;
  
  const time = new Date(error.timestamp).toLocaleTimeString();
  let detailsHtml = '';
  if (error.module || details.file) detailsHtml += `<div style="color:#888;font-size:0.6875rem;">📁 ${error.module || details.file}:${error.line || '?'}</div>`;
  if (error.to) detailsHtml += `<div style="color:#3b82f6;font-size:0.6875rem;">➡️ To: ${escapeHtml(error.to)}</div>`;
  if (details.response) detailsHtml += `<div style="color:#f59e0b;font-size:0.6875rem;">📡 Response: ${escapeHtml(details.response)}</div>`;
  if (details.src) detailsHtml += `<div style="color:#a78bfa;font-size:0.6875rem;">📄 Src: ${escapeHtml(details.src)}</div>`;
  if (details.stack) detailsHtml += `<div style="color:#666;font-size:0.625rem;margin-top:4px;max-height:60px;overflow:auto;">${escapeHtml(details.stack)}</div>`;
  
  item.innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
      <span style="color:#ef4444;">❌ Error${error.source ? ` <span style="color:#888;font-weight:normal;">[${escapeHtml(error.source)}]</span>` : ''}</span>
      <span style="color:#666;font-size:0.625rem;">${time}</span>
    </div>
    <div style="color:#fff;">${escapeHtml(error.message)}</div>
    ${detailsHtml}
  `;
  
  list.appendChild(item);
  list.scrollTop = list.scrollHeight;
  
  // Show container
  errorContainer.style.display = 'block';
  
  // Save to file
  if (!document.documentElement.hasAttribute('data-x-expected-errors')) {
    await appendErrorToLog(error);
  }
  
  // Also log to console
  console.error('[ErrorLogger]', message, details);
  
  return error;
}

/**
 * Append ONE error to the shared server-side log (#382: the old version
 * POSTed this page's entire in-memory `errors` array to a blind-overwrite
 * endpoint, which lost entries under concurrent pages/workers -- appending
 * server-side, one error at a time, is race-free instead).
 */
/**
 * #1000 -- John, on the deployed site: "the entry is not in the error log".
 *
 * Correct, and it never could be. This POSTs to a server endpoint; GitHub Pages
 * is static and answers 405 Method Not Allowed. That 405 sat in the console
 * right beside the error it failed to record, and the only reaction was a
 * console.warn nobody reads -- so the log stayed empty and looked fine.
 *
 * Where there is no API, the browser keeps the log itself, in the same shape as
 * the file so errors-viewer.html reads either without caring which it got.
 */
const LOCAL_KEY = 'wb:error-log';
let serverLogging = true;   // flipped off the first time the API refuses

function localLog() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{"errors":[]}');
  } catch {
    return { errors: [] };
  }
}

function appendLocally(error) {
  try {
    const log = localLog();
    // A counted repeat updates its stored row rather than adding another one --
    // otherwise the count would be correct in memory and the storage would still
    // grow by one entry per occurrence, which is the duplication this was meant
    // to remove.
    const at = log.errors.findIndex((e) => e.id === error.id);
    if (at !== -1) {
      log.errors[at] = error;
      localStorage.setItem(LOCAL_KEY, JSON.stringify(log));
      return true;
    }
    log.errors.push(error);
    // A page throwing in a loop must not fill the quota.
    if (log.errors.length > 200) log.errors = log.errors.slice(-200);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(log));
    return true;
  } catch {
    return false;   // private mode, quota, storage disabled
  }
}

/** True when errors are kept in the browser rather than on a server. */
export function isLocalOnly() {
  return !serverLogging;
}

async function appendErrorToLog(error) {
  if (serverLogging) {
    try {
      const response = await fetch('/api/error-log/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error })
      });
      if (response.ok) return;
      // 405 on a static host, 404 behind a different mount. Either way there is
      // no endpoint here: stop asking, keep the log locally.
      serverLogging = false;
    } catch {
      serverLogging = false;
    }
  }

  if (!appendLocally(error)) {
    console.warn('[ErrorLogger] No server API and no localStorage - this error is recorded nowhere.');
  }
}

/**
 * Reset the shared server-side log to empty (a deliberate, single user
 * action -- unlike per-error appends, a full overwrite here is intentional
 * and not subject to the same lost-update race).
 */
async function clearErrorLogFile() {
  try {
    const response = await fetch('/api/error-log/clear', { method: 'POST' });
    if (!response.ok) serverLogging = false;
  } catch {
    serverLogging = false;
  }
  // Clear the local copy too, or "Clear" leaves entries the viewer still shows
  // -- the same silent mismatch #1000 is about.
  try {
    localStorage.removeItem(LOCAL_KEY);
  } catch { /* storage unavailable; nothing to clear */ }
}

/**
 * Load errors from JSON file
 */
export async function loadErrorLog() {
  try {
    const response = await fetch(`/${ERROR_LOG_PATH}?t=${Date.now()}`);
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.errors) && data.errors.length) {
        errors = data.errors;
        return data;
      }
    }
  } catch {
    /* fall through to the local log */
  }
  // #1000: on a static host the file is absent or empty and the real log lives
  // in the browser. Reading only the file is why the viewer showed nothing.
  const local = localLog();
  errors = local.errors || [];
  return local;
}

/**
 * Get all logged errors
 */
export function getErrors() {
  return errors;
}

/**
 * Clear all errors
 */
export async function clearErrors() {
  errors = [];
  if (document.getElementById('x-error-list')) {
    document.getElementById('x-error-list').innerHTML = '';
  }
  updateErrorCount();
  await clearErrorLogFile();
}

/**
 * Helper to escape HTML
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Update the error count display
 */
function updateErrorCount() {
  const countEl = document.getElementById('x-error-count');
  if (countEl) countEl.textContent = errors.length;
}

let globalHandlerInstalled = false;

/**
 * Setup global error catching. Safe to call more than once (WB.init() is
 * meant to be called defensively/idempotently by every independent
 * component that uses WB, per wb.js's own init() -- without this guard,
 * each extra call would attach a duplicate pair of listeners, logging every
 * real error once per WB.init() call on the page instead of once).
 */
export function setupGlobalErrorHandler() {
  if (globalHandlerInstalled) return;
  globalHandlerInstalled = true;

  // Catch uncaught errors
  window.addEventListener('error', (event) => {
    logError(event.message, {
      file: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error?.stack
    });
  });
  
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError('Unhandled Promise Rejection', {
      reason: String(event.reason),
      stack: event.reason?.stack
    });
  });
}

export default { logError, loadErrorLog, getErrors, clearErrors, setupGlobalErrorHandler };
