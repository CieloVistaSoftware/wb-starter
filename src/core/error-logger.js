/**
 * Error Logger
 * Logs errors to data/errors.json and displays them on screen
 */

const ERROR_LOG_PATH = 'data/errors.json';
let errorContainer = null;
let errors = [];

/**
 * Initialize the error display container
 */
function initErrorDisplay() {
  if (errorContainer) return;
  
  errorContainer = document.createElement('div');
  errorContainer.id = 'wb-error-display';
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
      <span style="font-weight:bold;color:#ef4444;">❌ Errors (<span id="wb-error-count">0</span>)</span>
      <div>
        <button id="wb-error-copy" style="background:#3b82f6;border:none;color:#fff;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.6875rem;margin-right:4px;">📋 Copy</button>
        <button id="wb-error-clear" style="background:#333;border:none;color:#fff;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.6875rem;margin-right:4px;">Clear</button>
        <button id="wb-error-close" style="background:#ef4444;border:none;color:#fff;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.6875rem;">✕</button>
      </div>
    </div>
    <div id="wb-error-list" style="padding:8px;"></div>
  `;
  
  document.body.appendChild(errorContainer);
  
  // Copy button - formats errors for sharing
  document.getElementById('wb-error-copy').onclick = async () => {
    const copyBtn = document.getElementById('wb-error-copy');
    const errorText = errors.map((e, i) => {
      let text = `[${i + 1}] ${e.message}`;
      if (e.details?.file) text += `\n    File: ${e.details.file}:${e.details.line || '?'}`;
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
    
    try {
      await navigator.clipboard.writeText(header + errorText);
      copyBtn.textContent = '✅ Copied!';
      copyBtn.style.background = '#22c55e';
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy';
        copyBtn.style.background = '#3b82f6';
      }, 2000);
    } catch (e) {
      copyBtn.textContent = '❌ Failed';
      setTimeout(() => copyBtn.textContent = '📋 Copy', 2000);
    }
  };
  
  // Clear button
  document.getElementById('wb-error-clear').onclick = () => {
    errors = [];
    document.getElementById('wb-error-list').innerHTML = '';
    updateErrorCount();
    clearErrorLogFile();
  };
  
  // Close button
  document.getElementById('wb-error-close').onclick = () => {
    errorContainer.style.display = 'none';
  };
}

/**
 * Show an error in the UI and log it
 */
export async function logError(message, details = {}) {
  initErrorDisplay();
  
  const error = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    message: String(message),
    details: details,
    to: details.to || '',
    url: window.location.href,
    userAgent: navigator.userAgent
  };
  
  errors.push(error);
  updateErrorCount();
  
  // Show in UI
  const list = document.getElementById('wb-error-list');
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
  if (details.file) detailsHtml += `<div style="color:#888;font-size:0.6875rem;">📁 ${details.file}:${details.line || '?'}</div>`;
  if (error.to) detailsHtml += `<div style="color:#3b82f6;font-size:0.6875rem;">➡️ To: ${escapeHtml(error.to)}</div>`;
  if (details.response) detailsHtml += `<div style="color:#f59e0b;font-size:0.6875rem;">📡 Response: ${escapeHtml(details.response)}</div>`;
  if (details.src) detailsHtml += `<div style="color:#a78bfa;font-size:0.6875rem;">📄 Src: ${escapeHtml(details.src)}</div>`;
  if (details.stack) detailsHtml += `<div style="color:#666;font-size:0.625rem;margin-top:4px;max-height:60px;overflow:auto;">${escapeHtml(details.stack)}</div>`;
  
  item.innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
      <span style="color:#ef4444;">❌ Error</span>
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
  await appendErrorToLog(error);
  
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
async function appendErrorToLog(error) {
  try {
    const response = await fetch('/api/error-log/append', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error })
    });

    if (!response.ok) {
      console.warn('[ErrorLogger] Failed to save error log');
    }
  } catch (e) {
    console.warn('[ErrorLogger] Could not save to file:', e);
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
    if (!response.ok) {
      console.warn('[ErrorLogger] Failed to clear error log');
    }
  } catch (e) {
    console.warn('[ErrorLogger] Could not clear error log:', e);
  }
}

/**
 * Load errors from JSON file
 */
export async function loadErrorLog() {
  try {
    const response = await fetch(`/${ERROR_LOG_PATH}?t=${Date.now()}`);
    if (response.ok) {
      const data = await response.json();
      errors = data.errors || [];
      return data;
    }
  } catch (e) {
    console.warn('[ErrorLogger] Could not load error log:', e);
  }
  return { errors: [] };
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
  if (document.getElementById('wb-error-list')) {
    document.getElementById('wb-error-list').innerHTML = '';
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
  const countEl = document.getElementById('wb-error-count');
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
