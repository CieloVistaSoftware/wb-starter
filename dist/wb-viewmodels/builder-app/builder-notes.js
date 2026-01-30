/**
 * builder-notes.js
 * Notes drawer functionality for the builder
 */
let notesOpen = false;
let notesModalRef = null;
/**
 * Initialize the notes drawer
 */
export function initNotes() {
    const textarea = document.getElementById('notesArea');
    if (textarea) {
        textarea.value = localStorage.getItem('wb-builder-notes') || '';
        textarea.addEventListener('input', () => {
            localStorage.setItem('wb-builder-notes', textarea.value);
        });
    }
    // Initialize modal references
    notesModalRef = document.getElementById('notesModal');
    if (!notesModalRef)
        return;
    // ========================================
    // WIDTH RESIZE (left edge)
    // ========================================
    let isResizingWidth = false;
    let resizeStartX = 0;
    let resizeStartWidth = 0;
    notesModalRef.addEventListener('mousedown', (e) => {
        const modalRect = notesModalRef.getBoundingClientRect();
        // Left edge for width resize
        if (e.clientX < modalRect.left + 8 && e.clientY > modalRect.top + 8 && e.clientY < modalRect.bottom - 8) {
            isResizingWidth = true;
            resizeStartX = e.clientX;
            resizeStartWidth = modalRect.width;
            notesModalRef.classList.add('resizing-width');
            document.body.style.cursor = 'ew-resize';
            e.preventDefault();
        }
    });
    // ========================================
    // HEIGHT RESIZE (bottom edge)
    // ========================================
    let isResizingHeight = false;
    let resizeStartY = 0;
    let resizeStartHeight = 0;
    notesModalRef.addEventListener('mousedown', (e) => {
        const modalRect = notesModalRef.getBoundingClientRect();
        // Bottom edge for height resize
        if (e.clientY > modalRect.bottom - 8 && e.clientX > modalRect.left + 8) {
            isResizingHeight = true;
            resizeStartY = e.clientY;
            resizeStartHeight = modalRect.height;
            notesModalRef.classList.add('resizing-height');
            document.body.style.cursor = 'ns-resize';
            e.preventDefault();
        }
    });
    // ========================================
    // MOUSE MOVE HANDLER
    // ========================================
    document.addEventListener('mousemove', (e) => {
        if (isResizingWidth) {
            const deltaX = resizeStartX - e.clientX;
            const newWidth = Math.max(300, Math.min(window.innerWidth * 0.66, resizeStartWidth + deltaX));
            notesModalRef.style.width = newWidth + 'px';
        }
        if (isResizingHeight) {
            const maxHeight = window.innerHeight - 56 - 40;
            const deltaY = e.clientY - resizeStartY;
            const newHeight = Math.max(200, Math.min(maxHeight, resizeStartHeight + deltaY));
            notesModalRef.style.height = newHeight + 'px';
        }
    });
    // ========================================
    // MOUSE UP HANDLER
    // ========================================
    document.addEventListener('mouseup', () => {
        if (isResizingWidth) {
            isResizingWidth = false;
            notesModalRef.classList.remove('resizing-width');
            document.body.style.cursor = '';
            localStorage.setItem('wb-notes-width', notesModalRef.style.width);
        }
        if (isResizingHeight) {
            isResizingHeight = false;
            notesModalRef.classList.remove('resizing-height');
            document.body.style.cursor = '';
            localStorage.setItem('wb-notes-height', notesModalRef.style.height);
        }
    });
    // Restore saved size
    const savedWidth = localStorage.getItem('wb-notes-width');
    const savedHeight = localStorage.getItem('wb-notes-height');
    if (savedWidth)
        notesModalRef.style.width = savedWidth;
    if (savedHeight)
        notesModalRef.style.height = savedHeight;
}
/**
 * Toggle the notes drawer open/closed
 */
export function toggleNotesDrawer() {
    if (!notesModalRef)
        notesModalRef = document.getElementById('notesModal');
    const backdrop = document.getElementById('notesBackdrop');
    if (!notesModalRef) {
        console.error('Notes modal not found');
        return;
    }
    notesOpen = !notesOpen;
    notesModalRef.classList.toggle('open', notesOpen);
    backdrop?.classList.toggle('open', notesOpen);
    localStorage.setItem('wb-notes-open', notesOpen);
}
/**
 * Copy notes to clipboard
 */
export function copyNotes() {
    const notesText = document.getElementById('notesArea').value;
    if (!notesText.trim()) {
        showNotesStatus('No notes to copy', 'error');
        return;
    }
    navigator.clipboard.writeText(notesText).then(() => showNotesStatus('Copied to clipboard!', 'success'));
}
/**
 * Save notes to file via API
 */
export async function saveNotesToFile() {
    const notesText = document.getElementById('notesArea').value;
    if (!notesText.trim()) {
        showNotesStatus('Nothing to save', 'info');
        return;
    }
    const notesData = {
        notes: [{ id: 'builder', content: notesText, updated: new Date().toISOString() }]
    };
    try {
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                location: 'data/notes.json',
                data: notesData
            })
        });
        if (!response.ok) {
            const errorData = await response.json();
            showNotesStatus('Error: ' + (errorData.error || 'Save failed'), 'error');
            return;
        }
        const resultData = await response.json();
        if (resultData.duplicate) {
            showNotesStatus('No changes to save', 'info');
        }
        else {
            showNotesStatus('Saved to data/notes.json', 'success');
        }
    }
    catch (err) {
        console.error('[Save Error]', err);
        showNotesStatus('Save failed: ' + err.message, 'error');
    }
}
/**
 * Clear all notes
 */
export function clearNotes() {
    const textarea = document.getElementById('notesArea');
    if (!textarea.value.trim() || confirm('Clear all notes?')) {
        textarea.value = '';
        localStorage.removeItem('wb-builder-notes');
        showNotesStatus('Notes cleared', 'success');
    }
}
/**
 * Show status message in notes modal
 * @param {string} msg - Message to show
 * @param {string} type - 'info' | 'error' | 'success'
 */
function showNotesStatus(msg, type) {
    const status = document.getElementById('notesStatus');
    if (!status)
        return;
    status.textContent = msg;
    status.className = 'notes-modal-status ' + type;
    setTimeout(() => {
        status.textContent = '';
        status.className = 'notes-modal-status';
    }, 3000);
}
// Expose globally
window.toggleNotesDrawer = toggleNotesDrawer;
window.copyNotes = copyNotes;
window.saveNotesToFile = saveNotesToFile;
window.clearNotes = clearNotes;
//# sourceMappingURL=builder-notes.js.map