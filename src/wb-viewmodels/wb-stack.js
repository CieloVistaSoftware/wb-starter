/**
 * Stack layout custom element for vertical spacing.
 * - `<wb-stack>` Web Component with configurable gap.
 */
export function cc() {}

import { stack } from './layouts.js';

export class WBStack extends HTMLElement {
  constructor() {
    super();
    this._cleanup = null;
  }

  connectedCallback() {
    const options = {
      gap: this.getAttribute('gap') || '1rem'
    };
    
    // Call the layout behavior
    this._cleanup = stack(this, options);
  }

  disconnectedCallback() {
    if (this._cleanup) {
      this._cleanup();
    }
  }
}

if (!customElements.get('wb-stack')) {
  customElements.define('wb-stack', WBStack);
}
