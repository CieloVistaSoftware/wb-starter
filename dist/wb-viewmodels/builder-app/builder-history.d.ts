/**
 * Get the history state (for external access)
 */
export function getHistoryState(): {
    hist: any[];
    hi: number;
    historyLabels: any[];
    redoLabels: any[];
};
/**
 * Reset history state
 */
export function resetHistory(): void;
/**
 * Save current canvas state to history
 * @param {string} label - Optional label for this history entry
 */
export function saveHist(label?: string): void;
/**
 * Update undo/redo button states
 */
export function updateUndoRedoButtons(): void;
/**
 * Undo last action
 * @param {Object} WB - The WB instance for rescanning
 */
export function undo(WB: any): void;
/**
 * Redo last undone action
 * @param {Object} WB - The WB instance for rescanning
 */
export function redo(WB: any): void;
/**
 * Load saved page from localStorage
 * @param {Function} addFn - The add function
 * @param {Function} addToGridFn - The addToGrid function
 * @param {Function} setSpanFn - The setSpan function
 */
export function load(addFn: Function, addToGridFn: Function, setSpanFn: Function): void;
//# sourceMappingURL=builder-history.d.ts.map