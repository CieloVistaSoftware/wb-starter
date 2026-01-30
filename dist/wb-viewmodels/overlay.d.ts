/**
 * Overlay Behaviors
 * -----------------------------------------------------------------------------
 * Full-screen or partial overlays like modals, drawers, and lightboxes.
 * Manages z-index, blocking backgrounds, and focus trapping.
 *
 * Custom Tag: <wb-overlay>
 * -----------------------------------------------------------------------------
 *
 * Usage:
 *   <wb-drawer  data-target="#menu">Open Menu</button>
 *   <a href="img.jpg" x-lightbox>View Image</a>
 * -----------------------------------------------------------------------------
 * All overlays show visual feedback when their trigger is clicked
 */
/**
 * Popover - Click-triggered popup
 * Custom Tag: <wb-popover>
 */
export declare function popover(element: any, options?: any): () => void;
/**
 * Drawer - Slide-out panel (works on button click)
 * Custom Tag: <wb-drawer>
 */
export declare function drawer(element: any, options?: any): () => void;
/**
 * Lightbox - Full-screen image viewer
 * Helper Attribute: [x-lightbox]
 */
export declare function lightbox(element: any, options?: any): () => any;
/**
 * Offcanvas - Off-canvas panel
 * Custom Tag: <wb-offcanvas>
 */
export declare function offcanvas(element: any, options?: any): () => void;
/**
 * Sheet - Notes panel from left side with resizable width
 * Custom Tag: <wb-sheet>
 */
export declare function sheet(element: any, options?: any): () => void;
/**
 * Helper Attribute: [x-confirm]
 * Confirm - Confirmation dialog
 */
export declare function confirm(element: any, options?: any): () => any;
/**
 * Helper Attribute: [x-prompt]
 * Prompt - Input prompt dialog
 */
export declare function prompt(element: any, options?: any): () => any;
declare const _default: {
    popover: typeof popover;
    drawer: typeof drawer;
    lightbox: typeof lightbox;
    offcanvas: typeof offcanvas;
    sheet: typeof sheet;
    confirm: typeof confirm;
    prompt: typeof prompt;
};
export default _default;
//# sourceMappingURL=overlay.d.ts.map