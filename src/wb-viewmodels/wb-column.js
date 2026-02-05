/**
 * Column layout custom element for vertical stacking.
 * - `<wb-column>` Web Component with flexbox vertical direction.
 */
export function cc() {}

import { flex } from './layouts.js';

export class WBColumn extends HTMLElement {
  constructor() {
    super();
    this._cleanup = null;
  }

  connectedCallback() {
    const options = {
      direction: 'column',
      gap: this.getAttribute('gap') || '1rem',
      justify: this.getAttribute('justify') || 'flex-start',
      align: this.getAttribute('align') || 'stretch',
      wrap: this.getAttribute('wrap') || 'nowrap'
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

if (!customElements.get('wb-column')) {
  customElements.define('wb-column', WBColumn);
}
