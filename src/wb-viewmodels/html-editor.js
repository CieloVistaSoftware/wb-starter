// wb-html-editor behavior
// Provides an inline HTML editor for the builder properties panel.
// Features: inline textarea, live preview, attribute editor, simple sanitize, copy, save (model only).

export function htmlEditor(element) {
  element.classList.add('wb-html-editor');

  // inject styles once
  if (!document.getElementById('wb-html-editor-styles')) {
    const s = document.createElement('style');
    s.id = 'wb-html-editor-styles';
    s.textContent = `
      /* Default (modern dark) variables */
      .wb-html-editor { --primary: #6366f1; --bg-primary: #0b1220; --bg-secondary: #0f1724; --bg-tertiary: #0b1220; --text-primary: #e6eef8; --text-secondary: #9aaabe; --border-color: rgba(255,255,255,0.06); font-family: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }

      /* Layout improvements: responsive, non-breaking, and tidy spacing */
      .wb-html-editor__wrap { display: flex; gap: .75rem; align-items: stretch; flex-wrap: wrap; }
      .wb-html-editor__left { flex: 1 1 420px; min-width: 220px; max-width: 900px; box-sizing: border-box; }
      .wb-html-editor__textarea { width: 100%; min-height: 140px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', monospace; font-size: 13px; color: var(--text-primary); background: var(--bg-secondary); border: 1px solid var(--border-color); padding: .5rem; border-radius: 8px; resize: vertical; box-sizing: border-box; box-shadow: inset 0 1px 0 rgba(255,255,255,0.02); }
      .wb-html-editor__controls { display:flex; gap:.5rem; margin-top:.5rem; align-items:center; flex-wrap:wrap; }
      .wb-html-editor__btn { background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); border:1px solid var(--border-color); color:var(--text-primary); padding:.45rem .8rem; border-radius:8px; cursor:pointer; font-size:0.92rem; white-space:nowrap; transition: transform .08s ease, box-shadow .08s ease; }
      .wb-html-editor__btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(8,10,20,0.45); }
      .wb-html-editor__attr-list { margin-top:.5rem; display:flex; flex-direction:column; gap:.35rem; max-width:100%; }
      .wb-html-editor__attr { display:flex; gap:.5rem; align-items:center; }
      .wb-html-editor__attr input{ font-size:0.85rem; padding:.25rem .4rem; border-radius:6px; border:1px solid var(--border-color); background:transparent; color:var(--text-primary); }
      .wb-html-editor__preview { min-width:160px; flex: 0 0 28%; max-width:36%; background:linear-gradient(180deg, rgba(255,255,255,0.02), transparent); border:1px solid var(--border-color); padding:.6rem; border-radius:8px; overflow:auto; font-size:13px; box-sizing:border-box; }
      .wb-html-editor__meta { margin-top:.4rem; color:var(--text-secondary); font-size:0.8rem; }
      .wb-html-editor__find { display:flex; gap:.4rem; margin-top:.5rem; }

      /* Tabs */
      .wb-html-editor__tabs { display:flex; gap:.35rem; }
      .wb-html-editor__tab { background:transparent; border:1px solid transparent; color:var(--text-secondary); padding:.4rem .7rem; border-radius:8px; cursor:pointer; font-weight:600; }
      .wb-html-editor__tab--active { background: linear-gradient(90deg, rgba(99,102,241,0.15), rgba(168,85,247,0.06)); color:var(--primary); border:1px solid rgba(99,102,241,0.12); }

      /* Small screens: stack and hide gutter */
      @media (max-width: 760px) {
        .wb-html-editor__wrap { flex-direction: column; }
        .wb-html-editor__cm-gutter { display: none; }
        .wb-html-editor__preview { max-width: 100%; flex-basis: auto; order: 3; }
        .wb-html-editor__left { max-width: 100%; }
      }

      /* Theme overrides (editor-level) — explicit light mode */
      .wb-html-editor[theme="light"] { --bg-primary: #ffffff; --bg-secondary: #f6f7fb; --bg-tertiary: #f2f4f8; --text-primary: #0b1220; --text-secondary: #5b6b7a; --border-color: #e6e9ef; }
      .wb-html-editor[theme="dark"] { --bg-primary: #0b1220; --bg-secondary: #0f1724; --bg-tertiary: #0b1220; --text-primary: #e6eef8; --text-secondary: #9aaabe; --border-color: rgba(255,255,255,0.06); }

      /* Diff modal */
      .wb-html-editor__diff-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.45); display:none; align-items:center; justify-content:center; z-index:9999; }
      .wb-html-editor__diff-modal { width:86%; max-width:1200px; background:var(--bg-primary); border:1px solid var(--border-color); color:var(--text-primary); border-radius:8px; padding:1rem; box-shadow:0 12px 40px rgba(2,6,23,0.6); max-height:80vh; overflow:auto; }
      .wb-html-editor__diff-rows { display:flex; gap:1rem; }
      .wb-html-editor__diff-column { flex:1; min-width:0; background:var(--bg-tertiary); padding:.5rem; border-radius:6px; font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', monospace; font-size:13px; white-space:pre-wrap; overflow:auto; max-height:60vh; }
      .wb-html-editor__diff-actions { display:flex; gap:.5rem; justify-content:flex-end; margin-top:.6rem; }

      /* Hunk highlights */
      .wb-diff-line { display:block; padding:0 .4rem; margin:0; }
      .wb-diff-line--added { background: rgba(56, 161, 105, 0.12); border-left:3px solid rgba(56,161,105,0.9); }
      .wb-diff-line--removed { background: rgba(239,68,68,0.07); border-left:3px solid rgba(239,68,68,0.9); text-decoration:line-through; }
      .wb-diff-line--changed { background: rgba(250,204,21,0.06); border-left:3px solid rgba(250,204,21,0.9); }

      /* CodeMirror gutter (per-hunk quick actions) */
      .wb-html-editor__cm-gutter { background: linear-gradient(180deg, rgba(0,0,0,0.02), transparent); border-radius:6px; padding:.4rem; box-sizing:border-box; min-height:120px; }
      .wb-html-editor__cm-gutter .gutter-item { display:flex; align-items:center; justify-content:space-between; gap:.5rem; padding:.35rem; border-radius:6px; margin-bottom:.35rem; background:var(--bg-tertiary); border:1px solid var(--border-color); font-size:0.85rem; }
      .wb-html-editor__cm-gutter .gutter-item button { padding:.25rem .45rem; font-size:0.82rem; }

      /* History list */
      .wb-html-editor__history { margin-top:.6rem; display:flex; gap:.5rem; align-items:center; }
      .wb-html-editor__history-list { display:flex; gap:.5rem; overflow:auto; padding:0.25rem 0; }
      .wb-html-editor__history-item { background:var(--bg-tertiary); border:1px solid var(--border-color); padding:.35rem .5rem; border-radius:6px; font-size:0.85rem; cursor:pointer; display:flex; gap:.4rem; align-items:center; }
      .wb-html-editor__history-item--active { outline:2px solid var(--primary); }
    `;
    document.head.appendChild(s);
  }

  element.innerHTML = `
    <div class="wb-html-editor__wrap wb-html-editor--modern">

      <div class="wb-html-editor__tabs" role="tablist" aria-label="Editor Tabs" style="margin-bottom:.5rem;">
        <button class="wb-html-editor__tab wb-html-editor__tab--active" tab="editor" role="tab" aria-selected="true">Editor</button>
        <button class="wb-html-editor__tab" tab="preview" role="tab">Preview</button>
        <button class="wb-html-editor__tab" tab="attributes" role="tab">Attributes</button>
        <button class="wb-html-editor__tab" tab="history" role="tab">History</button>
      </div>

      <div class="wb-html-editor__left">
        <div class="wb-html-editor__pane wb-html-editor__pane--editor" pane="editor">
          <textarea class="wb-html-editor__textarea" spellcheck="false" aria-label="HTML editor"></textarea>

          <div class="wb-html-editor__controls">
            <button class="wb-html-editor__btn wb-html-editor__save">💾 Save</button>
            <button class="wb-html-editor__btn wb-html-editor__import-canvas">📥 Import canvas</button>
            <button class="wb-html-editor__btn wb-html-editor__copy">📋 Copy</button>
            <button class="wb-html-editor__btn wb-html-editor__sanitize">🧼 Sanitize</button>
            <button class="wb-html-editor__btn wb-html-editor__cm-toggle" title="Toggle CodeMirror">🧾 CodeMirror</button>
            <button class="wb-html-editor__btn wb-html-editor__undo-merge" title="Undo last merge" disabled>↶ Undo merge</button>
            <div style="flex:1"></div>
            <div class="wb-html-editor__meta">
              Mode: <label style="margin-left:.35rem"><input type="radio" name="wb-html-mode" value="element" checked> Element</label>
              <label style="margin-left:.35rem"><input type="radio" name="wb-html-mode" value="canvas"> Canvas</label>
              <button class="wb-html-editor__btn wb-html-editor__theme-toggle" title="Toggle editor theme" style="margin-left:.6rem">☼ Theme</button>
            </div>
          </div>

          <div class="wb-html-editor__find">
            <input class="wb-html-editor__find-input" placeholder="Find" style="flex:1;padding:.3rem;border:1px solid var(--border-color);border-radius:4px;background:transparent;color:var(--text-primary)">
            <input class="wb-html-editor__replace-input" placeholder="Replace" style="width:120px;padding:.3rem;border:1px solid var(--border-color);border-radius:4px;background:transparent;color:var(--text-primary)">
            <button class="wb-html-editor__btn wb-html-editor__find-btn">Find</button>
            <button class="wb-html-editor__btn wb-html-editor__replace-btn">Replace</button>
          </div>

          <!-- CodeMirror will be mounted into this container when enabled; textarea remains as canonical source -->
          <div style="display:flex;gap:.5rem;align-items:flex-start;margin-top:.5rem;">
            <div class="wb-html-editor__cm-gutter" aria-hidden="true" style="width:160px;flex:0 0 160px;">&nbsp;</div>
            <div class="wb-html-editor__cm-container" aria-hidden="true" style="flex:1;"></div>
          </div>
        </div>

        <div class="wb-html-editor__pane wb-html-editor__pane--attributes" pane="attributes" style="display:none;">
          <div class="wb-html-editor__attr-list" aria-hidden="false"></div>
        </div>

        <div class="wb-html-editor__pane wb-html-editor__pane--history" pane="history" style="display:none;">
          <div class="wb-html-editor__history" aria-hidden="false">
            <div style="font-size:0.85rem;color:var(--text-secondary);">Backups:</div>
            <div class="wb-html-editor__history-list" role="list" aria-label="backup-history"></div>
            <div style="margin-left:.5rem;display:flex;gap:.4rem;align-items:center;">
              <button class="wb-html-editor__btn wb-html-editor__clear-history" title="Clear all backups">🗑️ Clear</button>
              <div style="color:var(--text-secondary);font-size:0.8rem;">retention: <strong class="wb-html-editor__retention-count">20</strong></div>
            </div>
          </div>
        </div>

      </div>

      <div class="wb-html-editor__preview wb-html-editor__pane--preview" pane="preview" aria-live="polite">Preview</div>
    </div>
  `;

  const textarea = element.querySelector('.wb-html-editor__textarea');
  const preview = element.querySelector('.wb-html-editor__preview');
  const attrsList = element.querySelector('.wb-html-editor__attr-list');
  const saveBtn = element.querySelector('.wb-html-editor__save');
  const copyBtn = element.querySelector('.wb-html-editor__copy');
  const sanitizeBtn = element.querySelector('.wb-html-editor__sanitize');
  const liveCheckbox = element.querySelector('.wb-html-editor__live');
  const findInput = element.querySelector('.wb-html-editor__find-input');
  const replaceInput = element.querySelector('.wb-html-editor__replace-input');
  const findBtn = element.querySelector('.wb-html-editor__find-btn');
  const replaceBtn = element.querySelector('.wb-html-editor__replace-btn');

  // Tabs handling (Editor / Preview / Attributes / History)
  const tabs = Array.from(element.querySelectorAll('.wb-html-editor__tab'));
  const panes = Array.from(element.querySelectorAll('[data-pane]'));
  function showPane(name) {
    panes.forEach(p => p.style.display = (p.getAttribute('data-pane') === name) ? '' : 'none');
    // Preview handled specially: hide left when preview selected for full-width preview
    const previewEl = element.querySelector('.wb-html-editor__preview');
    if (name === 'preview') {
      previewEl.style.display = '';
      element.querySelector('.wb-html-editor__left').style.display = 'none';
      // refresh preview
      updateLivePreview();
    } else {
      previewEl.style.display = '';
      element.querySelector('.wb-html-editor__left').style.display = '';
    }

    // trigger pane-specific renders
    if (name === 'attributes') {
      renderAttrList(getTarget());
    }
    if (name === 'history') {
      renderHistoryList();
    }

    tabs.forEach(t => t.classList.toggle('wb-html-editor__tab--active', t.getAttribute('data-tab') === name));

    // focus editor when returning to editor pane
    if (name === 'editor') textarea.focus();
  }

  tabs.forEach(t => t.addEventListener('click', (e) => { const name = t.getAttribute('data-tab'); showPane(name); }));
  // Initialize default tab
  showPane('editor');

  let targetId = element.dataset.targetId || null;
  let targetEl = null;
  let changeTimer = null;

  function getTarget() {
    targetEl = null;
    if (targetId) targetEl = document.getElementById(targetId) || null;
    if (!targetEl && window.selectedComponent?.element) targetEl = window.selectedComponent.element;
    return targetEl;
  }

  function prettyHtml(str) {
    // minimal pretty — preserve indentation for readability
    const tmp = document.createElement('div');
    tmp.innerHTML = str.trim();
    return tmp.innerHTML;
  }

  function sanitizeHtml(str) {
    const tmp = document.createElement('div');
    tmp.innerHTML = str;
    // remove <script>
    tmp.querySelectorAll('script').forEach(s => s.remove());
    // remove on* attributes
    tmp.querySelectorAll('*').forEach(n => {
      [...n.attributes].forEach(a => {
        if (/^on/i.test(a.name)) n.removeAttribute(a.name);
      });
    });
    return tmp.innerHTML;
  }

  function parseFirstElementFromHtml(html) {
    const c = document.createElement('div');
    c.innerHTML = html.trim();
    return c.firstElementChild || null;
  }

  function applyToTarget(html, { preserveTag = true, raw = false } = {}) {
    const targ = getTarget();
    if (!targ) return false;

    // If raw is requested, avoid sanitizing and try to apply as-is
    if (raw) {
      const parsed = parseFirstElementFromHtml(html);
      if (!parsed) {
        targ.innerHTML = html; // raw
        return true;
      }

      if (preserveTag && parsed.tagName !== targ.tagName) {
        // update innerHTML and attrs only
        targ.innerHTML = parsed.innerHTML;
        const newAttrs = Array.from(parsed.attributes).map(a => a.name);
        Array.from(targ.attributes).forEach(a => {
          if (!newAttrs.includes(a.name)) targ.removeAttribute(a.name);
        });
        Array.from(parsed.attributes).forEach(a => targ.setAttribute(a.name, a.value));
        return true;
      }

      // Same tag
      const parsedAttrs = Array.from(parsed.attributes || []);
      Array.from(targ.attributes).forEach(a => {
        if (!parsed.hasAttribute(a.name)) targ.removeAttribute(a.name);
      });
      parsedAttrs.forEach(a => targ.setAttribute(a.name, a.value));
      targ.innerHTML = parsed.innerHTML;
      return true;
    }

    // Non-raw (legacy) path: sanitize then apply
    const parsed = parseFirstElementFromHtml(sanitizeHtml(html));
    if (!parsed) {
      targ.innerHTML = sanitizeHtml(html);
      return true;
    }

    if (preserveTag && parsed.tagName !== targ.tagName) {
      targ.innerHTML = parsed.innerHTML;
      const newAttrs = Array.from(parsed.attributes).map(a => a.name);
      Array.from(targ.attributes).forEach(a => {
        if (!newAttrs.includes(a.name)) targ.removeAttribute(a.name);
      });
      Array.from(parsed.attributes).forEach(a => targ.setAttribute(a.name, a.value));
      return true;
    }

    const parsedAttrs = Array.from(parsed.attributes || []);
    Array.from(targ.attributes).forEach(a => {
      if (!parsed.hasAttribute(a.name)) targ.removeAttribute(a.name);
    });
    parsedAttrs.forEach(a => targ.setAttribute(a.name, a.value));
    targ.innerHTML = parsed.innerHTML;
    return true;
  }

  function loadFromTarget() {
    const mode = element.dataset.mode || 'element';
    const targ = getTarget();
    if (mode === 'canvas') {
      const canvas = document.getElementById('canvas');
      if (!canvas) {
        textarea.value = '<!-- No canvas found -->';
        preview.textContent = 'No canvas found';
        attrsList.innerHTML = '';
        renderHistoryList();
        return;
      }
      textarea.value = prettyHtml(canvas.outerHTML);
      attrsList.innerHTML = '';
      if (liveCheckbox && liveCheckbox.checked) updateLivePreviewDebounced();
      else preview.innerHTML = escapeHtml(canvas.outerHTML);
      renderHistoryList();
      return;
    }

    if (!targ) {
      textarea.value = '<!-- No element selected -->';
      preview.textContent = 'No element selected';
      attrsList.innerHTML = '';
      renderHistoryList();
      return;
    }

    // show outerHTML to give full context (tag + attrs + content)
    textarea.value = prettyHtml(targ.outerHTML);
    renderAttrList(targ);
    if (liveCheckbox && liveCheckbox.checked) updateLivePreviewDebounced();
    else preview.innerHTML = escapeHtml(targ.outerHTML);
    renderHistoryList();
  }

  function escapeHtml(s) {
    return s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderAttrList(targ) {
    attrsList.innerHTML = '';
    if (!targ) return;
    const attrs = Array.from(targ.attributes || []);
    attrs.forEach(a => {
      const row = document.createElement('div');
      row.className = 'wb-html-editor__attr';
      row.innerHTML = `
        <input class="wb-html-editor__attr-name" value="${a.name}" aria-label="attr-name">
        <input class="wb-html-editor__attr-value" value="${a.value}" aria-label="attr-value">
        <button class="wb-html-editor__btn wb-html-editor__attr-remove">✕</button>
      `;
      const nameInput = row.querySelector('.wb-html-editor__attr-name');
      const valInput = row.querySelector('.wb-html-editor__attr-value');
      const rem = row.querySelector('.wb-html-editor__attr-remove');

      nameInput.addEventListener('change', () => applyAttrChanges());
      valInput.addEventListener('change', () => applyAttrChanges());
      rem.addEventListener('click', () => {
        row.remove();
        applyAttrChanges();
      });

      attrsList.appendChild(row);
    });

    // add an "add attribute" control
    const addBtn = document.createElement('div');
    addBtn.style.marginTop = '.25rem';
    addBtn.innerHTML = '<button class="wb-html-editor__btn">+ Add attribute</button>';
    addBtn.querySelector('button').addEventListener('click', () => {
      const r = document.createElement('div');
      r.className = 'wb-html-editor__attr';
      r.innerHTML = `\n        <input class="wb-html-editor__attr-name" placeholder="name">\n        <input class="wb-html-editor__attr-value" placeholder="value">\n        <button class="wb-html-editor__btn wb-html-editor__attr-remove">✕</button>\n      `;
      r.querySelector('.wb-html-editor__attr-remove').addEventListener('click', () => { r.remove(); applyAttrChanges(); });
      attrsList.appendChild(r);
    });
    attrsList.appendChild(addBtn);
  }

  function applyAttrChanges() {
    const targ = getTarget();
    if (!targ) return;
    const rows = Array.from(attrsList.querySelectorAll('.wb-html-editor__attr'));
    const newAttrs = [];
    rows.forEach(r => {
      const n = r.querySelector('.wb-html-editor__attr-name');
      const v = r.querySelector('.wb-html-editor__attr-value');
      if (!n || !v) return;
      const name = n.value && n.value.trim();
      const val = v.value || '';
      if (name) {
        targ.setAttribute(name, val);
        newAttrs.push(name);
      }
    });
    // remove any attrs not present in the rows
    Array.from(targ.attributes).forEach(a => {
      if (!newAttrs.includes(a.name)) targ.removeAttribute(a.name);
    });
    // reflect change in textarea
    textarea.value = prettyHtml(targ.outerHTML);
    if (liveCheckbox.checked) updateLivePreviewDebounced();
  }

  function updateLivePreview() {
    const val = textarea.value;
    // preview uses sanitized HTML to avoid executing scripts in the preview pane
    const sanitized = sanitizeHtml(val);
    const parsedForPreview = parseFirstElementFromHtml(sanitized);
    preview.innerHTML = parsedForPreview ? parsedForPreview.outerHTML : escapeHtml(sanitized);

    // apply raw HTML to the target (user requested raw HTML should be allowed)
    const mode = element.dataset.mode || 'element';
    if (mode === 'canvas') {
      const canvas = document.getElementById('canvas');
      if (canvas) canvas.innerHTML = val; // raw
    } else {
      applyToTarget(val, { preserveTag: true, raw: true });
    }
  }

  function updateLivePreviewDebounced() {
    clearTimeout(changeTimer);
    changeTimer = setTimeout(() => updateLivePreview(), 180);
  }

  function applySave() {
    const mode = element.dataset.mode || 'element';
    if (mode === 'canvas') {
      const canvas = document.getElementById('canvas');
      if (!canvas) return false;
      // persist raw HTML to canvas
      canvas.innerHTML = textarea.value;
      if (window.updateStatus) window.updateStatus('Updated canvas HTML (raw)');
      // update builder model (in-memory)
      if (window.pages && window.currentPage) {
        const page = window.pages.find(p => p.id === window.currentPage.id || p.slug === window.currentPage.slug);
        if (page) page.main = Array.from(canvas.children).map(c => c.outerHTML);
      }
      return true;
    }

    const targ = getTarget();
    if (!targ) return false;
    const raw = textarea.value;
    // apply raw HTML to the target (user requested raw allowed)
    applyToTarget(raw, { preserveTag: true, raw: true });

    // update builder model if present
    if (window.components) {
      const comp = window.components.find(c => c.id === (targetId || window.selectedComponent?.id));
      if (comp) {
        comp.html = (document.getElementById(comp.id) || comp.element).outerHTML;
      }
    }
    if (window.updateStatus) window.updateStatus('Updated HTML (raw)');
    return true;
  }

  // simple find/replace
  function doFind() {
    const q = findInput.value;
    if (!q) return;
    const idx = textarea.value.indexOf(q);
    if (idx === -1) return;
    textarea.focus();
    textarea.setSelectionRange(idx, idx + q.length);
  }
  function doReplace() {
    const q = findInput.value;
    const r = replaceInput.value;
    if (!q) return;
    textarea.value = textarea.value.split(q).join(r);
    if (liveCheckbox.checked) updateLivePreviewDebounced();
  }

  // helpers
  function copyToClipboard() { navigator.clipboard?.writeText(textarea.value); }

  // CodeMirror dynamic loader (graceful fallback)
  const cmContainer = element.querySelector('.wb-html-editor__cm-container');
  const cmToggle = element.querySelector('.wb-html-editor__cm-toggle');
  element._cmLoaded = false;
  let cmView = null;

  async function loadCodeMirror() {
    if (element._cmLoaded) return true;
    try {
      // dynamic import from CDN — fail silently if unavailable
      const [{EditorView}, {EditorState}, {html}, {default: basicSetup}] = await Promise.all([
        import('https://cdn.jsdelivr.net/npm/@codemirror/view@6.11.3/dist/index.js'),
        import('https://cdn.jsdelivr.net/npm/@codemirror/state@6.2.1/dist/index.js'),
        import('https://cdn.jsdelivr.net/npm/@codemirror/lang-html@6.1.4/dist/index.js'),
        import('https://cdn.jsdelivr.net/npm/@codemirror/basic-setup@0.19.1/dist/index.js').catch(() => ({default: null}))
      ]);

      const startState = EditorState.create({
        doc: textarea.value,
        extensions: [
          basicSetup ? basicSetup() : [],
          html()
        ].flat()
      });

      cmView = new EditorView({ state: startState, parent: cmContainer });
      element._cmLoaded = true;
      element._cm = cmView; // test hook

      // render gutter for the first time
      renderCmGutter();

      // sync CM -> textarea
      cmView.dispatch = (tr) => {
        EditorView.prototype.dispatch.call(cmView, tr);
        const val = cmView.state.doc.toString();
        if (textarea.value !== val) {
          textarea.value = val;
          renderCmGutterDebounced();
          if (liveCheckbox && liveCheckbox.checked) updateLivePreviewDebounced();
        }
      };

      // expose a simple API
      element.applyHunkFromEditor = (idx) => applyHunkFromEditor(idx);
      return true;
    } catch (err) {
      console.warn('CodeMirror failed to load, falling back to textarea', err);
      element._cmLoaded = false;
      return false;
    }
  }

  // toggle CM (attempt to load dynamically)
  cmToggle.addEventListener('click', async () => {
    const enabled = element._cmLoaded;
    if (enabled) {
      // teardown
      if (cmView && cmView.dom && cmView.dom.parentNode) cmView.dom.remove();
      cmView = null;
      element._cmLoaded = false;
      cmContainer.setAttribute('aria-hidden', 'true');
      textarea.style.display = '';
    } else {
      cmContainer.setAttribute('aria-hidden', 'false');
      const ok = await loadCodeMirror();
      if (ok) {
        // if loaded, hide textarea visually (but keep as source of truth)
        textarea.style.display = 'none';
        renderCmGutter();
        if (window.updateStatus) window.updateStatus('CodeMirror enabled');
      } else {
        if (window.updateStatus) window.updateStatus('CodeMirror unavailable — using textarea');
      }
    }
  });

  // Theme toggle (editor-level). Default: inherit site theme unless user overrides.
  const themeToggle = element.querySelector('.wb-html-editor__theme-toggle');
  const THEME_KEY = 'wb-html-editor:theme';
  function applySavedTheme() {
    try {
      const pref = localStorage.getItem(THEME_KEY);
      if (pref === 'light' || pref === 'dark') {
        element.setAttribute('data-theme', pref);
      } else {
        element.removeAttribute('data-theme'); // inherit
      }
    } catch (err) { element.removeAttribute('data-theme'); }
  }
  applySavedTheme();

  themeToggle.addEventListener('click', () => {
    const cur = element.getAttribute('data-theme');
    const next = cur === 'light' ? null : 'light';
    if (next) { element.setAttribute('data-theme', next); localStorage.setItem(THEME_KEY, next); }
    else { element.removeAttribute('data-theme'); localStorage.removeItem(THEME_KEY); }
    if (window.updateStatus) window.updateStatus(`Editor theme: ${next || 'inherit'}`);
  });

  // ensure textarea -> CM sync when user edits fallback
  textarea.addEventListener('input', () => {
    if (element._cmLoaded && cmView) {
      const cur = cmView.state.doc.toString();
      if (cur !== textarea.value) {
        const {EditorState} = cmView.state.constructor;
        cmView.setState(EditorState.create({ doc: textarea.value, extensions: cmView.state.facet ? [] : [] }));
        renderCmGutterDebounced();
      }
    }
    if (liveCheckbox.checked) updateLivePreviewDebounced();
  });

  // --- CM gutter rendering & actions (simple, DOM-based gutter) ---
  let _gutterTimer = null;
  function renderCmGutterDebounced() {
    clearTimeout(_gutterTimer);
    _gutterTimer = setTimeout(() => renderCmGutter(), 120);
  }

  function renderCmGutter() {
    const gutter = element.querySelector('.wb-html-editor__cm-gutter');
    const container = element.querySelector('.wb-html-editor__cm-container');
    if (!gutter || !container) return;
    gutter.innerHTML = '';
    const src = (element._cmLoaded && cmView) ? cmView.state.doc.toString() : textarea.value;
    const frag = document.createElement('div'); frag.innerHTML = src;
    const nodes = Array.from(frag.children || []);
    if (!nodes.length) {
      gutter.innerHTML = '<div style="color:var(--text-secondary);font-size:0.85rem">No top-level nodes</div>';
      return;
    }
    nodes.forEach((node, idx) => {
      const id = node.id || '';
      const title = id ? `${node.tagName.toLowerCase()}#${id}` : node.tagName.toLowerCase();
      const item = document.createElement('div');
      item.className = 'gutter-item';
      item.innerHTML = `<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;">${escapeHtml(title)}</div><div style="display:flex;gap:.35rem;"><button class="wb-html-editor__gutter-apply" idx="${idx}">Apply</button><button class="wb-html-editor__gutter-toggle" idx="${idx}">✔</button></div>`;
      const applyBtn = item.querySelector('.wb-html-editor__gutter-apply');
      const toggleBtn = item.querySelector('.wb-html-editor__gutter-toggle');
      applyBtn.addEventListener('click', (e) => { e.preventDefault(); applyHunkFromEditor(idx); });
      toggleBtn.addEventListener('click', (e) => { e.preventDefault(); toggleHunkSelection(idx); item.classList.toggle('wb-html-editor__gutter--selected'); });
      gutter.appendChild(item);
    });
  }

  const selectedHunks = new Set();
  function toggleHunkSelection(idx) { if (selectedHunks.has(idx)) selectedHunks.delete(idx); else selectedHunks.add(idx); }

  async function applyHunkFromEditor(idx) {
    // Build fragment from editor content and apply the single hunk
    const src = (element._cmLoaded && cmView) ? cmView.state.doc.toString() : textarea.value;
    const frag = document.createElement('div'); frag.innerHTML = src;
    const canvas = document.getElementById('canvas');
    if (!canvas) return false;
    const nodeHunks = buildNodeHunks(frag, canvas);
    if (!nodeHunks[idx]) return false;
    const backupIndex = makeBackup(canvas);
    const edits = mergeFragmentIntoCanvas(frag, { selectedHunkIndexes: [idx], nodeHunks });
    if (window.updateStatus) window.updateStatus(`Applied hunk ${idx} — updated:${edits.updated.length} inserted:${edits.inserted.length} (backup ${backupIndex})`);
    return edits;
  }

  // expose for tests
  element.renderCmGutter = renderCmGutter;
  element.applyHunkFromEditor = applyHunkFromEditor;

  // event wiring (guarded to avoid errors if DOM changes)
  if (saveBtn) saveBtn.addEventListener('click', () => { applySave(); });
  if (copyBtn) copyBtn.addEventListener('click', () => { copyToClipboard(); if (window.updateStatus) window.updateStatus('HTML copied to clipboard'); });
  if (sanitizeBtn) sanitizeBtn.addEventListener('click', () => { textarea.value = sanitizeHtml(textarea.value); if (element._cmLoaded && cmView) cmView.setState(cmView.state.constructor.create({ doc: textarea.value })); if (liveCheckbox.checked) updateLivePreviewDebounced(); if (window.updateStatus) window.updateStatus('Sanitized'); });
  if (findBtn) findBtn.addEventListener('click', doFind);
  if (replaceBtn) replaceBtn.addEventListener('click', doReplace);
  if (liveCheckbox) liveCheckbox.addEventListener('change', () => { if (liveCheckbox.checked) updateLivePreview(); else preview.innerHTML = escapeHtml((getTarget() || {}).outerHTML || ''); });

  // keyboard shortcuts (Ctrl/Cmd+S and Ctrl/Cmd+Shift+I for import canvas)
  element.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      applySave();
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      importCanvas();
    }
  });

  // mode toggles and import button
  const importBtn = element.querySelector('.wb-html-editor__import-canvas');
  const modeRadios = Array.from(element.querySelectorAll('input[name="wb-html-mode"]'));
  if (importBtn) importBtn.addEventListener('click', importCanvas);
  modeRadios.forEach(r => r.addEventListener('change', (ev) => {
    element.dataset.mode = ev.target.value;
    loadFromTarget();
  }));

  // id-based merge implementation with snapshot/confirm
  // Persistence: backups stored in-memory AND optionally persisted to localStorage
  const STORAGE_KEY = 'wb-html-editor:backups';
  const DEFAULT_RETENTION = 20;

  function loadBackupsFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // basic shape check
      return parsed.map(p => ({ ts: p.ts || Date.now(), html: p.html || '' }));
    } catch (err) {
      return [];
    }
  }

  function saveBackupsToStorage(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, DEFAULT_RETENTION)));
    } catch (err) {
      // ignore quota errors
      console.warn('wb-html-editor: failed to persist backups', err);
    }
  }

  function pruneBackups(list, retention = DEFAULT_RETENTION) {
    if (list.length <= retention) return list;
    return list.slice(-retention);
  }

  function makeBackup(canvas) {
    window.__wb_html_editor_backups = window.__wb_html_editor_backups || loadBackupsFromStorage();
    window.__wb_html_editor_backups.push({ ts: Date.now(), html: canvas.innerHTML });
    window.__wb_html_editor_backups = pruneBackups(window.__wb_html_editor_backups, DEFAULT_RETENTION);
    saveBackupsToStorage(window.__wb_html_editor_backups);
    return window.__wb_html_editor_backups.length - 1;
  }

  function computeIdDiff(fragment, canvas) {
    const diff = { updated: [], inserted: [], orphaned: [] };
    const fragIds = Array.from(fragment.querySelectorAll('[id]')).map(n => n.id);
    const canvasIds = Array.from(canvas.querySelectorAll('[id]')).map(n => n.id);

    fragIds.forEach(id => {
      if (canvasIds.includes(id)) diff.updated.push(id);
      else diff.inserted.push(id);
    });

    canvasIds.forEach(id => {
      if (!fragIds.includes(id)) diff.orphaned.push(id);
    });
    return diff;
  }

  // Build node-level hunks for selective-apply modal. Each hunk contains enough info to apply selectively.
  function buildNodeHunks(fragment, canvas) {
    const hunks = [];
    // map fragment children to hunks (preserve fragmentIndex for inserted nodes)
    Array.from(fragment.children).forEach((node, fragmentIndex) => {
      const id = node.id || null;
      if (id) {
        const existing = canvas.querySelector('#' + CSS.escape(id));
        if (existing) {
          hunks.push({ type: 'updated', id, tag: node.tagName.toLowerCase(), existing: existing.outerHTML, updated: node.outerHTML, fragmentIndex });
        } else {
          hunks.push({ type: 'inserted', id, tag: node.tagName.toLowerCase(), updated: node.outerHTML, fragmentIndex });
        }
      } else {
        // anonymous node — treat as inserted (user can choose to insert)
        hunks.push({ type: 'inserted', id: null, tag: node.tagName.toLowerCase(), updated: node.outerHTML, fragmentIndex, selector: `:nth-child(${fragmentIndex})` });
      }
    });

    // detect orphaned (canvas-only) nodes
    Array.from(canvas.querySelectorAll('[id]')).forEach(n => {
      const id = n.id;
      if (!fragment.querySelector('#' + CSS.escape(id))) {
        hunks.push({ type: 'orphaned', id, tag: n.tagName.toLowerCase(), existing: n.outerHTML, removeIfSelected: false });
      }
    });

    return hunks;
  }

  // Simple LCS-based diff for lines -> produce hunks with added/removed/unchanged
  function diffLines(aStr, bStr) {
    const a = aStr.split('\n');
    const b = bStr.split('\n');
    const N = a.length, M = b.length;
    const dp = Array.from({length: N+1}, () => Array(M+1).fill(0));
    for (let i=N-1;i>=0;i--) for (let j=M-1;j>=0;j--) dp[i][j] = (a[i]===b[j])? dp[i+1][j+1]+1 : Math.max(dp[i+1][j], dp[i][j+1]);
    const hunks = [];
    let i=0,j=0;
    while (i<N || j<M) {
      if (i<N && j<M && a[i]===b[j]) {
        hunks.push({type:'=', line: a[i]}); i++; j++; continue;
      }
      if (j<M && (i===N || dp[i][j+1] >= dp[i+1][j])) {
        hunks.push({type:'+', line: b[j]}); j++; continue;
      }
      if (i<N && (j===M || dp[i][j+1] < dp[i+1][j])) {
        hunks.push({type:'-', line: a[i]}); i++; continue;
      }
    }
    return hunks;
  }

  function renderHunks(leftHtml, rightHtml) {
    // Compare by lines for visual diff
    const left = leftHtml.replace(/\r/g,'').split(/\n/).map(l => l.trimEnd()).join('\n');
    const right = rightHtml.replace(/\r/g,'').split(/\n/).map(l => l.trimEnd()).join('\n');
    const hunks = diffLines(left, right);
    const leftLines = [];
    const rightLines = [];
    hunks.forEach(h => {
      if (h.type === '=') { leftLines.push(`<div class="wb-diff-line">${escapeHtml(h.line)}</div>`); rightLines.push(`<div class="wb-diff-line">${escapeHtml(h.line)}</div>`); }
      else if (h.type === '+') { leftLines.push(`<div class="wb-diff-line wb-diff-line--added"> </div>`); rightLines.push(`<div class="wb-diff-line wb-diff-line--added">${escapeHtml(h.line)}</div>`); }
      else if (h.type === '-') { leftLines.push(`<div class="wb-diff-line wb-diff-line--removed">${escapeHtml(h.line)}</div>`); rightLines.push(`<div class="wb-diff-line wb-diff-line--removed"> </div>`); }
    });
    return { leftHtml: leftLines.join('\n'), rightHtml: rightLines.join('\n') };
  }

  // Backup history UI
  function listBackups() {
    return (window.__wb_html_editor_backups || []).map((b, idx) => ({ idx, ts: b.ts, snippet: (b.html || '').slice(0, 120) }));
  }

  function renderHistoryList() {
    const list = element.querySelector('.wb-html-editor__history-list');
    if (!list) return;

    // update retention display (safe: DEFAULT_RETENTION already initialized by this point)
    const retentionEls = element.querySelectorAll('.wb-html-editor__retention-count');
    retentionEls.forEach(el => el.textContent = String(DEFAULT_RETENTION));

    list.innerHTML = '';
    listBackups().forEach(item => {
      const el = document.createElement('div');
      el.className = 'wb-html-editor__history-item';
      el.setAttribute('data-idx', String(item.idx));
      el.title = new Date(item.ts).toLocaleString();
      el.innerHTML = `<span style="opacity:.85">${new Date(item.ts).toLocaleTimeString()}</span><span style="color:var(--text-secondary);font-size:0.8rem;">${item.snippet.replace(/\n/g,' ')}</span>`;
      el.addEventListener('click', () => showHistoryModal(item.idx));
      list.appendChild(el);
    });
  }

  function showHistoryModal(idx) {
    const backups = window.__wb_html_editor_backups || [];
    if (!backups[idx]) return;
    const canvas = document.getElementById('canvas');
    const current = canvas ? canvas.innerHTML : '';
    const target = backups[idx].html || '';
    const { leftHtml, rightHtml } = renderHunks(current, target);

    const backdrop = document.querySelector('.wb-html-editor__diff-backdrop') || document.createElement('div');
    backdrop.className = 'wb-html-editor__diff-backdrop';
    backdrop.innerHTML = `
      <div class="wb-html-editor__diff-modal" role="dialog" aria-modal="true">
        <h3 style="margin:0 0 .5rem 0;">Backup preview — ${new Date(backups[idx].ts).toLocaleString()}</h3>
        <div class="wb-html-editor__diff-rows">
          <div class="wb-html-editor__diff-column"><strong>Current</strong><pre>${leftHtml}</pre></div>
          <div class="wb-html-editor__diff-column"><strong>Backup</strong><pre>${rightHtml}</pre></div>
        </div>
        <div style="display:flex;gap:.5rem;margin-top:.6rem;justify-content:space-between;align-items:center;">
          <div style="color:var(--text-secondary);font-size:0.85rem;">Backup id: ${idx}</div>
          <div class="wb-html-editor__diff-actions">
            <button class="wb-html-editor__btn wb-html-editor__history-restore">Restore</button>
            <button class="wb-html-editor__btn wb-html-editor__history-delete">Delete</button>
            <button class="wb-html-editor__btn wb-html-editor__diff-cancel">Close</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
    backdrop.style.display = 'flex';

    backdrop.querySelector('.wb-html-editor__diff-cancel').addEventListener('click', () => { backdrop.style.display='none'; backdrop.remove(); });
    backdrop.querySelector('.wb-html-editor__history-delete').addEventListener('click', () => { window.__wb_html_editor_backups.splice(idx,1); renderHistoryList(); backdrop.style.display='none'; backdrop.remove(); if (window.updateStatus) window.updateStatus('Deleted backup'); });
    backdrop.querySelector('.wb-html-editor__history-restore').addEventListener('click', () => { canvas.innerHTML = backups[idx].html; backdrop.style.display='none'; backdrop.remove(); if (window.updateStatus) window.updateStatus('Restored backup'); });
  }

  // update history UI after making a backup
  const originalMakeBackup = makeBackup;
  makeBackup = (canvas) => {
    const i = originalMakeBackup(canvas);
    renderHistoryList();
    const undoBtn = element.querySelector('.wb-html-editor__undo-merge');
    if (undoBtn) undoBtn.disabled = !(window.__wb_html_editor_backups && window.__wb_html_editor_backups.length);
    // persist to storage handled inside makeBackup
    return i;
  };

  // clear history handler
  const clearBtn = element.querySelector('.wb-html-editor__clear-history');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    window.__wb_html_editor_backups = [];
    try { localStorage.removeItem(STORAGE_KEY); } catch (err) {}
    renderHistoryList();
    const undoBtn = element.querySelector('.wb-html-editor__undo-merge');
    if (undoBtn) undoBtn.disabled = true;
    if (window.updateStatus) window.updateStatus('Cleared backup history');
  });

  // expose history API
  element.listBackups = listBackups;
  element.showHistoryModal = showHistoryModal;
  element.restoreBackup = (idx) => { const b = window.__wb_html_editor_backups && window.__wb_html_editor_backups[idx]; if (!b) return false; document.getElementById('canvas').innerHTML = b.html; return true; };


  function mergeFragmentIntoCanvas(fragment, options = {}) {
    // options: { selectedHunkIndexes, nodeHunks }
    const canvas = document.getElementById('canvas');
    if (!canvas) return false;
    const edits = { updated: [], inserted: [] };

    const selectedIdx = (options.selectedHunkIndexes || []).map(Number);
    const nodeHunks = options.nodeHunks || null;

    // If nodeHunks provided, use it to guide selective application
    if (Array.isArray(nodeHunks) && selectedIdx.length) {
      selectedIdx.forEach(idx => {
        const h = nodeHunks[idx];
        if (!h) return;
        if (h.type === 'updated' && h.id) {
          const existing = canvas.querySelector('#' + CSS.escape(h.id));
          if (existing) {
            // apply update: set attrs and innerHTML from fragment's matching node
            const newNode = fragment.querySelector('#' + CSS.escape(h.id));
            if (!newNode) return;
            Array.from(existing.attributes).forEach(a => existing.removeAttribute(a.name));
            Array.from(newNode.attributes).forEach(a => existing.setAttribute(a.name, a.value));
            existing.innerHTML = newNode.innerHTML;
            edits.updated.push(h.id);
          }
        } else if (h.type === 'inserted') {
          const newNode = fragment.children[h.fragmentIndex] || fragment.querySelector(h.selector) || null;
          if (newNode) {
            canvas.appendChild(newNode.cloneNode(true));
            edits.inserted.push(newNode.id || newNode.tagName);
          }
        } else if (h.type === 'orphaned' && h.id && h.removeIfSelected) {
          const existing = canvas.querySelector('#' + CSS.escape(h.id));
          if (existing) { existing.remove(); }
        }
      });
      // done selective
      const undoBtn = element.querySelector('.wb-html-editor__undo-merge');
      if (undoBtn) undoBtn.disabled = !(window.__wb_html_editor_backups && window.__wb_html_editor_backups.length);
      return edits;
    }

    // Fallback: apply everything (legacy behavior)
    Array.from(fragment.children).forEach(node => {
      const id = node.id;
      if (id) {
        const existing = canvas.querySelector('#' + CSS.escape(id));
        if (existing) {
          Array.from(existing.attributes).forEach(a => existing.removeAttribute(a.name));
          Array.from(node.attributes).forEach(a => existing.setAttribute(a.name, a.value));
          existing.innerHTML = node.innerHTML;
          edits.updated.push(id);
          return;
        }
      }
      canvas.appendChild(node.cloneNode(true));
      edits.inserted.push(node.id || node.tagName);
    });

    const undoBtn = element.querySelector('.wb-html-editor__undo-merge');
    if (undoBtn) undoBtn.disabled = !(window.__wb_html_editor_backups && window.__wb_html_editor_backups.length);

    return edits;
  }

  async function importCanvas() {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;
    element.dataset.mode = 'canvas';
    const radio = element.querySelector('input[name="wb-html-mode"][value="canvas"]');
    if (radio) radio.checked = true;

    // load textarea with canvas for initial editing
    textarea.value = prettyHtml(canvas.outerHTML);
    attrsList.innerHTML = '';
    textarea.focus();
    if (liveCheckbox.checked) updateLivePreviewDebounced();
    if (window.updateStatus) window.updateStatus('Imported canvas HTML (edit then click Import to merge)');

    // parse user's edited HTML
    const frag = document.createElement('div');
    frag.innerHTML = textarea.value;

    // build node-level hunks (id-aware) and show modal with per-hunk controls
    const nodeHunks = buildNodeHunks(frag, canvas);

    const backdrop = document.querySelector('.wb-html-editor__diff-backdrop') || document.createElement('div');
    backdrop.className = 'wb-html-editor__diff-backdrop';

    // build modal content with per-hunk checkboxes
    const hunksHtml = nodeHunks.map((h, idx) => {
      const { leftHtml, rightHtml } = renderHunks(h.existing || '', h.updated);
      const title = h.type === 'updated' ? `Update: ${h.id || h.tag}` : (h.type === 'inserted' ? `Insert: ${h.id || h.tag}` : `Orphaned: ${h.id || h.tag}`);
      const checked = h.type === 'orphaned' ? 'checked' : 'checked';
      return `
        <section class="wb-html-editor__hunk" idx="${idx}" style="margin-bottom:.6rem;border-radius:6px;padding:.5rem;background:var(--bg-secondary);border:1px solid var(--border-color);">
          <label style="display:flex;align-items:center;gap:.5rem;">
            <input type="checkbox" class="wb-html-editor__hunk-checkbox" idx="${idx}" ${checked}>
            <strong style="font-size:0.95rem;">${escapeHtml(title)}</strong>
          </label>
          <div style="display:flex;gap:0.6rem;margin-top:.5rem;">
            <div class="wb-html-editor__diff-column" style="flex:1"><small style="color:var(--text-secondary)">Current</small><div style="margin-top:.4rem;">${leftHtml}</div></div>
            <div class="wb-html-editor__diff-column" style="flex:1"><small style="color:var(--text-secondary)">Edited</small><div style="margin-top:.4rem;">${rightHtml}</div></div>
          </div>
        </section>
      `;
    }).join('');

    backdrop.innerHTML = `
      <div class="wb-html-editor__diff-modal" role="dialog" aria-modal="true">
        <h3 style="margin:0 0 .5rem 0;">Canvas Merge — select hunks to apply</h3>
        <p style="color:var(--text-secondary); margin:0 0 0.75rem 0;">Review changes and pick which hunks to apply. Updated nodes will replace inner content/attrs. Inserted nodes without id can be added individually.</p>
        <div style="display:flex;gap:.5rem;align-items:center;margin-bottom:.5rem;">
          <label style="display:flex;gap:.4rem;align-items:center;"><input type="checkbox" id="wb-hunk-select-all" checked> Select all</label>
          <div style="flex:1"></div>
          <div style="color:var(--text-secondary);">Updated: ${nodeHunks.filter(h=>h.type==='updated').length} · Inserted: ${nodeHunks.filter(h=>h.type==='inserted').length}</div>
        </div>

        <div class="wb-html-editor__hunks-list">${hunksHtml}</div>

        <div class="wb-html-editor__diff-actions">
          <button class="wb-html-editor__btn wb-html-editor__diff-cancel">Cancel</button>
          <button class="wb-html-editor__btn wb-html-editor__diff-apply-selected">Apply selected</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    backdrop.style.display = 'flex';

    const applyBtn = backdrop.querySelector('.wb-html-editor__diff-apply-selected');
    const cancelBtn = backdrop.querySelector('.wb-html-editor__diff-cancel');
    const selectAll = backdrop.querySelector('#wb-hunk-select-all');

    selectAll.addEventListener('change', (ev) => {
      const checked = !!ev.target.checked;
      backdrop.querySelectorAll('.wb-html-editor__hunk-checkbox').forEach(cb => (cb.checked = checked));
    });

    const cleanup = () => { backdrop.style.display = 'none'; backdrop.remove(); };
    cancelBtn.addEventListener('click', () => { cleanup(); if (window.updateStatus) window.updateStatus('Merge canceled'); });

    applyBtn.addEventListener('click', () => {
      const selectedIdx = Array.from(backdrop.querySelectorAll('.wb-html-editor__hunk-checkbox'))
        .filter(i => i.checked)
        .map(i => Number(i.dataset.idx));

      // create backup and apply only selected hunks
      const backupIndex = makeBackup(canvas);
      const edits = mergeFragmentIntoCanvas(frag, { selectedHunkIndexes: selectedIdx, nodeHunks });
      cleanup();
      if (window.updateStatus) window.updateStatus(`Canvas merged — updated: ${edits.updated.length}, inserted: ${edits.inserted.length} (backup ${backupIndex})`);
      const undoBtn = element.querySelector('.wb-html-editor__undo-merge');
      if (undoBtn) undoBtn.disabled = false;
    });

    return nodeHunks;
  }

  // Undo last merge (restore backup)
  function undoLastMerge() {
    const b = window.__wb_html_editor_backups || [];
    if (!b.length) return false;
    const last = b.pop();
    const canvas = document.getElementById('canvas');
    if (!canvas) return false;
    canvas.innerHTML = last.html;
    if (window.updateStatus) window.updateStatus('Restored canvas from last backup');
    // disable undo if no backups left
    const undoBtn = element.querySelector('.wb-html-editor__undo-merge');
    if (undoBtn) undoBtn.disabled = !(window.__wb_html_editor_backups && window.__wb_html_editor_backups.length);
    return true;
  }

  const undoBtn = element.querySelector('.wb-html-editor__undo-merge');
  if (undoBtn) undoBtn.addEventListener('click', () => { undoLastMerge(); });

  // Public API: open for a specific target id/element
  element.openFor = async (idOrEl, options = {}) => {
    if (options.mode) element.dataset.mode = options.mode;
    if (options.enableCodeMirror !== false) {
      // attempt to auto-enable CodeMirror for a better editing experience
      try { await loadCodeMirror(); if (element._cmLoaded) textarea.style.display = 'none'; } catch (err) { /* ignore */ }
    }

    if (typeof idOrEl === 'string') {
      targetId = idOrEl;
      element.dataset.targetId = idOrEl;
    } else if (idOrEl instanceof HTMLElement) {
      targetId = idOrEl.id || null;
      if (targetId) element.dataset.targetId = targetId;
    } else if (!idOrEl && window.selectedComponent?.element) {
      // default to currently selected component in builder
      targetId = window.selectedComponent?.id || null;
      if (targetId) element.dataset.targetId = targetId;
    }
    loadFromTarget();
    renderHistoryList();
    textarea.focus();
  };

  // expose undo on the element
  element.undoLastMerge = undoLastMerge;

  // initialize
  loadFromTarget();
  renderHistoryList();

  // cleanup
  return () => {
    // teardown CM if present
    if (cmView && cmView.dom && cmView.dom.parentNode) cmView.dom.remove();
    element._cmLoaded = false;
  };
}
