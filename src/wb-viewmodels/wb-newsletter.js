/**
 * WBNewsletter Component
 * -----------------------------------------------------------------------------
 * Newsletter signup form component with email input and subscribe button.
 * 
 * Custom Tag: <wb-newsletter>
 * 
 * Attributes:
 *   heading       - Heading text (default: "Subscribe to our newsletter")
 *   placeholder - Email input placeholder (default: "your@email.com")
 *   button-text - Subscribe button text (default: "Subscribe")
 *   variant     - Visual variant: default, compact, inline, card (default: "default")
 *   action      - Form action URL (optional)
 *   success-msg - Success message after submit (default: "Thanks for subscribing!")
 * 
 * Events:
 *   wb-newsletter:submit - Fired when form is submitted with { email } detail
 * 
 * Example:
 *   <wb-newsletter 
 *     heading="Stay Updated"
 *     placeholder="Enter your email"
 *     button-text="Join Now"
 *     variant="card">
 *   </wb-newsletter>
 * -----------------------------------------------------------------------------
 */

export class WBNewsletter extends HTMLElement {
  constructor() {
    super();
    this._cleanup = null;
    this._form = null;
    this._input = null;
    this._button = null;
    this._message = null;
  }

  static get observedAttributes() {
    return ['data-title', 'data-placeholder', 'data-button-text', 'data-variant', 'data-action', 'data-success-msg'];
  }

  connectedCallback() {
    this._buildStructure();
    this._attachEventListeners();
  }

  disconnectedCallback() {
    if (this._cleanup) {
      this._cleanup();
      this._cleanup = null;
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this._form) {
      this._updateFromAttributes();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────────────────────

  _getOptions() {
    return {
      title: this.getAttribute('data-title') || this.dataset.title || 'Subscribe to our newsletter',
      placeholder: this.getAttribute('data-placeholder') || this.dataset.placeholder || 'your@email.com',
      buttonText: this.getAttribute('data-button-text') || this.dataset.buttonText || 'Subscribe',
      variant: this.getAttribute('data-variant') || this.dataset.variant || 'default',
      action: this.getAttribute('data-action') || this.dataset.action || '',
      successMsg: this.getAttribute('data-success-msg') || this.dataset.successMsg || 'Thanks for subscribing!'
    };
  }

  _buildStructure() {
    const options = this._getOptions();
    
    // Apply variant class
    this.classList.add('wb-newsletter');
    this.classList.add(`wb-newsletter--${options.variant}`);

    // Build HTML structure
    this.innerHTML = `
      <div class="wb-newsletter__container">
        ${options.title ? `<h3 class="wb-newsletter__title">${this._escapeHtml(options.title)}</h3>` : ''}
        <form class="wb-newsletter__form" ${options.action ? `action="${this._escapeHtml(options.action)}"` : ''} method="post">
          <div class="wb-newsletter__input-group">
            <input 
              type="email" 
              class="wb-newsletter__input" 
              placeholder="${this._escapeHtml(options.placeholder)}"
              required
              aria-label="Email address"
            />
            <button type="submit" class="wb-newsletter__button btn btn-primary">
              ${this._escapeHtml(options.buttonText)}
            </button>
          </div>
          <p class="wb-newsletter__message" aria-live="polite"></p>
        </form>
      </div>
    `;

    // Cache element references
    this._form = this.querySelector('.wb-newsletter__form');
    this._input = this.querySelector('.wb-newsletter__input');
    this._button = this.querySelector('.wb-newsletter__button');
    this._message = this.querySelector('.wb-newsletter__message');

    // Apply inline styles for layout
    this._applyStyles();
  }

  _applyStyles() {
    const options = this._getOptions();

    // Container styles
    const container = this.querySelector('.wb-newsletter__container');
    if (container) {
      container.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 1rem;
        ${options.variant === 'card' ? 'background: var(--bg-secondary, #f8f9fa); padding: 2rem; border-radius: 0.5rem;' : ''}
      `;
    }

    // Title styles
    const title = this.querySelector('.wb-newsletter__title');
    if (title) {
      title.style.cssText = `
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        ${options.variant === 'inline' ? 'display: inline; margin-right: 1rem;' : ''}
      `;
    }

    // Form styles
    if (this._form) {
      this._form.style.cssText = `
        display: flex;
        flex-direction: ${options.variant === 'inline' ? 'row' : 'column'};
        gap: 0.75rem;
        ${options.variant === 'inline' ? 'align-items: center;' : ''}
      `;
    }

    // Input group styles
    const inputGroup = this.querySelector('.wb-newsletter__input-group');
    if (inputGroup) {
      inputGroup.style.cssText = `
        display: flex;
        gap: 0.5rem;
        ${options.variant === 'compact' ? 'flex-direction: column;' : 'flex-direction: row;'}
        width: 100%;
        max-width: ${options.variant === 'inline' ? '400px' : '100%'};
      `;
    }

    // Input styles
    if (this._input) {
      this._input.style.cssText = `
        flex: 1;
        padding: 0.75rem 1rem;
        border: 1px solid var(--border-color, #ddd);
        border-radius: 0.375rem;
        font-size: 1rem;
        min-width: 200px;
      `;
    }

    // Button styles
    if (this._button) {
      this._button.style.cssText = `
        padding: 0.75rem 1.5rem;
        white-space: nowrap;
        ${options.variant === 'compact' ? 'width: 100%;' : ''}
      `;
    }

    // Message styles
    if (this._message) {
      this._message.style.cssText = `
        margin: 0;
        font-size: 0.875rem;
        min-height: 1.25rem;
      `;
    }
  }

  _attachEventListeners() {
    if (!this._form) return;

    const handleSubmit = (e) => {
      e.preventDefault();
      this._handleSubmit();
    };

    this._form.addEventListener('submit', handleSubmit);

    // Cleanup function
    this._cleanup = () => {
      this._form?.removeEventListener('submit', handleSubmit);
    };
  }

  _handleSubmit() {
    const options = this._getOptions();
    const email = this._input?.value?.trim();

    if (!email || !this._isValidEmail(email)) {
      this._showMessage('Please enter a valid email address.', 'error');
      return;
    }

    // Disable form during submission
    this._setLoading(true);

    // Dispatch custom event for parent components to handle
    const event = new CustomEvent('wb-newsletter:submit', {
      bubbles: true,
      composed: true,
      detail: { email }
    });
    this.dispatchEvent(event);

    // If there's an action URL, let the form submit naturally
    // Otherwise, show success message after a brief delay (simulated)
    if (options.action) {
      this._form.submit();
    } else {
      // Simulate API call
      setTimeout(() => {
        this._showMessage(options.successMsg, 'success');
        this._input.value = '';
        this._setLoading(false);
      }, 500);
    }
  }

  _showMessage(text, type = 'info') {
    if (!this._message) return;
    
    this._message.textContent = text;
    this._message.style.color = type === 'error' 
      ? 'var(--color-error, #dc3545)' 
      : type === 'success' 
        ? 'var(--color-success, #28a745)' 
        : 'inherit';
  }

  _setLoading(isLoading) {
    if (this._button) {
      this._button.disabled = isLoading;
      this._button.textContent = isLoading 
        ? 'Subscribing...' 
        : this._getOptions().buttonText;
    }
    if (this._input) {
      this._input.disabled = isLoading;
    }
  }

  _isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  _updateFromAttributes() {
    // Rebuild structure when attributes change
    this.innerHTML = '';
    this._buildStructure();
    this._attachEventListeners();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Reset the form
   */
  reset() {
    if (this._form) {
      this._form.reset();
    }
    if (this._message) {
      this._message.textContent = '';
    }
  }

  /**
   * Get current email value
   */
  get email() {
    return this._input?.value || '';
  }

  /**
   * Set email value
   */
  set email(value) {
    if (this._input) {
      this._input.value = value;
    }
  }
}

// Register the custom element
if (!customElements.get('wb-newsletter')) {
  customElements.define('wb-newsletter', WBNewsletter);
}
