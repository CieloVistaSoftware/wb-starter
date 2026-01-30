/**
 * WB Events - Enhanced Error Logging with Module, Line, and Stack Trace
 */
const ERROR_LOG_PATH = 'data/errors.json';
let errorContainer = null;
let errors = [];
let lastInteraction = { from: 'System', to: 'Idle', timestamp: 0 };
/**
 * Track user interactions for error context
 */
if (typeof document !== 'undefined') {
    document.addEventListener('click', (e) => {
        try {
            const target = e.target.closest('button, a, input, select, textarea, summary, [onclick], ');
            if (target) {
                // Determine "From" (Element name/text)
                let from = target.tagName.toLowerCase();
                if (target.id)
                    from += `#${target.id}`;
                else if (target.textContent && target.textContent.trim().length > 0 && target.textContent.trim().length < 30) {
                    from += ` "${target.textContent.trim()}"`;
                }
                // Determine "To" (Action/Target)
                let to = 'User Action';
                if (target.tagName === 'BUTTON' && target.type === 'submit')
                    to = 'Submit Form';
                else if (target.tagName === 'SUMMARY')
                    to = 'Toggle Details';
                else if (target.onclick || target.hasAttribute('onclick'))
                    to = 'Script Handler';
                else if (target.dataset.wb)
                    to = `WB Behavior (${target.dataset.wb})`;
                else if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
                    to = 'Input Interaction';
                lastInteraction = { from, to, timestamp: Date.now() };
            }
        }
        catch (err) {
            // Ignore interaction tracking errors
        }
    }, true);
}
/**
 * Parse stack trace to extract useful info
 */
function parseStack(stack) {
    if (!stack)
        return { module: 'unknown', line: '?', column: '?', frames: [] };
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
    if (!frames || frames.length === 0)
        return '';
    return frames.slice(0, maxFrames).map((f, i) => {
        const arrow = i === 0 ? '▶' : '  ↳';
        return `${arrow} ${f.function}()\n     ${f.file}:${f.line}:${f.column}`;
    }).join('\n');
}
/**
 * Create or get the error display container
 */
function getErrorContainer() {
    if (errorContainer)
        return errorContainer;
    // Add CSS animations if not present
    if (!document.getElementById('wb-events-styles')) {
        const style = document.createElement('style');
        style.id = 'wb-events-styles';
        style.textContent = `
      @keyframes wb-slide-in {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes wb-fade-out {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      .wb-error-toast {
        font-family: system-ui, -apple-system, sans-serif;
        animation: wb-slide-in 0.3s ease;
      }
      .wb-error-toast.closing {
        animation: wb-fade-out 0.3s ease;
      }
      .wb-stack-frame {
        font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
        font-size: 11px;
        line-height: 1.6;
        color: #a5f3fc;
      }
      .wb-error-toast details summary {
        cursor: pointer;
        padding: 4px 0;
      }
      .wb-error-toast details summary:hover {
        color: white;
      }
      .wb-error-module {
        background: rgba(255,255,255,0.15);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: monospace;
        font-size: 11px;
      }
    `;
        document.head.appendChild(style);
    }
    errorContainer = document.createElement('div');
    errorContainer.id = 'wb-events-container';
    errorContainer.style.cssText = `
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 500px;
    pointer-events: none;
  `;
    document.body.appendChild(errorContainer);
    return errorContainer;
}
/**
 * Show a visual toast notification with full error details
 */
function showToast(level, message, data = {}) {
    const container = getErrorContainer();
    const colors = {
        error: { bg: 'rgba(220, 38, 38, 0.97)', border: '#b91c1c', icon: '❌', label: 'ERROR' },
        warn: { bg: 'rgba(217, 119, 6, 0.97)', border: '#b45309', icon: '⚠️', label: 'WARN' },
        info: { bg: 'rgba(37, 99, 235, 0.97)', border: '#1d4ed8', icon: 'ℹ️', label: 'INFO' },
        success: { bg: 'rgba(22, 163, 74, 0.97)', border: '#15803d', icon: '✅', label: 'OK' }
    };
    const c = colors[level] || colors.info;
    const stackInfo = parseStack(data.stack);
    const toast = document.createElement('div');
    toast.className = 'wb-error-toast';
    toast.style.cssText = `
    background: ${c.bg};
    border-left: 4px solid ${c.border};
    color: white;
    padding: 0.875rem 1rem;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    pointer-events: auto;
    max-width: 100%;
  `;
    // Build header with module info
    let headerHTML = `
    <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
      <span style="font-size:1.2rem;">${c.icon}</span>
      <span style="font-weight:700;font-size:12px;letter-spacing:0.5px;">${c.label}</span>
  `;
    // Add module badge
    if (data.module || stackInfo.module !== 'unknown') {
        const moduleName = data.module || stackInfo.module;
        headerHTML += `<span class="wb-error-module">${escapeHtml(moduleName)}</span>`;
    }
    // Add line number
    if (data.line || stackInfo.line !== '?') {
        const lineNum = data.line || stackInfo.line;
        headerHTML += `<span style="opacity:0.7;font-size:11px;">Line ${lineNum}</span>`;
    }
    headerHTML += `
      <button class="wb-error-copy-btn" 
              style="margin-left:auto;margin-right:8px;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);color:white;cursor:pointer;font-size:11px;padding:2px 8px;border-radius:4px;">
        📋 Copy
      </button>
      <button onclick="this.closest('.wb-error-toast').remove()" 
              style="background:none;border:none;color:white;cursor:pointer;opacity:0.7;font-size:1.2rem;padding:0;">×</button>
    </div>
  `;
    // Exception type - show prominently
    let messageHTML = '';
    if (data.name) {
        messageHTML += `
      <div style="font-size:11px;color:#fca5a5;margin-bottom:0.25rem;font-family:monospace;">
        ${escapeHtml(data.name)}
      </div>
    `;
    }
    // Message
    messageHTML += `
    <div style="font-size:13px;font-weight:500;margin-bottom:0.5rem;word-break:break-word;">
      ${escapeHtml(String(message))}
    </div>
  `;
    // File info
    if (data.file || data.fullPath) {
        const filePath = data.file || data.fullPath;
        messageHTML += `
      <div style="font-size:11px;opacity:0.8;margin-bottom:0.5rem;">
        <strong>File:</strong> ${escapeHtml(filePath)}${data.line ? ':' + data.line : ''}${data.column ? ':' + data.column : ''}
      </div>
    `;
    }
    // Error log location hint
    if (level === 'error') {
        messageHTML += `
      <div style="font-size:10px;opacity:0.6;margin-top:0.5rem;font-style:italic;">
        📁 Error log saved to: data/errors.json
      </div>
    `;
    }
    // Stack trace
    let stackHTML = '';
    if (level === 'error' && stackInfo.frames.length > 0) {
        stackHTML = `
      <details style="margin-top:0.5rem;">
        <summary style="cursor:pointer;font-size:11px;opacity:0.8;user-select:none;">
          Stack Trace (${stackInfo.frames.length} frames)
        </summary>
        <div class="wb-stack-frame" style="
          margin-top:0.5rem;
          padding:0.5rem;
          background:rgba(0,0,0,0.2);
          border-radius:4px;
          overflow-x:auto;
          white-space:pre;
          max-height:150px;
          overflow-y:auto;
        ">${escapeHtml(formatStackTrace(stackInfo.frames, 10))}</div>
      </details>
    `;
    }
    else if (data.stack && level === 'error') {
        // Fallback to raw stack if parsing failed
        const shortStack = data.stack.split('\n').slice(0, 6).join('\n');
        stackHTML = `
      <details style="margin-top:0.5rem;">
        <summary style="cursor:pointer;font-size:11px;opacity:0.8;user-select:none;">
          Stack Trace
        </summary>
        <div class="wb-stack-frame" style="
          margin-top:0.5rem;
          padding:0.5rem;
          background:rgba(0,0,0,0.2);
          border-radius:4px;
          overflow-x:auto;
          white-space:pre;
          max-height:150px;
          overflow-y:auto;
        ">${escapeHtml(shortStack)}</div>
      </details>
    `;
    }
    toast.innerHTML = headerHTML + messageHTML + stackHTML;
    container.appendChild(toast);
    // Attach copy handler
    const copyBtn = toast.querySelector('.wb-error-copy-btn');
    if (copyBtn) {
        copyBtn.onclick = (e) => {
            e.stopPropagation();
            const textToCopy = `Error: ${message}\nModule: ${data.module || 'unknown'}\nFile: ${data.file || data.fullPath || 'unknown'}\nLine: ${data.line || '?'}\n\nStack:\n${data.stack || ''}`;
            navigator.clipboard.writeText(textToCopy).then(() => {
                copyBtn.textContent = '✔️ Copied';
                copyBtn.style.background = 'rgba(34, 197, 94, 0.4)';
                setTimeout(() => {
                    copyBtn.textContent = '📋 Copy';
                    copyBtn.style.background = 'rgba(255,255,255,0.2)';
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
 * Save error to JSON file
 */
async function saveToFile(entry) {
    try {
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                location: ERROR_LOG_PATH,
                data: {
                    lastUpdated: new Date().toISOString(),
                    count: errors.length,
                    errors: errors.slice(-100)
                }
            })
        });
        if (!response.ok) {
            console.warn('[Events] Failed to save error log');
        }
    }
    catch (e) {
        // Silent fail - don't create infinite loop
    }
}
/**
 * Escape HTML for safe display
 */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
/**
 * Extract error details from an Error object
 */
function extractErrorDetails(error) {
    if (!error)
        return {};
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
                if (data.name)
                    console.error(`Type: %c${data.name}`, 'color: #f87171');
                if (data.file)
                    console.error(`File: ${data.file}`);
                if (data.stack) {
                    console.groupCollapsed('Stack Trace');
                    console.error(data.stack);
                    console.groupEnd();
                }
                console.groupEnd();
            }
            else if (level === 'warn') {
                console.warn(`⚠️ ${prefix} ${fullMessage}`, `[${location}]`);
            }
            else {
                console.log(`${prefix} ${fullMessage}`);
            }
        }
        // Visual toast for errors and warnings
        if ((level === 'error' || level === 'warn') && typeof document !== 'undefined') {
            showToast(level, fullMessage, data);
        }
        // Save errors to file and memory
        if (level === 'error') {
            // Check if interaction is relevant (within last 5 seconds)
            const interaction = (Date.now() - lastInteraction.timestamp < 5000)
                ? { from: lastInteraction.from, to: lastInteraction.to }
                : { from: 'System', to: 'Background Process' };
            const entry = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                level,
                source,
                module: data.module,
                line: data.line,
                column: data.column,
                function: data.function,
                message: String(message),
                stack: data.stack,
                frames: data.frames,
                file: data.file || data.fullPath,
                url: typeof window !== 'undefined' ? window.location.href : '',
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                interaction
            };
            errors.push(entry);
            saveToFile(entry);
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
        if (typeof window === 'undefined')
            return;
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
            }
            else {
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
     * Get all logged errors
     */
    getErrors() {
        return errors;
    },
    /**
     * Clear all errors
     */
    clearErrors() {
        errors = [];
        saveToFile({});
    },
    /**
     * Get error count
     */
    getErrorCount() {
        return errors.length;
    }
};
export default Events;
//# sourceMappingURL=events.js.map