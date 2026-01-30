/**
 * builder-history.js
 * Undo/Redo history management for the builder
 */
import { toast, updCount } from './builder-utils.js';
import { renderTree } from './builder-tree.js';
import { updateBadges } from './builder-incomplete.js';
// History state
let hist = [];
let hi = -1;
let historyLabels = [];
let redoLabels = [];
/**
 * Get the history state (for external access)
 */
export function getHistoryState() {
    return { hist, hi, historyLabels, redoLabels };
}
/**
 * Reset history state
 */
export function resetHistory() {
    hist = [];
    hi = -1;
    historyLabels = [];
    redoLabels = [];
}
/**
 * Save current canvas state to history
 * @param {string} label - Optional label for this history entry
 */
export function saveHist(label = 'Change') {
    const canvas = document.getElementById('canvas');
    if (!canvas)
        return;
    hist = hist.slice(0, hi + 1);
    hist.push(canvas.innerHTML);
    hi = hist.length - 1;
    // Track labels
    historyLabels.push(label);
    redoLabels = [];
    if (hist.length > 50) {
        hist.shift();
        hi--;
        historyLabels.shift();
    }
    updateUndoRedoButtons();
    updateUndoRedoLabels();
}
/**
 * Update undo/redo button states
 */
export function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn)
        undoBtn.disabled = hi <= 0;
    if (redoBtn)
        redoBtn.disabled = hi >= hist.length - 1;
}
/**
 * Update undo/redo labels
 */
function updateUndoRedoLabels() {
    const undoLabel = document.getElementById('undoLabel');
    const redoLabel = document.getElementById('redoLabel');
    if (undoLabel) {
        undoLabel.textContent = historyLabels.length > 0 ? historyLabels[historyLabels.length - 1] : '';
    }
    if (redoLabel) {
        redoLabel.textContent = redoLabels.length > 0 ? redoLabels[redoLabels.length - 1] : '';
    }
}
/**
 * Undo last action
 * @param {Object} WB - The WB instance for rescanning
 */
export function undo(WB) {
    if (hi > 0) {
        // Move label to redo stack
        if (historyLabels.length > 0) {
            redoLabels.push(historyLabels.pop());
        }
        hi--;
        document.getElementById('canvas').innerHTML = hist[hi];
        if (WB)
            WB.scan(document.getElementById('canvas'));
        updCount();
        renderTree();
        updateUndoRedoButtons();
        updateUndoRedoLabels();
        updateBadges();
        toast('Undo');
    }
}
/**
 * Redo last undone action
 * @param {Object} WB - The WB instance for rescanning
 */
export function redo(WB) {
    if (hi < hist.length - 1) {
        // Move label back from redo stack
        if (redoLabels.length > 0) {
            historyLabels.push(redoLabels.pop());
        }
        hi++;
        document.getElementById('canvas').innerHTML = hist[hi];
        if (WB)
            WB.scan(document.getElementById('canvas'));
        updCount();
        renderTree();
        updateUndoRedoButtons();
        updateUndoRedoLabels();
        updateBadges();
        toast('Redo');
    }
}
/**
 * Load saved page from localStorage
 * @param {Function} addFn - The add function
 * @param {Function} addToGridFn - The addToGrid function
 * @param {Function} setSpanFn - The setSpan function
 */
export function load(addFn, addToGridFn, setSpanFn) {
    const savedData = localStorage.getItem('wb-builder-page');
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            if (Array.isArray(parsed)) {
                parsed.forEach(comp => addFn(comp));
            }
            else {
                if (parsed.theme) {
                    document.getElementById('pageTheme').value = parsed.theme;
                    document.documentElement.dataset.theme = parsed.theme;
                    document.getElementById('canvas').dataset.theme = parsed.theme;
                }
                if (parsed.templateName) {
                    document.body.dataset.templateName = parsed.templateName;
                }
                if (parsed.components) {
                    parsed.components.forEach(comp => {
                        addFn(comp);
                        // Add grid children
                        if (comp.children) {
                            const gridWrapper = document.getElementById(comp.id);
                            comp.children.forEach(gridChild => {
                                addToGridFn(gridChild, gridWrapper);
                                if (gridChild.span)
                                    setSpanFn(gridChild.id, parseInt(gridChild.span));
                            });
                        }
                    });
                }
            }
            // Update badges after load
            setTimeout(() => updateBadges(), 100);
        }
        catch (e) {
            console.error('Load error:', e);
        }
    }
}
// Expose globally
window.saveHist = saveHist;
window.undo = function () { undo(window.WB); };
window.redo = function () { redo(window.WB); };
//# sourceMappingURL=builder-history.js.map