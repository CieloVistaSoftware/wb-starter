/**
 * Save page to localStorage
 */
export function savePage(): void;
/**
 * Save as HTML file for download
 */
export function saveAsHTML(): void;
/**
 * Export page as JSON
 */
export function exportJSON(): void;
/**
 * Import page from JSON file
 * @param {Function} addFn - The add function to create components
 * @param {Function} addToGridFn - The addToGrid function
 * @param {Function} setSpanFn - The setSpan function
 * @param {Function} saveHistFn - The saveHist function
 */
export function importJSON(addFn: Function, addToGridFn: Function, setSpanFn: Function, saveHistFn: Function): void;
/**
 * Reset the canvas
 * @param {Function} saveHistFn - Optional saveHist function
 */
export function resetCanvas(saveHistFn: Function): void;
/**
 * Toggle save menu dropdown
 */
export function toggleSaveMenu(): void;
//# sourceMappingURL=builder-io.d.ts.map