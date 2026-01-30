/**
 * Builder Component Core
 * Core component creation, management, and canvas operations
 */
/**
 * Ensure drop zone is always the last element in a container
 * Call this after any operation that modifies the canvas
 */
declare function ensureDropZoneLast(containerId?: string): void;
/**
 * Ensure all section drop zones are last
 */
declare function ensureAllDropZonesLast(): void;
/**
 * Render component library sidebar
 */
declare function renderComponentLibrary(): void;
/**
 * Add component to canvas
 */
declare function addComponentToCanvas(componentType: any, section: any, customData?: any): void;
/**
 * Restore a component from saved data
 */
declare function restoreComponent(compData: any, template: any): void;
/**
 * Select component and scroll into view
 */
declare function selectComponent(element: any, componentType: any, template: any): void;
/**
 * Delete component
 */
declare function deleteComponent(id: any, event: any): void;
/**
 * Duplicate component
 */
declare function duplicateComponent(componentId: any): void;
/**
 * Move component up
 */
declare function moveComponentUp(componentId: any): void;
/**
 * Move component down
 */
declare function moveComponentDown(componentId: any): void;
/**
 * Update component count display
 */
declare function updateComponentCount(): void;
//# sourceMappingURL=builder-component-core.d.ts.map