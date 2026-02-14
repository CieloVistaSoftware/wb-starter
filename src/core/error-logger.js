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
    font-size: 12px;
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
        <button id="wb-error-copy" style="background:#3b82f6;border:none;color:#fff;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;margin-right:4px;">📋 Copy</button>
        <button id="wb-error-clear" style="background:#333;border:none;color:#fff;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;margin-right:4px;">Clear</button>
        <button id="wb-error-close" style="background:#ef4444;border:none;color:#fff;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;">✕</button>
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
    saveErrorLog();
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
  if (details.file) detailsHtml += `<div style="color:#888;font-size:11px;">📁 ${details.file}:${details.line || '?'}</div>`;
  if (error.to) detailsHtml += `<div style="color:#3b82f6;font-size:11px;">➡️ To: ${escapeHtml(error.to)}</div>`;
  if (details.response) detailsHtml += `<div style="color:#f59e0b;font-size:11px;">📡 Response: ${escapeHtml(details.response)}</div>`;
  if (details.src) detailsHtml += `<div style="color:#a78bfa;font-size:11px;">📄 Src: ${escapeHtml(details.src)}</div>`;
  if (details.stack) detailsHtml += `<div style="color:#666;font-size:10px;margin-top:4px;max-height:60px;overflow:auto;">${escapeHtml(details.stack)}</div>`;
  
  item.innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
      <span style="color:#ef4444;">❌ Error</span>
      <span style="color:#666;font-size:10px;">${time}</span>
    </div>
    <div style="color:#fff;">${escapeHtml(error.message)}</div>
    ${detailsHtml}
  `;
  
  list.appendChild(item);
  list.scrollTop = list.scrollHeight;
  
  // Show container
  errorContainer.style.display = 'block';
  
  // Save to file
  await saveErrorLog();
  
  // Also log to console
  console.error('[ErrorLogger]', message, details);
  
  return error;
}

/**
 * Save errors to JSON file
 */
async function saveErrorLog() {
  try {
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: ERROR_LOG_PATH,
        data: {
          lastUpdated: new Date().toISOString(),
          count: errors.length,
          errors: errors.slice(-100) // Keep last 100 errors
        }
      })
    });
    
    if (!response.ok) {
      console.warn('[ErrorLogger] Failed to save error log');
    }
  } catch (e) {
    console.warn('[ErrorLogger] Could not save to file:', e);
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
  await saveErrorLog();
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

/**
 * Setup global error catching
 */
export function setupGlobalErrorHandler() {
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
