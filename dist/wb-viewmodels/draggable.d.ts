/**
 * Draggable Behavior
 * Helper Attribute: [x-draggable]
 */
export interface DraggableOptions {
    handle?: string;
    axis?: "x" | "y" | "both";
    bounds?: string;
    grid?: number;
}
export interface DraggableAPI {
    setPosition: (x: number, y: number) => void;
    getPosition: () => {
        x: number;
        y: number;
    };
}
declare global {
    interface HTMLElement {
        wbDraggable?: DraggableAPI;
    }
}
export declare function draggable(element: HTMLElement, options?: DraggableOptions): () => void;
export default draggable;
//# sourceMappingURL=draggable.d.ts.map