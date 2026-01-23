/**
 * Notes Behavior
 * -----------------------------------------------------------------------------
 * Slide-out notes drawer with multiple display modes.
 * Supports: left slide, right slide, modal
 * Features: Auto-save to localStorage, copy, clear, resize
 * 
 * Custom Tag: <wb-notes>
 * 
 * @deprecated Use <wb-issues> instead for bug tracking
 * -----------------------------------------------------------------------------
 */

const NOTES_STORAGE_KEY = 'wb-notes';

export function notes(element, options = {}) {
  const config = {
    position: options.position || element.dataset.position || 'modal',
    maxWidth: options.maxWidth || element.dataset.maxWidth || '50vw',
    minWidth: options.minWidth || element.dataset.minWidth || '200px',
    defaultWidth: options.defaultWidth || element.dataset.defaultWidth || '320px',
    placeholder: options.placeholder || element.dataset.placeholder || 'Add your notes here...',
    ...options
  };

  // State
  let isOpen = false;
  let currentPosition = config.position;
  let modalSize = { width: 500, height: 400 };

  // Add classes
  element.classList.add('wb-notes', `wb-notes--${config.position}`);
  element.classList.remove('wb-notes--open');

  // Build structure
  element.innerHTML = `
    <button class="wb-notes__trigger" title="Open Notes">📝</button>
    <div class="wb-notes__backdrop"></div>
    <div class="wb-notes__drawer">
      <header class="wb-notes__header">
        <span class="wb-notes__title">📝 Notes</span>
        <div class="wb-notes__actions">
          <button class="wb-notes__icon-btn" pos="left" title="Dock Left">&lt;</button>
          <button class="wb-notes__icon-btn" pos="modal" title="Float Modal">□</button>
          <button class="wb-notes__icon-btn" pos="right" title="Dock Right">&gt;</button>
          <button class="wb-notes__icon-btn" action="close" title="Close">✕</button>
        </div>
      </header>
      <textarea class="wb-notes__textarea" placeholder="${config.placeholder}"></textarea>
      <footer class="wb-notes__footer">
        <div class="wb-notes__footer-actions">
          <button class="wb-notes__footer-btn" action="copy" title="Copy">📋 Copy</button>
          <button class="wb-notes__footer-btn wb-notes__footer-btn--clear" action="clear" title="Clear">🗑️ Clear</button>
        </div>
      </footer>
    </div>
  `;

  // Get elements
  const triggerBtn = element.querySelector('.wb-notes__trigger');
  const backdrop = element.querySelector('.wb-notes__backdrop');
  const drawer = element.querySelector('.wb-notes__drawer');
  const textarea = element.querySelector('.wb-notes__textarea');

  // Load saved notes
  const loadNotes = () => {
    try {
      const saved = localStorage.getItem(NOTES_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        textarea.value = data.content || '';
      }
    } catch (e) {
      console.warn('[Notes] Failed to load:', e);
    }
  };

  // Save notes
  const saveNotes = () => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify({
        content: textarea.value,
        lastUpdated: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('[Notes] Failed to save:', e);
    }
  };

  // Open/close
  const open = () => {
    isOpen = true;
    element.classList.add('wb-notes--open');
    backdrop.classList.add('visible');
    
    drawer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${modalSize.width}px;
      height: ${modalSize.height}px;
      display: flex;
    `;
  };

  const close = () => {
    isOpen = false;
    element.classList.remove('wb-notes--open');
    backdrop.classList.remove('visible');
    drawer.style.display = 'none';
    saveNotes();
  };

  const setPosition = (pos) => {
    element.classList.remove(`wb-notes--${currentPosition}`);
    currentPosition = pos;
    element.classList.add(`wb-notes--${pos}`);
    
    if (pos !== 'modal') {
      backdrop.classList.remove('visible');
      drawer.style.cssText = '';
    }
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(textarea.value);
    } catch (e) {
      console.warn('[Notes] Copy failed:', e);
    }
  };

  // Clear
  const clearNotes = () => {
    textarea.value = '';
    saveNotes();
  };

  // Event listeners
  triggerBtn.addEventListener('click', () => isOpen ? close() : open());
  backdrop.addEventListener('click', close);

  element.addEventListener('click', (e) => {
    const btn = e.target.closest('.wb-notes__icon-btn, .wb-notes__footer-btn');
    if (!btn) return;
    
    const action = btn.dataset.action;
    const pos = btn.dataset.pos;
    
    if (action === 'close') close();
    else if (action === 'copy') copyToClipboard();
    else if (action === 'clear') clearNotes();
    else if (pos) setPosition(pos);
  });

  // Auto-save on input
  let saveTimeout;
  textarea.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveNotes, 500);
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) close();
  });

  // Initialize
  loadNotes();

  element.dataset.wbReady = 'notes';

  return () => {
    element.classList.remove('wb-notes', 'wb-notes--open');
  };
}

export default notes;
