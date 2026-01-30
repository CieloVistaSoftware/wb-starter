/**
 * WB Repeater Component
 * -----------------------------------------------------------------------------
 * Simple repeater for prototyping.
 *
 * Custom Tag: <wb-repeater>
 * -----------------------------------------------------------------------------
 *
 * Usage:
 * <wb-repeater items=["S","k","l"] count="N">
 *   <template>Content {{index}}</template>
 * </wb-repeater>
 */
export declare class WBRepeater extends HTMLElement {
    constructor();
    connectedCallback(): void;
    render(): void;
}
export default function repeater(element: any): () => void;
//# sourceMappingURL=wb-repeater.d.ts.map