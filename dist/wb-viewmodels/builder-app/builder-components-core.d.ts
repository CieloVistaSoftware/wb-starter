/**
 * Set the component ID counter (for restoring state)
 * @param {number} value - New counter value
 */
export function setComponentIdCounter(value: number): void;
/**
 * Get current component ID counter
 * @returns {number} Current counter value
 */
export function getComponentIdCounter(): number;
/**
 * Generate unique ID based on component type
 * @param {Object} c - Component configuration
 * @returns {string} Generated ID
 */
export function genId(c: any): string;
/**
 * Create a DOM element from component configuration
 * @param {Object} c - Component configuration
 * @param {string} id - Element ID
 * @returns {HTMLElement} Created element
 */
export function mkEl(c: any, id: string): HTMLElement;
/**
 * Build controls HTML for a component wrapper
 * @param {string} id - Component ID
 * @param {string|null} parentId - Parent component ID (if any)
 * @param {boolean} isGrid - Whether parent is a grid
 * @returns {string} Controls HTML
 */
export function buildControls(id: string, parentId?: string | null, isGrid?: boolean): string;
/**
 * Add a component to the canvas
 * @param {Object} c - Component configuration
 * @param {string|null} parentId - Parent component ID
 * @param {Object} deps - Dependencies { WB, selComp, Events, renderTree, toast, saveHist }
 * @returns {HTMLElement} Created wrapper element
 */
export function add(c: any, parentId?: string | null, deps?: any): HTMLElement;
/**
 * Add component to a grid
 * @param {Object} c - Component configuration
 * @param {HTMLElement} gridWrapper - Grid wrapper element
 * @param {Object} deps - Dependencies
 */
export function addToGrid(c: any, gridWrapper: HTMLElement, deps?: any): void;
/**
 * Add component to a container's drop zone
 * @param {Object} c - Component configuration
 * @param {HTMLElement} containerWrapper - Container wrapper element
 * @param {HTMLElement} dropZone - Drop zone element
 * @param {HTMLElement|null} referenceNode - Reference node for insertion
 * @param {Object} deps - Dependencies
 */
export function addToContainer(c: any, containerWrapper: HTMLElement, dropZone: HTMLElement, referenceNode?: HTMLElement | null, deps?: any): void;
/**
 * Delete a component
 * @param {string} id - Component ID
 * @param {Object} deps - Dependencies
 */
export function del(id: string, deps?: any): void;
/**
 * Duplicate a component
 * @param {string} id - Component ID
 * @param {Function} addFn - Add function
 * @param {Object} deps - Dependencies
 */
export function dup(id: string, addFn: Function, deps?: any): void;
/**
 * Move component up
 * @param {string} id - Component ID
 * @param {Object} deps - Dependencies
 */
export function moveUp(id: string, deps?: any): void;
/**
 * Move component down
 * @param {string} id - Component ID
 * @param {Object} deps - Dependencies
 */
export function moveDown(id: string, deps?: any): void;
/**
 * Set grid span for a component
 * @param {string} id - Component ID
 * @param {number} span - Span value (1-3)
 * @param {Function} saveHist - Save history function
 */
export function setSpan(id: string, span: number, saveHist: Function): void;
//# sourceMappingURL=builder-components-core.d.ts.map