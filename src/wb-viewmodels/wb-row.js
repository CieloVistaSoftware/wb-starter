/**
 * Row layout custom element for horizontal flex display.
 * - `<wb-row>` Web Component with gap and alignment options.
 */
export function cc() {}

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
