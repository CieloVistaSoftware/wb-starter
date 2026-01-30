/**
 * WBRow Component
 * -----------------------------------------------------------------------------
 * Row layout component.
 *
 * Custom Tag: <wb-row>
 * -----------------------------------------------------------------------------
 */
import { flex } from './layouts.js';
export class WBRow extends HTMLElement {
    constructor() {
        super();
        this._cleanup = null;
    }
    connectedCallback() {
        const options = {
            direction: 'row',
            gap: this.getAttribute('gap') || '1rem',
            justify: this.getAttribute('justify') || 'flex-start',
            align: this.getAttribute('align') || 'stretch',
            wrap: this.getAttribute('wrap') || 'wrap'
        };
        // Call the layout behavior
        this._cleanup = flex(this, options);
    }
    disconnectedCallback() {
        if (this._cleanup) {
            this._cleanup();
        }
    }
}
if (!customElements.get('wb-row')) {
    customElements.define('wb-row', WBRow);
}
//# sourceMappingURL=wb-row.js.map