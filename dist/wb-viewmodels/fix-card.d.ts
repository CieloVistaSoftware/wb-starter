import { WBCard } from './wb-card.js';
/**
 * Fix Card Component
 * -----------------------------------------------------------------------------
 * Special card for displaying fix details.
 *
 * Custom Tag: <wb-fix-card>
 * -----------------------------------------------------------------------------
 */
export declare class WBFixCard extends WBCard {
    constructor();
    set data(fix: any);
    connectedCallback(): void;
    escapeHtml(unsafe: any): any;
    getLanguage(fix: any): "html" | "css" | "json" | "js";
    render(): void;
}
//# sourceMappingURL=fix-card.d.ts.map