/**
 * WBColumn Component
 * -----------------------------------------------------------------------------
 * Column layout component.
 * 
 * Custom Tag: <wb-column>
 * -----------------------------------------------------------------------------
 */
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
