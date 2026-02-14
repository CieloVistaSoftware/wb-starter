/**
 * WBDemo Component
 * -----------------------------------------------------------------------------
 * Custom Tag: <wb-demo>
 * Must be registered BEFORE wb-card so innerHTML is still raw at
 * connectedCallback time.
 * -----------------------------------------------------------------------------
 */
import { demo } from './demo.js';

export class WBDemo extends HTMLElement {
  constructor() {
    super();
    this._cleanup = null;
  }

  connectedCallback() {
    // Children haven't upgraded yet — innerHTML is raw
    this._rawSource = this.innerHTML;

    this._cleanup = demo(this, {
      title: this.getAttribute('title'),
      tag: this.getAttribute('tag'),
      columns: this.getAttribute('columns'),
      contentClass: this.getAttribute('content-class')
    });
  }

  disconnectedCallback() {
    if (this._cleanup) {
      this._cleanup();
    }
  }
}

if (!customElements.get('wb-demo')) {
  customElements.define('wb-demo', WBDemo);
}
