/**
 * Check if a behavior is a container component
 */
export function isContainer(behavior: any): boolean;
/**
 * Get container config for a behavior
 */
export function getContainerConfig(behavior: any): any;
/**
 * Check if a component can be dropped into a container
 */
export function canDropInto(containerBehavior: any, childBehavior: any): any;
/**
 * Find the nearest container element from a drop target
 */
export function findContainerFromTarget(target: any): {
    wrapper: any;
    config: any;
    behavior: any;
};
/**
 * Find the drop zone within a container
 */
export function findDropZone(containerWrapper: any, containerConfig: any): any;
/**
 * Initialize inline editing for a canvas element
 */
export function initInlineEditing(canvas: any, { onSave, WB }?: {}): () => void;
/**
 * Get the data key for an editable element
 */
export function getEditableKey(el: any): string;
/**
 * Enhanced drop handler that supports containers
 */
export function handleEnhancedDrop(e: any, draggedComponent: any, { addToCanvas, addToContainer }: {
    addToCanvas: any;
    addToContainer: any;
}): boolean;
export function showDropZoneHighlight(target: any): void;
/**
 * Remove drop zone highlights
 */
export function hideDropZoneHighlight(): void;
/**
 * Inject required CSS for editing features
 */
export function injectEditingStyles(): void;
/**
 * Add resize handle to a dropped component
 */
export function addResizeHandle(wrapper: any): void;
/**
 * Initialize resize handles for all dropped components
 */
export function initResizeHandles(canvas: any): () => void;
/**
 * Inject snap grid CSS
 */
export function injectSnapGridStyles(): void;
/**
 * Snap a value to the grid
 */
export function snapToGrid(value: any, gridSize?: number): number;
/**
 * Initialize keyboard arrow movement for selected elements
 */
export function initKeyboardMove(canvas: any): void;
/**
 * Initialize snap grid for draggable components
 */
export function initSnapGrid(canvas: any): () => void;
export namespace CONTAINER_COMPONENTS {
    namespace details {
        let dropZone: string;
        let accepts: string[];
        let rejects: string[];
        let childBehavior: string;
    }
    namespace tabs {
        let dropZone_1: string;
        export { dropZone_1 as dropZone };
        let accepts_1: string[];
        export { accepts_1 as accepts };
        let rejects_1: string[];
        export { rejects_1 as rejects };
        let childBehavior_1: string;
        export { childBehavior_1 as childBehavior };
    }
    namespace card {
        let dropZone_2: string;
        export { dropZone_2 as dropZone };
        let accepts_2: string[];
        export { accepts_2 as accepts };
        let rejects_2: string[];
        export { rejects_2 as rejects };
        let childBehavior_2: string;
        export { childBehavior_2 as childBehavior };
    }
    namespace cardhero {
        let dropZone_3: string;
        export { dropZone_3 as dropZone };
        let accepts_3: string[];
        export { accepts_3 as accepts };
        let rejects_3: string[];
        export { rejects_3 as rejects };
        let childBehavior_3: string;
        export { childBehavior_3 as childBehavior };
    }
    namespace cardimage {
        let dropZone_4: string;
        export { dropZone_4 as dropZone };
        let accepts_4: string[];
        export { accepts_4 as accepts };
        let rejects_4: string[];
        export { rejects_4 as rejects };
        let childBehavior_4: string;
        export { childBehavior_4 as childBehavior };
    }
    namespace cardoverlay {
        let dropZone_5: string;
        export { dropZone_5 as dropZone };
        let accepts_5: string[];
        export { accepts_5 as accepts };
        let rejects_5: string[];
        export { rejects_5 as rejects };
        let childBehavior_5: string;
        export { childBehavior_5 as childBehavior };
    }
    namespace cardbutton {
        let dropZone_6: string;
        export { dropZone_6 as dropZone };
        let accepts_6: string[];
        export { accepts_6 as accepts };
        let rejects_6: string[];
        export { rejects_6 as rejects };
        let childBehavior_6: string;
        export { childBehavior_6 as childBehavior };
    }
    namespace cardprofile {
        let dropZone_7: string;
        export { dropZone_7 as dropZone };
        let accepts_7: string[];
        export { accepts_7 as accepts };
        let rejects_7: string[];
        export { rejects_7 as rejects };
        let childBehavior_7: string;
        export { childBehavior_7 as childBehavior };
    }
    namespace cardpricing {
        let dropZone_8: string;
        export { dropZone_8 as dropZone };
        let accepts_8: string[];
        export { accepts_8 as accepts };
        let rejects_8: string[];
        export { rejects_8 as rejects };
        let childBehavior_8: string;
        export { childBehavior_8 as childBehavior };
    }
    namespace cardproduct {
        let dropZone_9: string;
        export { dropZone_9 as dropZone };
        let accepts_9: string[];
        export { accepts_9 as accepts };
        let rejects_9: string[];
        export { rejects_9 as rejects };
        let childBehavior_9: string;
        export { childBehavior_9 as childBehavior };
    }
    namespace cardstats {
        let dropZone_10: string;
        export { dropZone_10 as dropZone };
        let accepts_10: string[];
        export { accepts_10 as accepts };
        let rejects_10: string[];
        export { rejects_10 as rejects };
        let childBehavior_10: string;
        export { childBehavior_10 as childBehavior };
    }
    namespace cardtestimonial {
        let dropZone_11: string;
        export { dropZone_11 as dropZone };
        let accepts_11: string[];
        export { accepts_11 as accepts };
        let rejects_11: string[];
        export { rejects_11 as rejects };
        let childBehavior_11: string;
        export { childBehavior_11 as childBehavior };
    }
    namespace cardexpandable {
        let dropZone_12: string;
        export { dropZone_12 as dropZone };
        let accepts_12: string[];
        export { accepts_12 as accepts };
        let rejects_12: string[];
        export { rejects_12 as rejects };
        let childBehavior_12: string;
        export { childBehavior_12 as childBehavior };
    }
    namespace cardminimizable {
        let dropZone_13: string;
        export { dropZone_13 as dropZone };
        let accepts_13: string[];
        export { accepts_13 as accepts };
        let rejects_13: string[];
        export { rejects_13 as rejects };
        let childBehavior_13: string;
        export { childBehavior_13 as childBehavior };
    }
    namespace dialog {
        let dropZone_14: string;
        export { dropZone_14 as dropZone };
        let accepts_14: string[];
        export { accepts_14 as accepts };
        let rejects_14: string[];
        export { rejects_14 as rejects };
        let childBehavior_14: string;
        export { childBehavior_14 as childBehavior };
    }
    namespace drawer {
        let dropZone_15: string;
        export { dropZone_15 as dropZone };
        let accepts_15: string[];
        export { accepts_15 as accepts };
        let rejects_15: string[];
        export { rejects_15 as rejects };
        let childBehavior_15: string;
        export { childBehavior_15 as childBehavior };
    }
    namespace drawerLayout {
        let dropZone_16: string;
        export { dropZone_16 as dropZone };
        let accepts_16: string[];
        export { accepts_16 as accepts };
        let rejects_16: string[];
        export { rejects_16 as rejects };
        let childBehavior_16: string;
        export { childBehavior_16 as childBehavior };
    }
    namespace collapse {
        let dropZone_17: string;
        export { dropZone_17 as dropZone };
        let accepts_17: string[];
        export { accepts_17 as accepts };
        let rejects_17: string[];
        export { rejects_17 as rejects };
        let childBehavior_17: string;
        export { childBehavior_17 as childBehavior };
    }
    namespace grid {
        let dropZone_18: string;
        export { dropZone_18 as dropZone };
        let accepts_18: string[];
        export { accepts_18 as accepts };
        let rejects_18: any[];
        export { rejects_18 as rejects };
        let childBehavior_18: string;
        export { childBehavior_18 as childBehavior };
    }
    namespace flex {
        let dropZone_19: string;
        export { dropZone_19 as dropZone };
        let accepts_19: string[];
        export { accepts_19 as accepts };
        let rejects_19: any[];
        export { rejects_19 as rejects };
        let childBehavior_19: string;
        export { childBehavior_19 as childBehavior };
    }
    namespace stack {
        let dropZone_20: string;
        export { dropZone_20 as dropZone };
        let accepts_20: string[];
        export { accepts_20 as accepts };
        let rejects_20: any[];
        export { rejects_20 as rejects };
        let childBehavior_20: string;
        export { childBehavior_20 as childBehavior };
    }
    namespace container {
        let dropZone_21: string;
        export { dropZone_21 as dropZone };
        let accepts_21: string[];
        export { accepts_21 as accepts };
        let rejects_21: any[];
        export { rejects_21 as rejects };
        let childBehavior_21: string;
        export { childBehavior_21 as childBehavior };
    }
    namespace fieldset {
        let dropZone_22: string;
        export { dropZone_22 as dropZone };
        let accepts_22: string[];
        export { accepts_22 as accepts };
        let rejects_22: string[];
        export { rejects_22 as rejects };
        let childBehavior_22: string;
        export { childBehavior_22 as childBehavior };
    }
    namespace hero {
        let dropZone_23: string;
        export { dropZone_23 as dropZone };
        let accepts_23: string[];
        export { accepts_23 as accepts };
        let rejects_23: string[];
        export { rejects_23 as rejects };
        let childBehavior_23: string;
        export { childBehavior_23 as childBehavior };
    }
    namespace navbar {
        let dropZone_24: string;
        export { dropZone_24 as dropZone };
        let accepts_24: string[];
        export { accepts_24 as accepts };
        let rejects_24: string[];
        export { rejects_24 as rejects };
        let childBehavior_24: string;
        export { childBehavior_24 as childBehavior };
    }
    namespace sidebar {
        let dropZone_25: string;
        export { dropZone_25 as dropZone };
        let accepts_25: string[];
        export { accepts_25 as accepts };
        let rejects_25: string[];
        export { rejects_25 as rejects };
        let childBehavior_25: string;
        export { childBehavior_25 as childBehavior };
    }
}
//# sourceMappingURL=builder-editing.d.ts.map