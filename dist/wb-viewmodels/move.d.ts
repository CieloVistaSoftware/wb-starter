/**
 * Move Behaviors
 * -----------------------------------------------------------------------------
 * Swap elements in grid/list containers.
 * Exports: moveup, movedown, moveleft, moveright
 *
 * These behaviors attach click handlers to buttons that swap
 * their parent container with adjacent siblings.
 *
 * Helper Attributes: [x-move-up], [x-move-down], [x-move-left], [x-move-right]
 * -----------------------------------------------------------------------------
 */
/**
 * Move Up - Swap with element above (in grid) or previous sibling (in list)
 * Helper Attribute: [x-move-up]
 */
export declare function moveup(button: any): () => any;
/**
 * Move Down - Swap with element below (in grid) or next sibling (in list)
 * Helper Attribute: [x-move-down]
 */
export declare function movedown(button: any): () => any;
/**
 * Move Left - Swap with previous sibling
 * Helper Attribute: [x-move-left]
 */
export declare function moveleft(button: any): () => any;
/**
 * Helper Attribute: [x-move-right]
 * Move Right - Swap with next sibling
 */
export declare function moveright(button: any): () => any;
/**
 * Move All - Legacy pixel-based movement (kept for backwards compatibility)
 */
export declare function moveall(element: any, x?: number, y?: number): void;
declare const _default: {
    moveup: typeof moveup;
    movedown: typeof movedown;
    moveleft: typeof moveleft;
    moveright: typeof moveright;
    moveall: typeof moveall;
};
export default _default;
//# sourceMappingURL=move.d.ts.map