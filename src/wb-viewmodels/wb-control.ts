import move from './move.js';

/**
 * <wb-control>
 * -----------------------------------------------------------------------------
 * Wraps move behaviors in a consistent component.
 * 
 * Custom Tag: <wb-control>
 * -----------------------------------------------------------------------------
 * 
 * Usage: <wb-control action="move-up">↑</wb-control>
 */
export class WBControl extends HTMLElement {
  constructor() {
    super();
    this._cleanup = null;
  }

  connectedCallback() {
    const action = this.getAttribute('action'); // e.g., 'move-up'
    
    // Add default styling class if not present
    this.classList.add('wb-control-btn');
    
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

if (!customElements.get('wb-control')) {
  customElements.define('wb-control', WBControl);
}

export default function control(element) {
    // Determine active element logic if needed
    return () => {};
}
