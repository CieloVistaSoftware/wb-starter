import move from './move.js';

/**
 * <div x-control>
 * -----------------------------------------------------------------------------
 * Wraps move behaviors in a consistent behavior.
 * 
 * Custom Tag: <div x-control>
 * -----------------------------------------------------------------------------
 * 
 * Usage: <div x-control action="move-up">↑</div>
 */
export class WBControl extends HTMLElement {
  constructor() {
    super();
    this._cleanup = null;
  }

  connectedCallback() {
    const action = this.getAttribute('action'); // e.g., 'move-up'
    
    // Add default styling class if not present
    this.classList.add('x-control-btn');
    
    // Default content if empty
    if (!this.innerHTML.trim()) {
      this.textContent = this.getIcon(action);
    }

    // Map attribute 'move-up' to function name 'moveup'
    const funcName = action ? action.replace(/-/g, '') : null;
    
    if (funcName && move[funcName]) {
      this._cleanup = move[funcName](this);
    }
    
    // Accessibility
    this.setAttribute('role', 'button');
    this.setAttribute('tabindex', '0');
    
    // Add keydown handler for Enter/Space
    this.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.click();
        }
    });
  }

  disconnectedCallback() {
    if (this._cleanup) {
      this._cleanup();
    }
  }

  getIcon(action) {
    switch(action) {
        case 'move-up': return '↑';
        case 'move-down': return '↓';
        case 'move-left': return '←';
        case 'move-right': return '→';
        default: return '?';
    }
  }
}

if (!customElements.get('x-control')) {
  customElements.define('x-control', WBControl);
}

export default function control(element) {
    // WBControl's own connectedCallback (registered separately via
    // customElements.define(), not through this elementMap-dispatched
    // function) already adds 'x-control-btn' for its own styling. This
    // function is what schema-driven compliance checks look up by
    // behavior name, so add the schema's declared baseClass here too --
    // additive, harmless alongside 'x-control-btn'.
    element.classList.add('x-control');
    return () => {};
}
