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
    // _cleanup may hold the Promise from an async WB.inject() (truthy but not
    // callable) — only invoke it when it's actually a function, or every
    // navigation throws "this._cleanup is not a function". (#174)
    if (typeof this._cleanup === 'function') {
      this._cleanup();
    }
  }
}

if (!customElements.get('wb-demo')) {
  customElements.define('wb-demo', WBDemo);
}
