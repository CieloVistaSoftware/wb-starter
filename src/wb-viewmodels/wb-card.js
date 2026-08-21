import { readAttr } from '../core/read-attr.js';
/**
 * WBCard Component
 * -----------------------------------------------------------------------------
 * Custom Tag: <wb-card>
 * -----------------------------------------------------------------------------
 */
import { composeCard } from './card.js';

export class WBCard extends HTMLElement {
  constructor() {
    super();
    this._cleanup = null;
    this._base = null;
  }

  connectedCallback() {
    // Initialize the card behavior
    // We pass 'this' as the element
    this._base = composeCard(this, {
      ...this.dataset,
      behavior: this.getAttribute('behavior') || 'card',
      variant: this.getAttribute('variant') || 'default',
      title: this.getAttribute('title') || readAttr(this, 'title'),
      subtitle: this.getAttribute('subtitle') || readAttr(this, 'subtitle'),
      footer: this.getAttribute('footer') || readAttr(this, 'footer'),
    });

    // If the subclass hasn't already built the structure, we can do it here
    // But usually subclasses will want to control the build
    if (this.constructor.name === 'WBCard') {
      this._base.buildStructure();
    }
    
    this._cleanup = this._base.cleanup;
  }

  disconnectedCallback() {
    if (this._cleanup) {
      this._cleanup();
    }
  }

  // Expose base methods for subclasses
  get card() {
    return this._base;
  }
}

// Only define if not already defined
if (!customElements.get('wb-card')) {
  customElements.define('wb-card', WBCard);
}
