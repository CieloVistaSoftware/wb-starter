/**
 * Cluster layout custom element for horizontal flow.
 * - `<wb-cluster>` Web Component with gap and alignment options.
 */
export function cc() {}

import { cluster } from './layouts.js';

export class WBCluster extends HTMLElement {
  constructor() {
    super();
    this._cleanup = null;
  }

  connectedCallback() {
    const options = {
      gap: this.getAttribute('gap') || '1rem',
      justify: this.getAttribute('justify') || 'flex-start',
      align: this.getAttribute('align') || 'center'
    };
    
    // Call the layout behavior
    this._cleanup = cluster(this, options);
  }

  disconnectedCallback() {
    if (this._cleanup) {
      this._cleanup();
    }
  }
}

if (!customElements.get('wb-cluster')) {
  customElements.define('wb-cluster', WBCluster);
}
