/**
 * WB Events - Enhanced Error Logging with Module, Line, and Stack Trace
 */

// #442: error-logger.js's logError() is the single source of truth for
// error persistence/display -- this file used to keep its OWN parallel
// in-memory `errors` array and its OWN independent POST to
// /api/error-log/append, so anything routed through Events.error() (e.g.
// wb.js's WB:LegacySyntax detection) never showed up in error-logger.js's
// on-screen panel (#x-error-display) or its getErrors(), even though both
// systems happened to write the same on-disk data/errors.json. Delegating
// storage to logError() here keeps this file's real value -- the richer
// stack-trace parsing and toast-style presentation below -- as an
// *additional* presentation layer on top of one shared error store, instead
// of a second system that can drift out of sync with the first.
import { logError, getErrors as getLoggedErrors, clearErrors as clearLoggedErrors, escapeHtml } from './error-logger.js';

let errorContainer = null;
let lastInteraction = { from: 'System', to: 'Idle', timestamp: 0 };

/**
 * Track user interactions for error context
 */
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    try {
      const target = e.target.closest('button, a, input, select, textarea, summary, [onclick]');
      if (target) {
        // Determine "From" (Element name/text)
        let from = target.tagName.toLowerCase();
        if (target.id) from += `#${target.id}`;
        else if (target.textContent && target.textContent.trim().length > 0 && target.textContent.trim().length < 30) {
          from += ` "${target.textContent.trim()}"`;
        }
        
        // Determine "To" (Action/Target)
        let to = 'User Action';
        if (target.tagName === 'BUTTON' && target.type === 'submit') to = 'Submit Form';
        else if (target.tagName === 'SUMMARY') to = 'Toggle Details';
        else if (target.onclick || target.hasAttribute('onclick')) to = 'Script Handler';
        else if (target.dataset.wb) to = `WB Behavior (${target.dataset.wb})`;
        else if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) to = 'Input Interaction';
        
        lastInteraction = { from, to, timestamp: Date.now() };
      }
    } catch (err) {
      // Ignore interaction tracking errors
    }
  }, true);
}

/**
 * Parse stack trace to extract useful info
 */
function parseStack(stack) {
  if (!stack) return { module: 'unknown', line: '?', column: '?', frames: [] };
  
  const lines = stack.split('\n');
  const frames = [];
  let firstFrame = null;
  
  for (const line of lines) {
    // Match patterns like:
    // "at functionName (http://localhost/path/file.js:123:45)"
    // "at http://localhost/path/file.js:123:45"
    // "at async functionName (file.js:123:45)"
    const match = line.match(/at\s+(?:async\s+)?(?:(\S+)\s+)?\(?(.+?):(\d+):(\d+)\)?/);
    
    if (match) {
      const [, fnName, file, lineNum, col] = match;
      
      // Extract just the filename from full path
      const fileName = file.split('/').pop().split('?')[0];
      
      const frame = {
        function: fnName || '(anonymous)',
        file: fileName,
        fullPath: file,
        line: parseInt(lineNum),
        column: parseInt(col)
      };
      
      frames.push(frame);
      
      // First non-internal frame is likely the source
      if (!firstFrame && !file.includes('events.js')) {
        firstFrame = frame;
      }
    }
  }
  
  return {
    module: firstFrame?.file || 'unknown',
    line: firstFrame?.line || '?',
    column: firstFrame?.column || '?',
    function: firstFrame?.function || 'unknown',
    frames
  };
}

/**
 * Format stack trace for display
 */
function formatStackTrace(frames, maxFrames = 8) {
  if (!frames || frames.length === 0) return '';
  
  return frames.slice(0, maxFrames).map((f, i) => {
    const arrow = i === 0 ? '▶' : '  ↳';
    return `${arrow} ${f.function}()\n     ${f.file}:${f.line}:${f.column}`;
  }).join('\n');
}

/**
 * Create or get the error display container
 */
function getErrorContainer() {
  if (errorContainer) return errorContainer;
  
  // Add CSS animations if not present
  if (!document.getElementById('x-events-styles')) {
    const style = document.createElement('style');
    style.id = 'x-events-styles';
    style.textContent = `
      @keyframes x-slide-in {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes x-fade-out {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      .x-error-toast {
        font-family: system-ui, -apple-system, sans-serif;
        animation: x-slide-in 0.3s ease;
      }
      .x-error-toast.closing {
        animation: x-fade-out 0.3s ease;
      }
      .x-stack-frame {
        font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
        font-size: 0.6875rem;
        line-height: 1.6;
        color: var(--x-event-stack-frame);
        /* Standard: >=1rem padding so stack-trace text never sits flush
           against this panel's edge (was 0.5rem inline, below the 1rem
           minimum). */
        padding: 1rem;
      }
      .x-error-toast details summary {
        cursor: pointer;
        padding: 4px 0;
      }
      .x-error-toast details summary:hover {
        color: white;
      }
      .x-error-module {
        background: rgba(255,255,255,0.15);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: monospace;
        font-size: 0.6875rem;
      }
      /* #779: everything below was style.cssText / style="" on the toast
         parts. Prefixed with the container's id so the toast's <button>s keep
         the precedence over button.css and theme rules the inline values
         had. The level colours are modifier classes rather than values
         interpolated into a style attribute. */
      #x-events-container {
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 500px;
        pointer-events: none;
      }
      #x-events-container .x-error-toast {
        border-left: 4px solid;
        color: white;
        padding: 0.875rem 1rem;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        pointer-events: auto;
        max-width: 100%;
      }
      #x-events-container .x-error-toast--error { background: rgba(220, 38, 38, 0.97); border-left-color: var(--x-event-toast-error-edge); }
      #x-events-container .x-error-toast--warn { background: rgba(217, 119, 6, 0.97); border-left-color: var(--x-event-toast-warn-edge); }
      #x-events-container .x-error-toast--info { background: rgba(37, 99, 235, 0.97); border-left-color: var(--x-event-toast-info-edge); }
      #x-events-container .x-error-toast--success { background: rgba(22, 163, 74, 0.97); border-left-color: var(--x-event-toast-success-edge); }
      #x-events-container .x-error-toast__head { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
      #x-events-container .x-error-toast__icon { font-size: 1.2rem; }
      #x-events-container .x-error-toast__label { font-weight: 700; font-size: 0.75rem; letter-spacing: 0.5px; }
      #x-events-container .x-error-toast__line { opacity: 0.7; font-size: 0.6875rem; }
      #x-events-container .x-error-copy-btn {
        margin-left: auto; margin-right: 8px; background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.4); color: white; cursor: pointer;
        font-size: 0.6875rem; padding: 2px 8px; border-radius: 4px;
      }
      #x-events-container .x-error-copy-btn--copied { background: rgba(34, 197, 94, 0.4); }
      #x-events-container .x-error-toast__close {
        background: none; border: none; color: white; cursor: pointer;
        opacity: 0.7; font-size: 1.2rem; padding: 0;
      }
      #x-events-container .x-error-toast__name { font-size: 0.6875rem; color: var(--x-event-toast-name); margin-bottom: 0.25rem; font-family: monospace; }
      #x-events-container .x-error-toast__message { font-size: 0.8125rem; font-weight: 500; margin-bottom: 0.5rem; word-break: break-word; }
      #x-events-container .x-error-toast__file { font-size: 0.6875rem; opacity: 0.8; margin-bottom: 0.5rem; }
      #x-events-container .x-error-toast__hint { font-size: 0.625rem; opacity: 0.6; margin-top: 0.5rem; font-style: italic; }
      #x-events-container .x-error-toast__stack { margin-top: 0.5rem; }
      #x-events-container .x-error-toast__stack > summary { cursor: pointer; font-size: 0.6875rem; opacity: 0.8; user-select: none; }
      #x-events-container .x-stack-frame {
        margin-top: 0.5rem;
        background: rgba(0,0,0,0.2);
        border-radius: 4px;
        overflow-x: auto;
        white-space: pre;
        max-height: 150px;
        overflow-y: auto;
      }
    `;
    document.head.appendChild(style);
  }
  
  errorContainer = document.createElement('div');
  // Laid out by #x-events-container in the x-events-styles sheet above (#779).
  errorContainer.id = 'x-events-container';
  document.body.appendChild(errorContainer);
  return errorContainer;
}

/**
 * Show a visual toast notification with full error details
 */
function showToast(level, message, data = {}) {
  const container = getErrorContainer();
  
  // Background/border per level are .x-error-toast--{level} rules (#779).
  const colors = {
    error: { icon: '❌', label: 'ERROR' },
    warn: { icon: '⚠️', label: 'WARN' },
    info: { icon: 'ℹ️', label: 'INFO' },
    success: { icon: '✅', label: 'OK' }
  };
  
  const levelKey = colors[level] ? level : 'info';
  const c = colors[levelKey];
  const stackInfo = parseStack(data.stack);
  
  const toast = document.createElement('div');
  toast.className = `x-error-toast x-error-toast--${levelKey}`;
  
  // Build header with module info
  let headerHTML = `
    <div class="x-error-toast__head">
      <span class="x-error-toast__icon">${c.icon}</span>
      <span class="x-error-toast__label">${c.label}</span>
  `;
  
  // Add module badge
  if (data.module || stackInfo.module !== 'unknown') {
    const moduleName = data.module || stackInfo.module;
    headerHTML += `<span class="x-error-module">${escapeHtml(moduleName)}</span>`;
  }
  
  // Add line number
  if (data.line || stackInfo.line !== '?') {
    const lineNum = data.line || stackInfo.line;
    headerHTML += `<span class="x-error-toast__line">Line ${lineNum}</span>`;
  }
  
  headerHTML += `
      <button class="x-error-copy-btn">
        📋 Copy
      </button>
      <button class="x-error-toast__close" onclick="this.closest('.x-error-toast').remove()">×</button>
    </div>
  `;
  
  // Exception type - show prominently
  let messageHTML = '';
  if (data.name) {
    messageHTML += `
      <div class="x-error-toast__name">
        ${escapeHtml(data.name)}
      </div>
    `;
  }
  
  // Message
  messageHTML += `
    <div class="x-error-toast__message">
      ${escapeHtml(String(message))}
    </div>
  `;
  
  // File info
  if (data.file || data.fullPath) {
    const filePath = data.file || data.fullPath;
    messageHTML += `
      <div class="x-error-toast__file">
        <strong>File:</strong> ${escapeHtml(filePath)}${data.line ? ':' + data.line : ''}${data.column ? ':' + data.column : ''}
      </div>
    `;
  }
  
  // Error log location hint
  if (level === 'error') {
    messageHTML += `
      <div class="x-error-toast__hint">
        📁 Error log saved to: data/errors.json
      </div>
    `;
  }
  
  // Stack trace
  let stackHTML = '';
  if (level === 'error' && stackInfo.frames.length > 0) {
    stackHTML = `
      <details class="x-error-toast__stack">
        <summary>
          Stack Trace (${stackInfo.frames.length} frames)
        </summary>
        <div class="x-stack-frame">${escapeHtml(formatStackTrace(stackInfo.frames, 10))}</div>
      </details>
    `;
  } else if (data.stack && level === 'error') {
    // Fallback to raw stack if parsing failed
    const shortStack = data.stack.split('\n').slice(0, 6).join('\n');
    stackHTML = `
      <details class="x-error-toast__stack">
        <summary>
          Stack Trace
        </summary>
        <div class="x-stack-frame">${escapeHtml(shortStack)}</div>
      </details>
    `;
  }
  
  toast.innerHTML = headerHTML + messageHTML + stackHTML;
  container.appendChild(toast);
  
  // Attach copy handler
  const copyBtn = toast.querySelector('.x-error-copy-btn');
  if (copyBtn) {
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      const textToCopy = `Error: ${message}\nModule: ${data.module || 'unknown'}\nFile: ${data.file || data.fullPath || 'unknown'}\nLine: ${data.line || '?'}\n\nStack:\n${data.stack || ''}`;
      
      navigator.clipboard.writeText(textToCopy).then(() => {
        copyBtn.textContent = '✔️ Copied';
        copyBtn.classList.add('x-error-copy-btn--copied');
        setTimeout(() => {
           copyBtn.textContent = '📋 Copy';
           copyBtn.classList.remove('x-error-copy-btn--copied');
        }, 2000);
      }).catch(err => console.error('Copy failed', err));
    };
  }
  
  // Auto-remove after delay (longer for errors)
  const duration = level === 'error' ? 15000 : level === 'warn' ? 8000 : 4000;
  setTimeout(() => {
    toast.classList.add('closing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
  
  return toast;
}

/**
 * Extract error details from an Error object
 */
function extractErrorDetails(error) {
  if (!error) return {};
  
  const details = {
    name: error.name || 'Error',
    message: error.message || String(error),
    stack: error.stack || ''
  };
  
  // Parse stack for location info
  const stackInfo = parseStack(error.stack);
  details.module = stackInfo.module;
  details.line = stackInfo.line;
  details.column = stackInfo.column;
  details.function = stackInfo.function;
  details.frames = stackInfo.frames;
  
  return details;
}

export const Events = {
  /**
   * Log an event with full error details
   * @param {string} level - 'error', 'warn', 'info', 'success'
   * @param {string} source - Source identifier (module name)
   * @param {string|Error} message - Log message or Error object
   * @param {Object} data - Additional data (stack, file, line, etc.)
   */
  log(level, source, message, data = {}) {
    // If message is an Error object, extract details
    if (message instanceof Error) {
      const errorDetails = extractErrorDetails(message);
      data = { ...errorDetails, ...data };
      message = errorDetails.message;
    }
    
    // Merge source into data for display
    data.module = data.module || source;
    
    const prefix = `[${source}]`;
    const fullMessage = `${message}`;
    
    // Enhanced console output
    if (typeof console !== 'undefined') {
      const location = data.line ? `${data.module}:${data.line}` : data.module;
      
      if (level === 'error') {
        console.group(`❌ ${prefix} ${fullMessage}`);
        console.error(`Module: %c${location}`, 'color: #60a5fa; font-weight: bold');
        if (data.name) console.error(`Type: %c${data.name}`, 'color: #f87171');
        if (data.file) console.error(`File: ${data.file}`);
        if (data.stack) {
          console.groupCollapsed('Stack Trace');
          console.error(data.stack);
          console.groupEnd();
        }
        console.groupEnd();
      } else if (level === 'warn') {
        console.warn(`⚠️ ${prefix} ${fullMessage}`, `[${location}]`);
      } else {
        console.log(`${prefix} ${fullMessage}`);
      }
    }
    
    // Visual toast for errors and warnings
    if ((level === 'error' || level === 'warn') && typeof document !== 'undefined') {
      showToast(level, fullMessage, data);
    }
    
    // Persist through error-logger.js's logError() -- the single source of
    // truth for error storage (#442). See the top-of-file note: this used
    // to push to a private `errors` array and POST independently instead.
    if (level === 'error') {
      // Check if interaction is relevant (within last 5 seconds)
      const interaction = (Date.now() - lastInteraction.timestamp < 5000)
        ? { from: lastInteraction.from, to: lastInteraction.to }
        : { from: 'System', to: 'Background Process' };

      logError(fullMessage, { ...data, source, level, interaction });
    }
  },
  
  /**
   * Log an error with full details
   */
  error(source, message, data = {}) {
    this.log('error', source, message, data);
  },
  
  /**
   * Log a warning
   */
  warn(source, message, data = {}) {
    this.log('warn', source, message, data);
  },
  
  /**
   * Log info
   */
  info(source, message, data = {}) {
    this.log('info', source, message, data);
  },
  
  /**
   * Show success toast
   */
  success(source, message, data = {}) {
    this.log('success', source, message, data);
    showToast('success', `[${source}] ${message}`, data);
  },
  
  /**
   * Setup global error handlers to catch all unhandled errors
   */
  setupGlobalHandlers() {
    if (typeof window === 'undefined') return;
    
    // Catch uncaught errors
    window.addEventListener('error', (event) => {
      const errorDetails = extractErrorDetails(event.error);
      
      this.log('error', 'Uncaught', event.message, {
        ...errorDetails,
        file: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      });
    });
    
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      let errorDetails = {};
      
      if (reason instanceof Error) {
        errorDetails = extractErrorDetails(reason);
      } else {
        errorDetails = {
          message: String(reason),
          name: 'UnhandledRejection'
        };
      }
      
      this.log('error', 'Promise', errorDetails.message || 'Unhandled rejection', {
        ...errorDetails,
        reason: String(reason)
      });
    });
    
    // Catch module loading errors
    window.addEventListener('error', (event) => {
      if (event.target && (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
        const src = event.target.src || event.target.href;
        this.log('error', 'Loader', `Failed to load: ${src}`, {
          module: src.split('/').pop(),
          file: src,
          type: event.target.tagName.toLowerCase()
        });
      }
    }, true);
    
    console.log('[Events] Global error handlers installed');
  },
  
  /**
   * Get all logged errors (#442: delegates to error-logger.js's shared
   * store -- this file no longer keeps its own copy).
   */
  getErrors() {
    return getLoggedErrors();
  },

  /**
   * Clear all errors (#442: delegates to error-logger.js's clearErrors(),
   * which hits the same dedicated clear endpoint this file used to call
   * directly).
   */
  clearErrors() {
    clearLoggedErrors();
  },

  /**
   * Get error count
   */
  getErrorCount() {
    return getLoggedErrors().length;
  }
};

export default Events;
