/**
 * Generate unique ID based on component type
 */
export function genId(c: any): string;
/**
 * Reset the component ID counter (used when clearing canvas)
 */
export function resetCid(): void;
/**
 * Get current cid value
 */
export function getCid(): number;
/**
 * Set cid value (used when loading)
 */
export function setCid(value: any): void;
/**
 * Create DOM element from component config
 */
export function mkEl(c: any, id: any): any;
/**
 * Add a component to the canvas
 */
export function add(c: any, parentId?: any, options?: {}): HTMLDivElement;
/**
 * Remove a component from the canvas
 */
export function remove(id: any, options?: {}): boolean;
/**
 * Update a component's properties
 */
export function update(id: any, props?: {}, options?: {}): HTMLElement;
/**
 * Reset/clear the canvas
 */
export function reset(options?: {}): boolean;
/**
 * Get a component by ID
 */
export function get(id: any): HTMLElement;
/**
 * Add component to a grid
 */
export function addToGrid(c: any, gridWrapper: any, options?: {}): void;
/**
 * Set grid span for a component
 */
export function setSpan(id: any, span: any, options?: {}): void;
/**
 * Add component to a container's drop zone
 */
export function addToContainer(c: any, containerWrapper: any, dropZone: any, referenceNode?: any, options?: {}): void;
export namespace builderAPI {
    export { add };
    export { remove };
    export { update };
    export { reset };
    export { get };
}
//# sourceMappingURL=builder-components.d.ts.map