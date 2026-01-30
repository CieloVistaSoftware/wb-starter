/**
 * builder-utils.js
 * Shared utility functions for the builder
 */
/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'info' | 'error' | 'success'
 */
export function toast(message: string, type?: string): void;
/**
 * Update component count display
 */
export function updCount(): void;
/**
 * Check if canvas is empty and show placeholder
 */
export function chkEmpty(): void;
/**
 * Update counts and refresh tree
 */
export function upd(): void;
/**
 * Auto-extend canvas height if needed
 */
export function autoExtendCanvas(): void;
/**
 * Show context menu at position
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {HTMLElement} wrapper - The wrapper element
 */
export function showContextMenu(x: number, y: number, wrapper: HTMLElement): void;
/**
 * Validate a component for required fields
 * @param {HTMLElement} wrapper - The wrapper element
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function validateComponent(wrapper: HTMLElement): {
    valid: boolean;
    missing: string[];
};
//# sourceMappingURL=builder-utils.d.ts.map