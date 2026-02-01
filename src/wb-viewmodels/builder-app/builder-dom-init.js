// Lightweight DOM binder — MINIMAL (data-on* only)
// Purpose: keep DOM wiring small and idempotent while real behavior
// is implemented in viewmodels. Do NOT add feature logic here.

// Safe assign: only define globals when they don't already exist.
function safeAssign(name, fn) {
  if (!window[name]) window[name] = fn;
}

// MENU HANDLING (delegated)
function initMenuHandlers() { /* delegated to `builder-menu.js` — kept as noop shim */ }

// autoResizeCanvas delegated to viewmodels
function autoResizeCanvasImpl() { /* noop — viewmodel should provide real impl */ }

// makeDraggable delegated to viewmodels
function makeDraggableImpl() { /* noop shim; viewmodel should provide behavior */ }

// doPreview should be implemented by viewmodels; provide a safe shim only
safeAssign('doPreview', function doPreviewFallback() { console.warn('[wb] doPreview is a shim; implement in viewmodels'); });

// Sidebar / panels: delegated to viewmodels (no DOM logic here)
safeAssign('toggleLeft', () => { console.warn('[wb] toggleLeft shim'); });
safeAssign('toggleRight', () => { console.warn('[wb] toggleRight shim'); });

// Component chooser: delegated to viewmodels
safeAssign('openChooser', () => { console.warn('[wb] openChooser shim'); });
safeAssign('closeChooser', () => { console.warn('[wb] closeChooser shim'); });

// Init resize handles (keeps behavior if not provided elsewhere)
function initResizeImpl(handleId, panelId, isLeft) {
  const handle = document.getElementById(handleId);
  const panel = document.getElementById(panelId);
  if (!handle || !panel) return;
  let startX, startW;
  handle.addEventListener('mousedown', e => {
    e.preventDefault(); e.stopPropagation(); startX = e.clientX; startW = panel.offsetWidth;
    panel.classList.add('resizing'); document.body.style.cursor = 'ew-resize'; document.body.style.userSelect = 'none';
    const onMove = ev => {
      const dx = isLeft ? (ev.clientX - startX) : (startX - ev.clientX);
      const newW = Math.min(window.innerWidth * 0.5, Math.max(200, startW + dx));
      panel.style.cssText = `flex: 0 0 ${newW}px !important; width: ${newW}px !important; min-width: ${newW}px !important; max-width: ${newW}px !important;`;
    };
    const onUp = () => { panel.classList.remove('resizing'); document.body.style.cursor = ''; document.body.style.userSelect = ''; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
  });
}

// Attach data-on* attributes (replaces inline on* attributes in markup)
function attachDataHandlers() {
  const parseFnCall = (str) => {
    // support: fnName() or fnName('arg') or fnName("arg") or fnName(this.value)
    const mSimple = /^\s*([\w$]+)\s*\(\s*\)\s*$/.exec(str);
    if (mSimple) return { name: mSimple[1], argType: 'none' };
    const mArg = /^\s*([\w$]+)\s*\(\s*(['"])(.*)\2\s*\)\s*$/.exec(str);
    if (mArg) return { name: mArg[1], argType: 'string', arg: mArg[3] };
    const mThisVal = /^\s*([\w$]+)\s*\(\s*this\.value\s*\)\s*$/.exec(str);
    if (mThisVal) return { name: mThisVal[1], argType: 'value' };
    return null;
  };

  const bind = (el, evt, attr) => {
    if (el.dataset.wbBound) return; // idempotent
    const raw = el.getAttribute(attr);
    if (!raw) return;
    const parsed = parseFnCall(raw.trim());
    if (!parsed) return;
    const fn = window[parsed.name];
    if (typeof fn !== 'function') return;
    const handler = (e) => {
      try {
        if (parsed.argType === 'none') return fn.call(window, e);
        if (parsed.argType === 'value') return fn.call(window, e.target.value);
        if (parsed.argType === 'string') return fn.call(window, parsed.arg);
      } catch (err) {
        console.warn('[wb] data-on handler failed', parsed.name, err);
      }
    };
    el.addEventListener(evt, handler);
    el.dataset.wbBound = '1';
  };

  // data-onclick
  document.querySelectorAll('[data-onclick]').forEach(el => bind(el, 'click', 'data-onclick'));
  document.querySelectorAll('[data-oninput]').forEach(el => bind(el, 'input', 'data-oninput'));
  document.querySelectorAll('[data-onchange]').forEach(el => bind(el, 'change', 'data-onchange'));
}

// Idempotent initializer (MINIMAL)
function __wb_builder_dom_init() {
  // Delegate all feature behavior to viewmodels (they should register their APIs)
  try { attachDataHandlers(); } catch (e) { /* non-fatal */ }
  // If legacy callers expect light no-op shims, provide harmless stubs only.
  safeAssign('autoResizeCanvas', () => {});
  safeAssign('makeDraggable', () => {});
  safeAssign('initResize', () => {});
}


// Run once (idempotent)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', __wb_builder_dom_init);
} else {
  __wb_builder_dom_init();
}

// Marker export for tests to detect the binder
export const __wb_builder_dom = true;
