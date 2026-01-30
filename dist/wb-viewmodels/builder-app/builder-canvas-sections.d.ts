/**
 * Initialize section-based canvas
 */
export function initCanvasSections(): void;
/**
 * Switch canvas view
 */
export function setCanvasView(view: any): void;
/**
 * Set target section for new elements
 */
export function setTargetSection(sectionId: any): void;
/**
 * Set insertion point relative to an element
 */
export function setInsertPoint(elementId: any, mode: any): void;
/**
 * Clear insertion point
 */
export function clearInsertPoint(): void;
/**
 * Get current drop configuration
 */
export function getDropConfig(): {
    section: string;
    mode: string;
    target: any;
    dropZone: Element;
};
/**
 * Add HTML to a specific section
 * @param {string} html - HTML string to add
 * @param {string} section - 'header' | 'main' | 'footer'
 * @param {object} template - Optional template metadata
 */
export function addHTMLToSection(html: string, section: string, template?: object): HTMLDivElement;
/**
 * Add element to canvas (called by template browser and drag-drop)
 */
export function addElementToCanvas(element: any): any;
/**
 * Remove element from canvas
 */
export function removeCanvasElement(id: any): void;
declare namespace _default {
    export { initCanvasSections as init };
    export { setCanvasView as setView };
    export { setTargetSection as setTarget };
    export { setInsertPoint };
    export { clearInsertPoint };
    export { addElementToCanvas as addElement };
    export { removeCanvasElement as removeElement };
    export { getDropConfig };
}
export default _default;
//# sourceMappingURL=builder-canvas-sections.d.ts.map