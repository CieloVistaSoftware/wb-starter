/**
 * Notes Behavior
 * ==============
 * Slide-out notes drawer with multiple display modes.
 * Supports: left slide, right slide, modal
 * Features: Auto-save to JSON, copy, clear, resize up to 50vw
 * 
 * v2.0 Changes:
 * - Double arrows (« ») to collapse to either side
 * - Clear button moved to footer (avoid accidental clicks)
 * - Wide compact buttons to fit more in same space
 * - Save to JSON with duplicate content prevention
 */

const NOTES_STORAGE_KEY = 'wb-notes';
const NOTES_FILE_PATH = '/data/notes.json';

export function notes(element, options = {}) {
  const config = {
    position: options.position || element.dataset.position || 'left',
    maxWidth: options.maxWidth || element.dataset.maxWidth || '50vw',
    minWidth: options.minWidth || element.dataset.minWidth || '200px',
    defaultWidth: options.defaultWidth || element.dataset.defaultWidth || '320px',
    autoSave: options.autoSave ?? (element.dataset.autoSave !== 'false'),
    savePath: options.savePath || element.dataset.savePath || NOTES_FILE_PATH,
    placeholder: options.placeholder || element.dataset.placeholder || 'Add your notes here...',
    ...options
  };

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
            <button class="wb-notes__wide-btn" data-action="collapse-left" title="Collapse left">«</button>
            <button class="wb-notes__wide-btn ${currentPosition === 'left' ? 'active' : ''}" data-pos="left" title="Left">◀</button>
            <button class="wb-notes__wide-btn ${currentPosition === 'modal' ? 'active' : ''}" data-pos="modal" title="Modal">◻</button>
            <button class="wb-notes__wide-btn ${currentPosition === 'right' ? 'active' : ''}" data-pos="right" title="Right">▶</button>
            <button class="wb-notes__wide-btn" data-action="collapse-right" title="Collapse right">»</button>
            <button class="wb-notes__wide-btn" data-action="copy" title="Copy">📋</button>
            <button class="wb-notes__wide-btn wb-notes__wide-btn--save" data-action="save" title="Save">💾</button>
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
        const data = JSON.parse(local);
        notesContent = data.content || '';
        textarea.value = notesContent;
        if (data.position) setPosition(data.position);
        if (data.width) drawer.style.width = data.width;
        if (data.modalPos) modalPos = data.modalPos;
        if (data.modalSize) modalSize = data.modalSize;
        if (data.isOpen) open();
      }
    } catch (e) {
      console.warn('Failed to load notes:', e);
    }
  };

  // Save notes to localStorage
  const saveToLocal = () => {
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
    const content = textarea.value.trim();
    
    if (!content) {
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
      if (isDuplicateContent(existingData.notes, content)) {
        showStatus('Note already exists (duplicate prevented)', 'warning');
        return;
      }

      // Add new note
      const newNote = {
        id: 'note-' + Date.now(),
        content: content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      existingData.notes.push(newNote);
      existingData.lastUpdated = new Date().toISOString();

      localStorage.setItem(NOTES_STORAGE_KEY + '-file', JSON.stringify(existingData, null, 2));
      
      showStatus(`Saved (${existingData.notes.length} notes)`, 'success');
      
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
    isOpen = true;
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

  // Clear notes
  const clearNotes = () => {
    if (!textarea.value.trim() || confirm('Clear all notes?')) {
      textarea.value = '';
      notesContent = '';
      saveToLocal();
      showStatus('Notes cleared', 'info');
    }
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
    else if (action === 'save') saveToFile();
    else if (action === 'clear') clearNotes();
    else if (action === 'close') close();
    else if (pos) setPosition(pos);
  });

  // Auto-save on input
  let saveTimeout;
  textarea.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveToLocal, 500);
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
