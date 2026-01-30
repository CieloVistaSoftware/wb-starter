"use strict";
/**
 * Builder Drag & Drop
 * Drag and drop event handlers for the canvas
 */
// ============================================================================
// DRAG & DROP EVENT HANDLERS
// ============================================================================
/**
 * Setup drag and drop handlers
 */
function setupDragDropHandlers() {
    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('component-item')) {
            window.setDraggedComponent(e.target.dataset.component);
            e.dataTransfer.effectAllowed = 'copy';
        }
    });
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        const dropZone = e.target.closest('.canvas-drop-zone');
        if (dropZone) {
            dropZone.classList.add('drag-over');
            e.dataTransfer.dropEffect = 'copy';
        }
    });
    document.addEventListener('dragleave', (e) => {
        const dropZone = e.target.closest('.canvas-drop-zone');
        if (dropZone)
            dropZone.classList.remove('drag-over');
    });
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        const dropZone = e.target.closest('.canvas-drop-zone');
        if (dropZone && window.draggedComponent) {
            const section = dropZone.getAttribute('section') || dropZone.dataset.section;
            if (!section) {
                console.error('[Builder] Drop zone has no section attribute');
                return;
            }
            addComponentToCanvas(window.draggedComponent, section);
            window.setDraggedComponent(null);
            dropZone.classList.remove('drag-over');
            ensureDropZoneLast(`${section}-container`);
        }
    });
}
// Initialize on load
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupDragDropHandlers);
    }
    else {
        setupDragDropHandlers();
    }
}
// ============================================================================
// EXPORTS
// ============================================================================
if (typeof window !== 'undefined') {
    window.setupDragDropHandlers = setupDragDropHandlers;
}
console.log('[BuilderDragDrop] ✅ Loaded');
//# sourceMappingURL=builder-drag-drop.js.map