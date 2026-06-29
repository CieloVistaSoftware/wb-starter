/**
 * WB Dev Console - injectable on any page
 * Usage: <script src="src/core/wb-devconsole.js"></script>
 * Toggle: Ctrl+`  |  Run: Ctrl+Enter  |  History: Up/Down
 */
(function () {
  if (document.getElementById('wbdc-panel')) return;

  // ── EARLY CAPTURE — intercept before anything else fires ──────────
  var __buf = window.__wbdcBuffer = window.__wbdcBuffer || [];
  ['log','info','warn','error'].forEach(function(t) {
    var orig = console[t].bind(console);
    console[t] = function() { orig.apply(console, arguments); __buf.push({ type: t, args: Array.prototype.slice.call(arguments) }); };
  });
  // Wrap fetch to catch 404s and network errors
  if (window.fetch && !window.__wbdcFetchWrapped) {
    window.__wbdcFetchWrapped = true;
    var _origFetch = window.fetch;
    window.fetch = function() {
      var args = arguments;
      return _origFetch.apply(window, args).then(function(res) {
        if (!res.ok) {
          var url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || String(args[0]);
          __buf.push({ type: 'error', args: ['[Network] ' + res.status + ' ' + res.statusText + ' — ' + url] });
        }
        return res;
      }).catch(function(e) {
        var url = typeof args[0] === 'string' ? args[0] : String(args[0]);
        __buf.push({ type: 'error', args: ['[Network] fetch failed — ' + e.message + ' (' + url + ')'] });
        throw e;
      });
    };
  }
  window.addEventListener('error', function(e) {
    var file = e.filename ? e.filename.split('/').pop() : '';
    __buf.push({ type: 'error', args: ['[Runtime] ' + e.message + (file ? ' (' + file + ':' + e.lineno + ')' : '')] });
  });
  window.addEventListener('unhandledrejection', function(e) {
    var msg = e.reason && e.reason.message ? e.reason.message : String(e.reason);
    __buf.push({ type: 'error', args: ['[Unhandled Promise] ' + msg] });
  });

  var style = document.createElement('style');
  style.textContent = '#wbdc-fab{position:fixed;bottom:1.25rem;right:1.25rem;width:42px;height:42px;border-radius:50%;background:#238636;border:none;color:#fff;font-size:1.1rem;cursor:pointer;z-index:99998;box-shadow:0 4px 14px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;transition:transform .15s}#wbdc-fab:hover{transform:scale(1.1)}#wbdc-panel{position:fixed;bottom:1.25rem;right:1.25rem;width:740px;max-width:calc(100vw - 2rem);height:460px;display:none;flex-direction:column;background:#0d1117;border:1px solid #30363d;border-radius:10px;box-shadow:0 24px 64px rgba(0,0,0,.8);z-index:99999;font-family:monospace;font-size:.78rem;overflow:hidden;resize:both}#wbdc-panel.open{display:flex}#wbdc-bar{display:flex;align-items:center;gap:.4rem;padding:.4rem .75rem;background:#161b22;border-bottom:1px solid #30363d;cursor:move;user-select:none;flex-shrink:0}#wbdc-bar-label{flex:1;font-size:.65rem;font-weight:700;color:#8b949e;text-transform:uppercase;letter-spacing:.08em}.wbdc-btn{padding:.2rem .55rem;border:1px solid #30363d;border-radius:4px;background:#21262d;color:#c9d1d9;font-family:inherit;font-size:.7rem;cursor:pointer;line-height:1.4}.wbdc-btn:hover{background:#30363d}.wbdc-run{background:#238636;border-color:#2ea043;color:#fff}.wbdc-run:hover{background:#2ea043}.wbdc-cls:hover{background:#da3633;border-color:#da3633;color:#fff}.wbdc-copied{background:#1f6feb!important;border-color:#388bfd!important;color:#fff!important}#wbdc-body{display:grid;grid-template-columns:1fr 1fr;flex:1;overflow:hidden}#wbdc-editor{border:none;border-right:1px solid #30363d;outline:none;resize:none;background:#0d1117;color:#e6edf3;padding:.75rem;font-family:inherit;font-size:.78rem;line-height:1.7;tab-size:2;white-space:pre;overflow:auto}#wbdc-editor::placeholder{color:#484f58}#wbdc-output{background:#0d1117;overflow-y:auto;padding:.5rem .75rem}.wbdc-line{display:flex;gap:.4rem;padding:.15rem 0;border-bottom:1px solid rgba(255,255,255,.03);word-break:break-all;line-height:1.5}.wbdc-log{color:#e6edf3}.wbdc-info{color:#58a6ff}.wbdc-warn{color:#d29922}.wbdc-error{color:#f85149}.wbdc-result{color:#3fb950}.wbdc-icon{flex-shrink:0;width:1rem;opacity:.5}.wbdc-empty{color:#484f58;padding:.25rem 0}';
  document.head.appendChild(style);

  // FAB button
  var fab = document.createElement('button');
  fab.id = 'wbdc-fab';
  fab.title = 'Dev Console (Ctrl+`)';
  fab.textContent = '\u2325';
  document.body.appendChild(fab);

  // Panel
  var panel = document.createElement('div');
  panel.id = 'wbdc-panel';
  document.body.appendChild(panel);

  // Bar
  var bar = document.createElement('div');
  bar.id = 'wbdc-bar';
  panel.appendChild(bar);

  var lbl = document.createElement('span');
  lbl.id = 'wbdc-bar-label';
  function updateLabel() {
    var page = new URLSearchParams(window.location.search).get('page')
      || window.location.pathname.split('/').pop().replace('.html', '')
      || 'home';
    lbl.textContent = '\uD83D\uDEE0 WB Dev Console  \u00B7  ' + page;
  }
  updateLabel();
  var _origPush = history.pushState;
  history.pushState = function() { _origPush.apply(history, arguments); updateLabel(); };
  window.addEventListener('popstate', updateLabel);
  bar.appendChild(lbl);

  function mkBtn(text, extraClass) {
    var b = document.createElement('button');
    b.className = 'wbdc-btn' + (extraClass ? ' ' + extraClass : '');
    b.type = 'button';
    b.textContent = text;
    bar.appendChild(b);
    return b;
  }

  var btnClear   = mkBtn('Clear');
  var btnRefresh = mkBtn('\u21ba Refresh');
  var btnRun     = mkBtn('\u25B6 Run', 'wbdc-run');
  var btnClose   = mkBtn('\u2715', 'wbdc-cls');

  // Body
  var body = document.createElement('div');
  body.id = 'wbdc-body';
  panel.appendChild(body);

  var editor = document.createElement('textarea');
  editor.id = 'wbdc-editor';
  editor.spellcheck = false;
  editor.placeholder = '// Paste JS here\n// Ctrl+Enter to run\n// \u2191\u2193 history';
  body.appendChild(editor);

  var output = document.createElement('div');
  output.id = 'wbdc-output';
  body.appendChild(output);
  resetOutput();

  // History
  var HIST_KEY = 'wbdc_history';
  var cmdHist = [];
  try { cmdHist = JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch(e) {}
  var histIdx = -1;
  var savedDraft = '';

  function resetOutput() {
    output.innerHTML = '';
    var d = document.createElement('div');
    d.className = 'wbdc-empty';
    d.textContent = '// Output appears here...';
    output.appendChild(d);
  }

  function toggle() {
    var isOpen = panel.classList.contains('open');
    if (isOpen) {
      panel.classList.remove('open');
      fab.style.display = 'flex';
    } else {
      panel.classList.add('open');
      fab.style.display = 'none';
      editor.focus();
    }
  }

  function addLine(type, icon, args) {
    var emp = output.querySelector('.wbdc-empty');
    if (emp) output.removeChild(emp);
    var row = document.createElement('div');
    row.className = 'wbdc-line wbdc-' + type;
    var ic = document.createElement('i');
    ic.className = 'wbdc-icon';
    ic.textContent = icon;
    var sp = document.createElement('span');
    sp.textContent = args.map(function(a) {
      if (a === null) return 'null';
      if (a === undefined) return 'undefined';
      if (typeof a === 'object') { try { return JSON.stringify(a, null, 2); } catch(e2) { return String(a); } }
      return String(a);
    }).join(' ');
    row.appendChild(ic);
    row.appendChild(sp);
    output.appendChild(row);
    output.scrollTop = output.scrollHeight;
  }

  function doCopy() {
    var code = editor.value.trim();
    var spans = output.querySelectorAll('.wbdc-line span');
    var outText = Array.prototype.map.call(spans, function(s) { return s.textContent; }).join('\n');
    var text = '--- INPUT ---\n' + code + '\n\n--- OUTPUT ---\n' + (outText || '(none)');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(flashCopy).catch(function() { fallback(text); });
    } else {
      fallback(text);
    }
  }

  function fallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand('copy'); flashCopy(); } catch(e) {}
    document.body.removeChild(ta);
  }

  function flashCopy() {
    var toast = document.createElement('div');
    toast.textContent = '\u2713 Output Copied';
    toast.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:#238636;color:#fff;padding:.4rem 1rem;border-radius:6px;font-family:monospace;font-size:.78rem;z-index:999999;pointer-events:none;transition:opacity .4s';
    document.body.appendChild(toast);
    setTimeout(function() { toast.style.opacity = '0'; }, 1200);
    setTimeout(function() { document.body.removeChild(toast); }, 1600);
  }

  function runCode() {
    var code = editor.value.trim();
    if (!code) return;

    // History
    if (!cmdHist.length || cmdHist[cmdHist.length - 1] !== code) {
      cmdHist.push(code);
      try { localStorage.setItem(HIST_KEY, JSON.stringify(cmdHist.slice(-20))); } catch(e) {}
    }
    histIdx = -1;
    savedDraft = '';

    // Intercept console
    var orig = { log: console.log, info: console.info, warn: console.warn, error: console.error };
    console.log   = function() { orig.log.apply(console, arguments);   addLine('log',    '>', Array.prototype.slice.call(arguments)); };
    console.info  = function() { orig.info.apply(console, arguments);  addLine('info',   'i', Array.prototype.slice.call(arguments)); };
    console.warn  = function() { orig.warn.apply(console, arguments);  addLine('warn',   '!', Array.prototype.slice.call(arguments)); };
    console.error = function() { orig.error.apply(console, arguments); addLine('error',  'x', Array.prototype.slice.call(arguments)); };

    try {
      var result = eval(code);
      if (result !== undefined) addLine('result', '<', [result]);
    } catch(err) {
      addLine('error', 'x', [err.message]);
    }

    console.log   = orig.log;
    console.info  = orig.info;
    console.warn  = orig.warn;
    console.error = orig.error;

    doCopy();
  }

  // Wire events
  fab.onclick        = toggle;
  btnClose.onclick   = toggle;
  btnRun.onclick     = runCode;
  btnClear.onclick   = resetOutput;
  btnRefresh.onclick = function() {
    try { sessionStorage.setItem('wbdc_open', '1'); } catch(e) {}
    window.location.reload();
  };
  // Reopen panel after refresh
  try {
    if (sessionStorage.getItem('wbdc_open')) {
      sessionStorage.removeItem('wbdc_open');
      panel.classList.add('open');
      fab.style.display = 'none';
      addLine('info', 'i', ['[Console] Page refreshed — watching for errors...']);
    }
  } catch(e) {}

  // ── Runtime error capture ─────────────────────────────
  window.addEventListener('error', function(e) {
    var file = e.filename ? e.filename.split('/').pop() : '';
    addLine('error', 'x', ['[Runtime] ' + e.message + (file ? ' (' + file + ':' + e.lineno + ')' : '')]);
    if (!panel.classList.contains('open')) toggle();
  });
  window.addEventListener('unhandledrejection', function(e) {
    var msg = e.reason && e.reason.message ? e.reason.message : String(e.reason);
    addLine('error', 'x', ['[Unhandled Promise] ' + msg]);
    if (!panel.classList.contains('open')) toggle();
  });
  // Permanently intercept console.error for runtime errors
  var _origErr = console.error.bind(console);
  console.error = function() { _origErr.apply(console, arguments); addLine('error', 'x', Array.prototype.slice.call(arguments)); };

  editor.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runCode(); return; }
    if (e.key === 'Tab') {
      e.preventDefault();
      var s = editor.selectionStart;
      editor.value = editor.value.substring(0, s) + '  ' + editor.value.substring(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = s + 2;
      return;
    }
    if (e.key === 'ArrowUp') {
      if (!cmdHist.length) return;
      e.preventDefault();
      if (histIdx === -1) savedDraft = editor.value;
      histIdx = Math.min(histIdx + 1, cmdHist.length - 1);
      editor.value = cmdHist[cmdHist.length - 1 - histIdx];
      editor.selectionStart = editor.selectionEnd = editor.value.length;
      return;
    }
    if (e.key === 'ArrowDown') {
      if (histIdx === -1) return;
      e.preventDefault();
      histIdx--;
      editor.value = (histIdx === -1) ? savedDraft : cmdHist[cmdHist.length - 1 - histIdx];
      editor.selectionStart = editor.selectionEnd = editor.value.length;
      return;
    }
  });

  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === '`') { e.preventDefault(); toggle(); }
  });

  // Draggable
  var drag = false, ox = 0, oy = 0;
  bar.addEventListener('mousedown', function(e) {
    if (e.target.tagName === 'BUTTON') return;
    drag = true;
    var r = panel.getBoundingClientRect();
    ox = e.clientX - r.left; oy = e.clientY - r.top;
    panel.style.right = 'auto'; panel.style.bottom = 'auto';
  });
  document.addEventListener('mousemove', function(e) {
    if (drag) { panel.style.left = (e.clientX - ox) + 'px'; panel.style.top = (e.clientY - oy) + 'px'; }
  });
  document.addEventListener('mouseup', function() { drag = false; });

})();
