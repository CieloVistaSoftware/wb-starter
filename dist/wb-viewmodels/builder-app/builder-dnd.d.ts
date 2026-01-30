/**
 * Show drag feedback indicator near cursor
 * @param {Object} feedback - Feedback object with message and allowed status
 * @param {number} x - Cursor X position
 * @param {number} y - Cursor Y position
 */
export function showDragFeedbackUI(feedback: any, x: number, y: number): void;
/**
 * Remove drag feedback indicator
 */
export function removeDragFeedbackUI(): void;
/**
 * Find insertion point for drop based on cursor position
 * @param {HTMLElement} dropZone - The drop zone element
 * @param {number} clientX - Cursor X position
 * @param {number} clientY - Cursor Y position
 * @param {boolean} isRow - Whether the container is in row mode
 * @returns {HTMLElement|null} Reference node for insertion
 */
export function findInsertionPoint(dropZone: HTMLElement, clientX: number, clientY: number, isRow: boolean): HTMLElement | null;
/**
 * Create drag start handler
 * @returns {Function} Event handler
 */
export function createDragStartHandler(): Function;
/**
 * Create drag end handler
 * @returns {Function} Event handler
 */
export function createDragEndHandler(): Function;
/**
 * Create drag over handler for canvas
 * @param {HTMLElement} canvas - The canvas element
 * @returns {Function} Event handler
 */
export function createDragOverHandler(canvas: HTMLElement): Function;
/**
 * Create drag leave handler for canvas
 * @param {HTMLElement} canvas - The canvas element
 * @returns {Function} Event handler
 */
export function createDragLeaveHandler(canvas: HTMLElement): Function;
/**
 * Create drop handler for canvas
 * @param {HTMLElement} canvas - The canvas element
 * @param {Object} handlers - Handler functions { add, addToGrid, addToContainer, addBehaviorToComponent, toast, saveHist, WB }
 * @returns {Function} Event handler
 */
export function createDropHandler(canvas: HTMLElement, handlers: any): Function;
//# sourceMappingURL=builder-dnd.d.ts.map