/**
 * Get the currently selected component
 * @returns {HTMLElement|null} Selected element
 */
export function getSelection(): HTMLElement | null;
/**
 * Set the currently selected component
 * @param {HTMLElement|null} element - Element to select
 */
export function setSelection(element: HTMLElement | null): void;
/**
 * Select a component and render its properties
 * @param {HTMLElement} w - Wrapper element to select
 * @param {string|null} scrollToProperty - Property key to scroll to
 * @param {boolean} switchTab - Whether to switch tabs (NOT USED - user controls tabs)
 */
export function selComp(w: HTMLElement, scrollToProperty?: string | null, switchTab?: boolean): void;
/**
 * Render properties panel for a component
 * @param {HTMLElement} w - Wrapper element
 * @param {string|null} scrollToProperty - Property key to scroll to
 */
export function renderProps(w: HTMLElement, scrollToProperty?: string | null): void;
/**
 * Update a property value on a component
 * @param {string} wid - Wrapper element ID
 * @param {string} k - Property key
 * @param {*} v - Property value
 */
export function updP(wid: string, k: string, v: any): Promise<void>;
/**
 * Validate a component for required fields
 * @param {HTMLElement} wrapper - Component wrapper
 * @returns {Object} Validation result { valid, missing }
 */
export function validateComponent(wrapper: HTMLElement): any;
/**
 * Change card type (morph between card variants)
 * @param {string} wrapperId - Wrapper element ID
 * @param {string} newType - New card type
 */
export function changeCardType(wrapperId: string, newType: string): void;
/**
 * Update element ID
 * @param {string} oldId - Current ID
 * @param {string} newId - New ID
 */
export function updateElementId(oldId: string, newId: string): void;
//# sourceMappingURL=builder-selection.d.ts.map