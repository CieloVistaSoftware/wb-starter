/**
 * WBGrid Component
 * -----------------------------------------------------------------------------
 * Grid layout component.
 * 
 * Custom Tag: <wb-grid>
 * -----------------------------------------------------------------------------
 */
import { grid } from './layouts.js';

export class WBGrid extends HTMLElement {
  constructor() {
    super();
    this._cleanup = null;
  }

  connectedCallback() {
    const options = {
      columns: this.getAttribute('columns') || '3',
      gap: this.getAttribute('gap') || '1rem',
      minWidth: this.getAttribute('min-width') || ''
    };
    
    // Call the layout behavior
    this._cleanup = grid(this, options);
  }

  disconnectedCallback() {
    if (this._cleanup) {
      this._cleanup();
    }
  }
}

if (!customElements.get('wb-grid')) {
  customElements.define('wb-grid', WBGrid);
}
