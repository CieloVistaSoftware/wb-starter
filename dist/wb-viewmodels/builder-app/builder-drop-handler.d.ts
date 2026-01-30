/**
 * Handle a drop event based on behavior type
 * @param {Object} component - Component config from sidebar
 * @param {HTMLElement} dropTarget - Where the drop occurred
 * @param {HTMLElement} canvas - The canvas element
 * @returns {Object} Result with { handled: boolean, element?: HTMLElement, message?: string }
 */
export function handleSmartDrop(component: any, dropTarget: HTMLElement, canvas: HTMLElement): any;
/**
 * Apply a modifier behavior to an existing element
 */
export function applyModifier(wrapper: any, behavior: any): false | {
    success: boolean;
    message: string;
} | {
    success: boolean;
    message?: undefined;
};
/**
 * Remove a modifier from an element
 */
export function removeModifier(wrapper: any, behavior: any): false | {
    success: boolean;
};
/**
 * Get visual feedback for drag state
 */
export function getDragFeedback(behavior: any, dropTarget: any): {
    allowed: boolean;
    cursor: string;
    highlight?: undefined;
    message?: undefined;
} | {
    allowed: boolean;
    cursor: string;
    highlight: string;
    message: string;
};
/**
 * Get components organized by type for sidebar
 */
export function getSidebarCategories(): {
    elements: {
        label: string;
        description: string;
        items: ({
            type: string;
            element: string;
            name: string;
        } | {
            type: string;
            attachTo: string;
            multiple: boolean;
            name: string;
        } | {
            type: string;
            trigger: string;
            target: any;
            template: string;
            name: string;
        } | {
            type: string;
            attachTo: string;
            builderOnly: boolean;
            name: string;
        })[];
    };
    containers: {
        label: string;
        description: string;
        items: ({
            type: string;
            element: string;
            name: string;
        } | {
            type: string;
            attachTo: string;
            multiple: boolean;
            name: string;
        } | {
            type: string;
            trigger: string;
            target: any;
            template: string;
            name: string;
        } | {
            type: string;
            attachTo: string;
            builderOnly: boolean;
            name: string;
        })[];
    };
    modifiers: {
        label: string;
        description: string;
        items: ({
            type: string;
            element: string;
            name: string;
        } | {
            type: string;
            attachTo: string;
            multiple: boolean;
            name: string;
        } | {
            type: string;
            trigger: string;
            target: any;
            template: string;
            name: string;
        } | {
            type: string;
            attachTo: string;
            builderOnly: boolean;
            name: string;
        })[];
    };
    actions: {
        label: string;
        description: string;
        items: ({
            type: string;
            element: string;
            name: string;
        } | {
            type: string;
            attachTo: string;
            multiple: boolean;
            name: string;
        } | {
            type: string;
            trigger: string;
            target: any;
            template: string;
            name: string;
        } | {
            type: string;
            attachTo: string;
            builderOnly: boolean;
            name: string;
        })[];
    };
};
declare namespace _default {
    export { handleSmartDrop };
    export { applyModifier };
    export { removeModifier };
    export { getDragFeedback };
    export { getSidebarCategories };
}
export default _default;
//# sourceMappingURL=builder-drop-handler.d.ts.map