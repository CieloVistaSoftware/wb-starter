/**
 * Notes Behavior
 * -----------------------------------------------------------------------------
 * Slide-out notes drawer with multiple display modes.
 * Supports: left slide, right slide, modal
 * Features: Auto-save to JSON, copy, clear, resize up to 50vw
 * 
 * Custom Tag: <wb-notes>
 * -----------------------------------------------------------------------------
 * 
 * v2.0 Changes:
 * - Double arrows (« ») to collapse to either side
 * - Clear button moved to footer (avoid accidental clicks)
 * - Wide compact buttons to fit more in same space
 * - Save to JSON with duplicate content prevention
 */

const NOTES_STORAGE_KEY = 'wb-notes';
const NOTES_FILE_PATH = '/data/notes.json';

export function notes(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    position: options.position || element.dataset.position || 'left',
    maxWidth: options.maxWidth || element.dataset.maxWidth || '50vw',
    minWidth: options.minWidth || element.dataset.minWidth || '200px',
    defaultWidth: options.defaultWidth || element.dataset.defaultWidth || '320px',
    autoSave: options.autoSave ?? (element.dataset.autoSave !== 'false'),
    savePath: options.savePath || element.dataset.savePath || NOTES_FILE_PATH,
    placeholder: options.placeholder || element.dataset.placeholder || 'Add your notes here...',
    restoreState: false, // options.restoreState ?? (element.dataset.restoreState !== 'false'),
    ...options
  };

  console.log('[Notes] Init config.position:', config.position);

  // State
  let isOpen = false;
  let isResizing = false;
  let isDragging = false;
  let currentPosition = config.position;
  let notesContent = '';

  // Modal drag/resize state
  let modalPos = { x: 0, y: 0 };
  let modalSize = { width: 500, height: 400 };
  let dragStart = { x: 0, y: 0 };
  let resizeStart = { x: 0, y: 0, width: 0, height: 0 };

  // Add classes
  element.classList.add('wb-notes', `wb-notes--${config.position}`);
  element.style.setProperty('--notes-max-width', config.maxWidth);
  element.style.setProperty('--notes-min-width', config.minWidth);
  element.style.width = config.defaultWidth;

  // Build structure - Wide compact buttons, collapse arrows, clear at bottom
  element.innerHTML = `
    <div class="wb-notes__backdrop"></div>
    <div class="wb-notes__drawer">
      <div class="wb-notes__resize-handle" title="Drag to resize (max 50vw)"></div>
      <div class="wb-notes__resize-handle-modal" title="Drag to resize"></div>
      <header class="wb-notes__header">
        <span class="wb-notes__title">📝 Notes</span>
        <div class="wb-notes__actions">
          <div class="wb-notes__btn-row">
            <button class="wb-notes__wide-btn" data-action="collapse-left" title="Collapse Left">«</button>
            <button class="wb-notes__wide-btn" data-pos="left" title="Dock Left">Left</button>
            <button class="wb-notes__wide-btn" data-pos="modal" title="Float Modal">Modal</button>
            <button class="wb-notes__wide-btn" data-pos="right" title="Dock Right">Right</button>
            <button class="wb-notes__wide-btn" data-action="collapse-right" title="Collapse Right">»</button>
          </div>
          <div class="wb-notes__btn-row">
            <button class="wb-notes__wide-btn" data-action="copy" title="Copy to Clipboard">📋 Copy</button>
            <button class="wb-notes__wide-btn" data-action="save" title="Save to File">💾 Save</button>
            <button class="wb-notes__wide-btn" data-action="close" title="Close">✕</button>
          </div>
        </div>
      </header>
      <textarea class="wb-notes__textarea" placeholder="${config.placeholder}"></textarea>
      <footer class="wb-notes__footer">
        <span class="wb-notes__status"></span>
        <button class="wb-notes__wide-btn wb-notes__wide-btn--clear" data-action="clear" title="Clear all notes">🗑️ Clear</button>
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

  // Load saved notes
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

  // Save notes to localStorage
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

  // Normalize content for duplicate checking
  const normalizeContent = (str) => {
    return str.trim().replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
  };

  // Check for duplicate content
  const isDuplicateContent = (existingNotes, newContent) => {
    const normalized = normalizeContent(newContent);
    return existingNotes.some(note => normalizeContent(note.content) === normalized);
  };

  // Save to JSON file with duplicate prevention
  const saveToFile = async () => {
    const fileContent = textarea.value.trim();
    
    if (!fileContent) {
      showStatus('No notes to save', 'warning');
      return;
    }

    try {
      let existingData = { notes: [], lastUpdated: null };
      const existingRaw = localStorage.getItem(NOTES_STORAGE_KEY + '-file');
      if (existingRaw) {
        try {
          existingData = JSON.parse(existingRaw);
        } catch (e) {
          existingData = { notes: [], lastUpdated: null };
        }
      }

      // Check for duplicates
      if (isDuplicateContent(existingData.notes, fileContent)) {
        showStatus('Note already exists (duplicate prevented)', 'warning');
        return;
      }

      // Add new note
      const newNote = {
        id: 'note-' + Date.now(),
        content: fileContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      existingData.notes.push(newNote);
      existingData.lastUpdated = new Date().toISOString();

      localStorage.setItem(NOTES_STORAGE_KEY + '-file', JSON.stringify(existingData, null, 2));
      
      showStatus('Saved', 'success');
      
      element.dispatchEvent(new CustomEvent('wb:notes:save', {
        bubbles: true,
        detail: { path: config.savePath, data: existingData, newNote }
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

  // Open/close
  const open = () => {
    console.log('[Notes] Opening...');
    isOpen = true;
    
    // Current URL and Timestamp
    const urlParams = new URLSearchParams(window.location.search);
    const pageName = urlParams.get('page');
    const locationStr = pageName 
      ? `Page: ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}` 
      : window.location.href;

    const timestamp = new Date().toLocaleString();
    const logLine = `[${timestamp}] ${locationStr}`;
    
    // Manage header line (ensure only one, update if needed)
    // Regex matches a timestamp line at the start, optionally preceded by whitespace
    const headerRegex = /^\s*\[.*?\] (http|Page:)[^\n]*(\n|$)/;
    
    if (headerRegex.test(textarea.value)) {
      // Replace existing header
      textarea.value = textarea.value.replace(headerRegex, logLine + '\n');
    } else {
      // Prepend new header
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
    console.log('[Notes] Setting position:', pos);
    element.classList.remove(`wb-notes--${currentPosition}`);
    currentPosition = pos;
    element.classList.add(`wb-notes--${pos}`);
    
    // Update active state on position buttons
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

  // Copy to clipboard
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

  // View saved notes
  const viewSavedNotes = () => {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY + '-file');
    const savedData = raw ? JSON.parse(raw) : { notes: [] };
    
    // Create modal overlay
    const viewer = document.createElement('div');
    viewer.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;padding:2rem;';
    
    const viewerContent = document.createElement('div');
    viewerContent.style.cssText = 'background:var(--bg-secondary,#1f2937);width:100%;max-width:800px;max-height:80vh;border-radius:8px;display:flex;flex-direction:column;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);border:1px solid var(--border-color,#374151);';
    
    const viewerHeader = document.createElement('div');
    viewerHeader.style.cssText = 'padding:1rem;border-bottom:1px solid var(--border-color,#374151);display:flex;justify-content:space-between;align-items:center;background:var(--bg-tertiary,#111827);border-radius:8px 8px 0 0;';
    viewerHeader.innerHTML = '<h3 style="margin:0;color:var(--text-primary,#f9fafb);">Saved Notes</h3><button style="background:none;border:none;color:var(--text-secondary,#9ca3af);cursor:pointer;font-size:1.5rem;line-height:1;">×</button>';
    
    const body = document.createElement('div');
    body.style.cssText = 'padding:1rem;overflow:auto;flex:1;background:var(--bg-code,#1e1e1e);';
    
    const pre = document.createElement('pre');
    pre.style.cssText = 'margin:0;white-space:pre-wrap;font-family:monospace;color:var(--text-primary,#f9fafb);font-size:0.875rem;';
    pre.textContent = JSON.stringify(savedData, null, 2);
    
    body.appendChild(pre);
    viewerContent.appendChild(viewerHeader);
    viewerContent.appendChild(body);
    viewer.appendChild(viewerContent);
    
    // Close handlers
    const closeViewer = () => viewer.remove();
    viewerHeader.querySelector('button').onclick = closeViewer;
    viewer.onclick = (e) => { if(e.target === viewer) closeViewer(); };
    
    document.body.appendChild(viewer);
  };

  // Clear notes
  let clearConfirmTimeout;
  const clearNotes = (btn) => {
    if (!textarea.value.trim()) return;

    // If button is passed and not in confirm mode, enter confirm mode
    if (btn && !btn.dataset.confirm) {
      btn.dataset.confirm = 'true';
      const originalText = btn.innerHTML;
      btn.innerHTML = '⚠️ Confirm?';
      btn.classList.add('wb-notes__wide-btn--confirm');
      
      clearConfirmTimeout = setTimeout(() => {
        btn.dataset.confirm = '';
        btn.innerHTML = originalText;
        btn.classList.remove('wb-notes__wide-btn--confirm');
      }, 5000);
      return;
    }

    // Execute clear
    if (clearConfirmTimeout) clearTimeout(clearConfirmTimeout);
    if (btn) {
      btn.dataset.confirm = '';
      btn.innerHTML = '🗑️ Clear'; // Reset to default text
      btn.classList.remove('wb-notes__wide-btn--confirm');
    }

    // Reset to just the current timestamp/URL
    const urlParams = new URLSearchParams(window.location.search);
    const pageName = urlParams.get('page');
    const locationStr = pageName 
      ? `Page: ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}` 
      : window.location.href;
      
    const timestamp = new Date().toLocaleString();
    textarea.value = `[${timestamp}] ${locationStr}\n`;
    
    notesContent = textarea.value;
    saveToLocal();
    showStatus('Notes cleared', 'info');
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
    const btn = e.target.closest('.wb-notes__wide-btn');
    if (!btn) return;

    const action = btn.dataset.action;
    const pos = btn.dataset.pos;

    if (action === 'collapse-left') collapseToSide('left');
    else if (action === 'collapse-right') collapseToSide('right');
    else if (action === 'copy') copyToClipboard();
    else if (action === 'view') viewSavedNotes();
    else if (action === 'save') saveToFile();
    else if (action === 'clear') clearNotes(btn);
    else if (action === 'close') close();
    else if (pos) setPosition(pos);
  });

  // Auto-save on input
  let saveTimeout;
  textarea.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveToLocal, 500);
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
    save: saveToFile, copy: copyToClipboard, clear: clearNotes,
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

  element.dataset.wbReady = (element.dataset.wbReady || '') + ' notes';

  // Cleanup
  return () => {
    element.classList.remove('wb-notes', `wb-notes--${currentPosition}`, 'wb-notes--open');
    resizeHandle.removeEventListener('mousedown', onResizeStart);
    resizeHandleModal.removeEventListener('mousedown', onModalResizeStart);
    header.removeEventListener('mousedown', onDragStart);
    document.removeEventListener('keydown', handleGlobalKeydown);
    delete element.wbNotes;
  };
}

export default notes;
