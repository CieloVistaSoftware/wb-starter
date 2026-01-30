/**
 * <wb-control>
 * -----------------------------------------------------------------------------
 * Wraps move behaviors in a consistent component.
 *
 * Custom Tag: <wb-control>
 * -----------------------------------------------------------------------------
 *
 * Usage: <wb-control action="move-up">↑</wb-control>
 */
export declare class WBControl extends HTMLElement {
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    getIcon(action: any): "?" | "↑" | "↓" | "→" | "←";
}
export default function control(element: any): () => void;
//# sourceMappingURL=wb-control.d.ts.map