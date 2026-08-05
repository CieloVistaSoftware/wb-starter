/**
 * Notes Behavior
 * -----------------------------------------------------------------------------
 * Slide-out notes drawer with multiple display modes.
 * Supports: left slide, right slide, modal
 * Features: server-persisted save (real file, not just localStorage), paste
 * an image directly into a note, pick/attach a reference to any element on
 * the page, searchable lookup of past notes, resize up to 50vw.
 *
 * Custom Tag: <wb-notes>
 * -----------------------------------------------------------------------------
 *
 * v3.0 Changes (this session):
 * - Saves go through /api/notes/append (server-side atomic read-modify-write)
 *   instead of a client-side fetch-then-overwrite -- the old path raced under
 *   concurrent writers, the same lost-update class of bug #382 found in the
 *   old error-logger.
 * - "New" (footer) replaces the old destructive "Clear": saves the outgoing
 *   note first, then starts fresh -- nothing is discarded.
 * - "Lookup" (toolbar) replaces "View": a searchable list of past notes
 *   (by content or page), not a raw JSON dump; clicking a result loads it
 *   back into the textarea.
 * - "Pick" (toolbar): click any element on the page to attach a short
 *   description (selector/tag/text) to the note.
 * - Paste an image (e.g. a screenshot of an error) directly into the
 *   textarea -- uploaded as a real file via /api/save-image, referenced by
 *   path in the note text.
 * - Close button pinned to the header's own top-right corner; position/pick/
 *   lookup controls moved to a toolbar below the header.
 * - No dedicated Copy button (still available as the wbNotes.copy() API).
 */

const NOTES_STORAGE_KEY = 'wb-notes';
const NOTES_FILE_PATH = '/data/notes.json';

export function notes(element, options = {}) {
  // Plain attributes are canonical (Law 11); data-* accepted for back-compat only.
  const config = {
    position: options.position || element.getAttribute('position') || element.dataset.position || 'left',
    maxWidth: options.maxWidth || element.getAttribute('max-width') || element.dataset.maxWidth || '50vw',
    minWidth: options.minWidth || element.getAttribute('min-width') || element.dataset.minWidth || '200px',
    defaultWidth: options.defaultWidth || element.getAttribute('default-width') || element.dataset.defaultWidth || '320px',
    autoSave: options.autoSave ?? (element.getAttribute('auto-save') !== 'false' && element.dataset.autoSave !== 'false'),
    savePath: options.savePath || element.getAttribute('save-path') || element.dataset.savePath || NOTES_FILE_PATH,
    placeholder: options.placeholder || element.getAttribute('placeholder') || element.dataset.placeholder || 'Add your notes here...',
    restoreState: false,
    ...options
  };

  // State
  let isOpen = false;
  let isResizing = false;
  let isDragging = false;
  let isPicking = false;
  let currentPosition = config.position;
  let notesContent = '';
  let lastPickedElement = null; // { selector, tag, text } of the last picked element, attached to the next save

  // Modal drag/resize state
  let modalPos = { x: 0, y: 0 };
  let modalSize = { width: 500, height: 400 };
  let dragStart = { x: 0, y: 0 };
  let resizeStart = { x: 0, y: 0, width: 0, height: 0 };

  // #448: no bare 'wb-notes' token -- notes.css/site.css select the
  // `wb-notes` TAG directly now, so it just duplicated the tag name.
  element.classList.add(`wb-notes--${config.position}`);
  element.style.setProperty('--notes-max-width', config.maxWidth);
  element.style.setProperty('--notes-min-width', config.minWidth);
  element.style.width = config.defaultWidth;

  // Header holds ONLY the title + a corner close button (close pinned to the
  // header's own top-right corner) -- the position/pick/lookup controls live
  // in their own toolbar below the header so the close button isn't
  // competing with a button row for the corner.
  element.innerHTML = `
    <div class="wb-notes__backdrop"></div>
    <div class="wb-notes__drawer">
      <div class="wb-notes__resize-handle" title="Drag to resize (max 50vw)"></div>
      <div class="wb-notes__resize-handle-modal" title="Drag to resize"></div>
      <header class="wb-notes__header">
        <span class="wb-notes__title">📝 Notes</span>
        <button class="wb-notes__close-corner" data-action="close" title="Close">✕</button>
      </header>
      <div class="wb-notes__actions">
        <div class="wb-notes__btn-row">
          <button class="wb-notes__wide-btn" data-action="collapse-left" title="Collapse Left">«</button>
          <button class="wb-notes__wide-btn" data-pos="left" title="Dock Left">Left</button>
          <button class="wb-notes__wide-btn" data-pos="modal" title="Float Modal">Modal</button>
          <button class="wb-notes__wide-btn" data-pos="right" title="Dock Right">Right</button>
          <button class="wb-notes__wide-btn" data-action="collapse-right" title="Collapse Right">»</button>
        </div>
        <div class="wb-notes__btn-row">
          <button class="wb-notes__wide-btn" data-action="pick" title="Pick an element on the page to attach to this note">🎯 Pick</button>
          <button class="wb-notes__wide-btn" data-action="view" title="Look up saved notes">🔍 Lookup</button>
        </div>
      </div>
      <textarea class="wb-notes__textarea" placeholder="${config.placeholder}"></textarea>
      <footer class="wb-notes__footer">
        <div class="wb-notes__btn-row">
          <button class="wb-notes__wide-btn wb-notes__wide-btn--save" data-action="save" title="Save to File">💾 Save</button>
          <button class="wb-notes__wide-btn wb-notes__wide-btn--new" data-action="new" title="Save this note and start a new one">➕ New</button>
        </div>
        <span class="wb-notes__status"></span>
      </footer>
    </div>
  `;

  // Get elements
  const backdrop = element.querySelector('.wb-notes__backdrop');
  const drawer = element.querySelector('.wb-notes__drawer');
  const header = element.querySelector('.wb-notes__header');
  const textarea = element.querySelector('.wb-notes__textarea');
  const resizeHandle = element.querySelector('.wb-notes__resize-handle');
  const resizeHandleModal = element.querySelector('.wb-notes__resize-handle-modal');
  const statusEl = element.querySelector('.wb-notes__status');

  // Load saved notes (local draft only -- the file-backed history lives on
  // the server, fetched on demand by Lookup, not preloaded here).
  const loadNotes = async () => {
    try {
      const local = localStorage.getItem(NOTES_STORAGE_KEY);
      if (local) {
        const loadedData = JSON.parse(local);
        notesContent = loadedData.content || '';
        textarea.value = notesContent;

        if (config.restoreState) {
          if (loadedData.position) setPosition(loadedData.position);
          if (loadedData.width) drawer.style.width = loadedData.width;
          if (loadedData.modalPos) modalPos = loadedData.modalPos;
          if (loadedData.modalSize) modalSize = loadedData.modalSize;
          if (loadedData.isOpen) open();
        }
      }
    } catch (e) {
      console.warn('Failed to load notes:', e);
    }
  };

  // Save notes to localStorage (the live draft -- fast, offline-safe, not
  // the same thing as saveToFile()'s server-persisted history entry).
  const saveToLocal = () => {
    try {
      notesContent = textarea.value;
      const saveData = {
        content: notesContent,
        position: currentPosition,
        width: drawer.style.width,
        modalPos: modalPos,
        modalSize: modalSize,
        isOpen: isOpen,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(saveData));
    } catch (e) {
      console.warn('Failed to save notes:', e);
    }
  };

  // Save the current note to the real file on disk via the server's atomic
  // /api/notes/append endpoint. A client-side fetch-then-overwrite (the
  // previous approach) raced under concurrent writers -- the same
  // lost-update class of bug #382 found in the old error-logger -- so the
  // read-modify-write now happens server-side, synchronously, per request.
  const saveToFile = async () => {
    const fileContent = textarea.value.trim();

    if (!fileContent) {
      showStatus('No notes to save', 'warning');
      return;
    }

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const newNote = {
        id: 'note-' + Date.now(),
        page: urlParams.get('page') || null,
        content: fileContent,
        selectedElement: lastPickedElement,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const res = await fetch('/api/notes/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote })
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const result = await res.json();

      if (result.duplicate) {
        showStatus('Note already exists (duplicate prevented)', 'warning');
        return;
      }

      lastPickedElement = null;
      showStatus('Saved to ' + config.savePath, 'success');

      element.dispatchEvent(new CustomEvent('wb:notes:save', {
        bubbles: true,
        detail: { path: config.savePath, notes: result.notes, newNote }
      }));
    } catch (e) {
      showStatus('Failed to save: ' + e.message, 'error');
    }
  };

  // Show status message
  const showStatus = (msg, type = 'info') => {
    statusEl.textContent = msg;
    statusEl.className = 'wb-notes__status wb-notes__status--' + type;
    setTimeout(() => {
      statusEl.textContent = '';
      statusEl.className = 'wb-notes__status';
    }, 3000);
  };

  // Apply modal position and size
  const applyModalTransform = () => {
    if (currentPosition === 'modal') {
      drawer.style.left = `calc(50% + ${modalPos.x}px)`;
      drawer.style.top = `calc(50% + ${modalPos.y}px)`;
      drawer.style.width = modalSize.width + 'px';
      drawer.style.height = modalSize.height + 'px';
    }
  };

  // Current page/URL + timestamp, as the one line every note opens with.
  const buildHeaderLine = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pageName = urlParams.get('page');
    const locationStr = pageName
      ? `Page: ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}`
      : window.location.href;
    return `[${new Date().toLocaleString()}] ${locationStr}`;
  };

  // Open/close
  const open = () => {
    isOpen = true;

    const logLine = buildHeaderLine();

    // Manage header line (ensure only one, update if needed)
    const headerRegex = /^\s*\[.*?\] (http|Page:)[^\n]*(\n|$)/;

    if (headerRegex.test(textarea.value)) {
      textarea.value = textarea.value.replace(headerRegex, logLine + '\n');
    } else {
      textarea.value = logLine + '\n' + textarea.value;
    }

    element.classList.add('wb-notes--open');
    if (currentPosition === 'modal') {
      backdrop.classList.add('visible');
      applyModalTransform();
    }
    saveToLocal();
    element.dispatchEvent(new CustomEvent('wb:notes:open', { bubbles: true }));
  };

  const close = () => {
    isOpen = false;
    element.classList.remove('wb-notes--open');
    backdrop.classList.remove('visible');
    saveToLocal();
    element.dispatchEvent(new CustomEvent('wb:notes:close', { bubbles: true }));
  };

  const toggle = () => isOpen ? close() : open();

  // Set position
  const setPosition = (pos) => {
    element.classList.remove(`wb-notes--${currentPosition}`);
    currentPosition = pos;
    element.classList.add(`wb-notes--${pos}`);

    element.querySelectorAll('.wb-notes__wide-btn[data-pos]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.pos === pos);
    });

    if (pos === 'modal') {
      if (isOpen) backdrop.classList.add('visible');
      applyModalTransform();
    } else {
      backdrop.classList.remove('visible');
      drawer.style.left = '';
      drawer.style.top = '';
      drawer.style.height = '';
    }

    saveToLocal();
    element.dispatchEvent(new CustomEvent('wb:notes:position', {
      bubbles: true,
      detail: { position: pos }
    }));
  };

  // Collapse to a side
  const collapseToSide = (side) => {
    setPosition(side);
    close();
    showStatus(`Collapsed to ${side}`, 'info');
  };

  // Build a short, human-readable description for a picked element -- not
  // guaranteed unique, just enough context (tag, id, first couple of
  // classes, its own text) to find it again while reading the note later.
  const describeElement = (el) => {
    let selector = el.tagName.toLowerCase();
    if (el.id) selector += `#${el.id}`;
    const classes = [...el.classList].filter(c => !c.startsWith('wb-notes'));
    if (classes.length) selector += `.${classes.slice(0, 2).join('.')}`;
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    return { selector, tag: el.tagName.toLowerCase(), text };
  };

  let pickerHighlight = null;
  const onPickerMouseOver = (e) => {
    if (pickerHighlight) pickerHighlight.style.outline = '';
    pickerHighlight = e.target;
    pickerHighlight.style.outline = '2px solid var(--primary, #6366f1)';
  };
  const onPickerClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    stopPicking();
    const info = describeElement(e.target);
    lastPickedElement = info;
    const line = `[Element] ${info.tag}${info.selector.slice(info.tag.length)} -- "${info.text}"`;
    textarea.value = textarea.value.trim() ? `${textarea.value}\n${line}` : line;
    saveToLocal();
    showStatus('Element picked -- will attach to next Save', 'success');
  };
  const stopPicking = () => {
    if (!isPicking) return;
    isPicking = false;
    if (pickerHighlight) { pickerHighlight.style.outline = ''; pickerHighlight = null; }
    document.removeEventListener('mouseover', onPickerMouseOver, true);
    document.removeEventListener('click', onPickerClick, true);
    document.body.style.cursor = '';
    element.querySelector('[data-action="pick"]')?.classList.remove('active');
  };
  const startPicking = () => {
    if (isPicking) { stopPicking(); return; }
    isPicking = true;
    document.addEventListener('mouseover', onPickerMouseOver, true);
    document.addEventListener('click', onPickerClick, true);
    document.body.style.cursor = 'crosshair';
    element.querySelector('[data-action="pick"]')?.classList.add('active');
    showStatus('Click any element on the page to pick it...', 'info');
  };

  // Copy to clipboard -- no dedicated UI button (John: "probably do not need
  // the copy button"), stays available as the wbNotes.copy() API method
  // (declared in notes.schema.json's $methods).
  const copyToClipboard = async () => {
    const text = textarea.value;
    if (!text.trim()) {
      showStatus('No notes to copy', 'warning');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showStatus('Copied!', 'success');
    } catch (e) {
      showStatus('Copy failed', 'error');
    }
  };

  // Look up saved notes -- reads the real file (fresh, reflects other
  // pages/sessions too). Searchable by content/page; clicking a result
  // loads it back into the textarea instead of dumping raw JSON.
  const viewSavedNotes = async () => {
    let savedData = { notes: [] };
    try {
      const res = await fetch(config.savePath, { cache: 'no-store' });
      if (res.ok) savedData = await res.json();
    } catch (e) {
      const raw = localStorage.getItem(NOTES_STORAGE_KEY + '-file');
      savedData = raw ? JSON.parse(raw) : { notes: [] };
    }
    const allNotes = [...(savedData.notes || [])].reverse(); // newest first

    const viewer = document.createElement('div');
    viewer.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;padding:2rem;';

    const viewerContent = document.createElement('div');
    viewerContent.style.cssText = 'background:var(--bg-secondary,#1f2937);width:100%;max-width:800px;max-height:80vh;border-radius:8px;display:flex;flex-direction:column;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);border:1px solid var(--border-color,#374151);';

    const viewerHeader = document.createElement('div');
    viewerHeader.style.cssText = 'padding:1rem;border-bottom:1px solid var(--border-color,#374151);display:flex;flex-direction:column;gap:0.5rem;background:var(--bg-tertiary,#111827);border-radius:8px 8px 0 0;';
    viewerHeader.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h3 style="margin:0;color:var(--text-primary,#f9fafb);">Saved Notes (${allNotes.length})</h3>
        <button class="wb-notes__lookup-close" style="background:none;border:none;color:var(--text-secondary,#9ca3af);cursor:pointer;font-size:1.5rem;line-height:1;">×</button>
      </div>
      <input type="search" class="wb-notes__lookup-search" placeholder="Search notes by content or page..." style="width:100%;padding:0.5rem 0.75rem;border-radius:6px;border:1px solid var(--border-color,#374151);background:var(--bg-primary,#0f172a);color:var(--text-primary,#f9fafb);font-size:0.875rem;">
    `;

    const body = document.createElement('div');
    body.style.cssText = 'padding:0.5rem;overflow:auto;flex:1;background:var(--bg-code,#1e1e1e);';

    const renderList = (filterTerm) => {
      body.innerHTML = '';
      const term = (filterTerm || '').toLowerCase();
      const matches = allNotes.filter(n =>
        !term || n.content.toLowerCase().includes(term) || (n.page || '').toLowerCase().includes(term)
      );
      if (!matches.length) {
        body.innerHTML = '<p style="color:var(--text-secondary,#9ca3af);padding:1rem;text-align:center;">No matching notes.</p>';
        return;
      }
      matches.forEach(note => {
        const item = document.createElement('button');
        item.type = 'button';
        item.style.cssText = 'display:block;width:100%;text-align:left;background:var(--bg-secondary,#1f2937);border:1px solid var(--border-color,#374151);border-radius:6px;padding:0.6rem 0.75rem;margin-bottom:0.4rem;cursor:pointer;color:var(--text-primary,#f9fafb);font-family:inherit;';
        const preview = note.content.replace(/\s+/g, ' ').trim().slice(0, 100);
        const meta = [note.page ? `page: ${note.page}` : null, new Date(note.createdAt).toLocaleString()].filter(Boolean).join(' · ');
        item.innerHTML = `<div style="font-size:0.7rem;color:var(--text-secondary,#9ca3af);margin-bottom:0.25rem;">${meta}</div><div style="font-size:0.85rem;">${preview}${note.content.length > 100 ? '…' : ''}</div>`;
        item.onclick = () => {
          textarea.value = note.content;
          notesContent = note.content;
          saveToLocal();
          showStatus('Loaded note into editor', 'info');
          viewer.remove();
        };
        body.appendChild(item);
      });
    };
    renderList('');

    viewerContent.appendChild(viewerHeader);
    viewerContent.appendChild(body);
    viewer.appendChild(viewerContent);

    const searchInput = viewerHeader.querySelector('.wb-notes__lookup-search');
    searchInput.addEventListener('input', () => renderList(searchInput.value));

    const closeViewer = () => viewer.remove();
    viewerHeader.querySelector('.wb-notes__lookup-close').onclick = closeViewer;
    viewer.onclick = (e) => { if (e.target === viewer) closeViewer(); };

    document.body.appendChild(viewer);
    searchInput.focus();
  };

  // Save the current note (if any) and start a fresh one -- replaces the old
  // destructive "Clear". Nothing is lost: the outgoing content is saved to
  // file first.
  const startNewNote = async () => {
    const hadContent = !!textarea.value.trim();
    if (hadContent) {
      await saveToFile();
    }
    textarea.value = buildHeaderLine() + '\n';
    notesContent = textarea.value;
    saveToLocal();
    // One combined message, not two in a row -- saveToFile()'s own "Saved"
    // status would otherwise be silently overwritten by this one before
    // anyone (a real user, or a test's own assertion) could ever see it.
    showStatus(hadContent ? 'Saved, started a new note' : 'Started a new note', 'info');
  };

  // RESIZE - Left/Right drawers
  let startX, startWidth;

  const onResizeMove = (e) => {
    if (!isResizing) return;
    let newWidth;
    if (currentPosition === 'right') {
      newWidth = startWidth + (startX - e.clientX);
    } else {
      newWidth = startWidth + (e.clientX - startX);
    }
    const maxPx = window.innerWidth * 0.5;
    const minPx = parseInt(config.minWidth);
    newWidth = Math.max(minPx, Math.min(maxPx, newWidth));
    drawer.style.width = newWidth + 'px';
  };

  const onResizeEnd = () => {
    isResizing = false;
    resizeHandle.classList.remove('dragging');
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);
    saveToLocal();
  };

  const onResizeStart = (e) => {
    if (currentPosition === 'modal') return;
    isResizing = true;
    startX = e.clientX;
    startWidth = drawer.offsetWidth;
    resizeHandle.classList.add('dragging');
    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeEnd);
    e.preventDefault();
  };

  // MODAL DRAG
  const onDragMove = (e) => {
    if (!isDragging || currentPosition !== 'modal') return;
    modalPos.x += e.clientX - dragStart.x;
    modalPos.y += e.clientY - dragStart.y;
    dragStart.x = e.clientX;
    dragStart.y = e.clientY;
    applyModalTransform();
  };

  const onDragEnd = () => {
    isDragging = false;
    header.classList.remove('dragging');
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    saveToLocal();
  };

  const onDragStart = (e) => {
    if (e.target.closest('button') || currentPosition !== 'modal') return;
    isDragging = true;
    dragStart.x = e.clientX;
    dragStart.y = e.clientY;
    header.classList.add('dragging');
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    e.preventDefault();
  };

  // MODAL RESIZE
  const onModalResizeMove = (e) => {
    if (!isResizing || currentPosition !== 'modal') return;
    modalSize.width = Math.max(300, resizeStart.width + (e.clientX - resizeStart.x));
    modalSize.height = Math.max(200, resizeStart.height + (e.clientY - resizeStart.y));
    applyModalTransform();
  };

  const onModalResizeEnd = () => {
    isResizing = false;
    resizeHandleModal.classList.remove('dragging');
    document.removeEventListener('mousemove', onModalResizeMove);
    document.removeEventListener('mouseup', onModalResizeEnd);
    saveToLocal();
  };

  const onModalResizeStart = (e) => {
    if (currentPosition !== 'modal') return;
    isResizing = true;
    resizeStart.x = e.clientX;
    resizeStart.y = e.clientY;
    resizeStart.width = modalSize.width;
    resizeStart.height = modalSize.height;
    resizeHandleModal.classList.add('dragging');
    document.addEventListener('mousemove', onModalResizeMove);
    document.addEventListener('mouseup', onModalResizeEnd);
    e.preventDefault();
  };

  // Event listeners
  resizeHandle.addEventListener('mousedown', onResizeStart);
  resizeHandleModal.addEventListener('mousedown', onModalResizeStart);
  header.addEventListener('mousedown', onDragStart);
  backdrop.addEventListener('click', close);

  // Button click handler (delegated)
  element.addEventListener('click', (e) => {
    const btn = e.target.closest('.wb-notes__wide-btn, .wb-notes__close-corner');
    if (!btn) return;

    const action = btn.dataset.action;
    const pos = btn.dataset.pos;

    if (action === 'collapse-left') collapseToSide('left');
    else if (action === 'collapse-right') collapseToSide('right');
    else if (action === 'pick') startPicking();
    else if (action === 'view') viewSavedNotes();
    else if (action === 'save') saveToFile();
    else if (action === 'new') startNewNote();
    else if (action === 'close') close();
    else if (pos) setPosition(pos);
  });

  // Auto-save on input
  let saveTimeout;
  textarea.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveToLocal, 500);
  });

  // Paste an image (a screenshot of an error, a UI bug, ...) directly into
  // the note. A bare <textarea> can't hold images -- upload it as a real
  // file via /api/save-image (binary-safe, unlike the generic /api/save
  // which always writes utf8) and insert a reference to where it landed, so
  // the note stays a normal saveable text blob and the image is a real,
  // directly-viewable file on disk.
  textarea.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageItem = [...items].find((item) => item.type.startsWith('image/'));
    if (!imageItem) return; // not an image -- let normal text paste proceed

    e.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      const ext = (imageItem.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
      const location = `data/note-images/note-image-${Date.now()}.${ext}`;
      showStatus('Uploading pasted image...', 'info');
      try {
        const res = await fetch('/api/save-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location, dataUrl })
        });
        if (!res.ok) throw new Error(`Server responded ${res.status}`);

        const marker = `[Image: ${location}]`;
        const start = textarea.selectionStart ?? textarea.value.length;
        const end = textarea.selectionEnd ?? textarea.value.length;
        textarea.value = textarea.value.slice(0, start) + marker + textarea.value.slice(end);
        textarea.selectionStart = textarea.selectionEnd = start + marker.length;
        notesContent = textarea.value;
        saveToLocal();

        showStatus('Image pasted and saved', 'success');
      } catch (err) {
        showStatus('Image paste failed: ' + err.message, 'error');
      }
    };
    reader.readAsDataURL(file);
  });

  // Handle Enter key to save
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveToFile();
    }
  });

  // Keyboard shortcuts (on element)
  element.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveToFile();
    }
  });

  // Global Escape key handler (must work even when notes doesn't have focus)
  const handleGlobalKeydown = (e) => {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      close();
    }
  };
  document.addEventListener('keydown', handleGlobalKeydown);

  // Public API
  element.wbNotes = {
    open, close, toggle, setPosition, collapseToSide,
    save: saveToFile, copy: copyToClipboard, newNote: startNewNote, lookup: viewSavedNotes,
    get content() { return textarea.value; },
    set content(val) { textarea.value = val; saveToLocal(); },
    get isOpen() { return isOpen; },
    get position() { return currentPosition; }
  };

  // Initialize
  loadNotes();

  // Set initial active state for buttons
  element.querySelectorAll(`.wb-notes__wide-btn[data-pos="${currentPosition}"]`).forEach(btn => {
    btn.classList.add('active');
  });

  // Cleanup
  return () => {
    stopPicking();
    element.classList.remove(`wb-notes--${currentPosition}`, 'wb-notes--open');
    resizeHandle.removeEventListener('mousedown', onResizeStart);
    resizeHandleModal.removeEventListener('mousedown', onModalResizeStart);
    header.removeEventListener('mousedown', onDragStart);
    document.removeEventListener('keydown', handleGlobalKeydown);
    delete element.wbNotes;
  };
}

export default notes;
