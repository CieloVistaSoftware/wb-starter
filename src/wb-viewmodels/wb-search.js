/**
 * WBSearch Component
 * ------------------------------------------------------------------------------
 * Custom Tag: <wb-search>
 * ------------------------------------------------------------------------------
 */
import { search } from './search.js';

export class WBSearch extends HTMLElement {
  constructor() {
    super();
    this._cleanup = null;
    this._search = null;
  }

  connectedCallback() {
    // Create an input element if one doesn't exist
    let input = this.querySelector('input');
    if (!input) {
      input = document.createElement('input');
      input.type = 'search';
      this.appendChild(input);
    }

    // Initialize the search behavior on the input
    this._search = search(input, {
      placeholder: this.getAttribute('placeholder') || 'Search...',
      value: this.getAttribute('value') || '',
      name: this.getAttribute('name') || '',
      debounce: parseInt(this.getAttribute('debounce') || '300'),
      instant: this.hasAttribute('instant'),
      disabled: this.hasAttribute('disabled'),
      size: this.getAttribute('size') || 'md',
      variant: this.getAttribute('variant') || 'default',
      icon: this.getAttribute('icon') || '🔍',
      clearable: this.getAttribute('clearable') !== 'false',
      loading: this.hasAttribute('loading'),
      ...this.dataset
    });

    this._cleanup = this._search.destroy;
  }

  disconnectedCallback() {
    if (this._cleanup) {
      this._cleanup();
    }
  }

  // Expose search methods
  get value() {
    return this._search ? this._search.getValue() : '';
  }

  set value(val) {
    if (this._search) {
      this._search.setValue(val);
    }
  }

  focus() {
    if (this._search) {
      this._search.focus();
    }
  }

  blur() {
    if (this._search) {
      this._search.blur();
    }
  }

  clear() {
    if (this._search) {
      this._search.clear();
    }
  }

  search() {
    if (this._search) {
      this._search.search();
    }
  }

  setLoading(loading) {
    if (this._search) {
      this._search.setLoading(loading);
    }
  }
}

// Only define if not already defined
if (!customElements.get('wb-search')) {
  customElements.define('wb-search', WBSearch);
}