/**
 * WB Newsletter Component
 * Newsletter signup form with email input and subscribe button
 * 
 * Attributes:
 * - data-title: Form title
 * - data-placeholder: Email placeholder text
 * - data-button-text: Subscribe button text
 * - data-variant: default | compact | inline | card
 * - data-action: Form action URL (optional)
 */

export class WBNewsletter extends HTMLElement {
  static get observedAttributes() {
    return ['data-title', 'data-placeholder', 'data-button-text', 'data-variant', 'data-action'];
  }

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  get title() {
    return this.getAttribute('data-title') || 'Subscribe to our newsletter';
  }

  get placeholder() {
    return this.getAttribute('data-placeholder') || 'your@email.com';
  }

  get buttonText() {
    return this.getAttribute('data-button-text') || 'Subscribe';
  }

  get variant() {
    return this.getAttribute('data-variant') || 'default';
  }

  get action() {
    return this.getAttribute('data-action') || '';
  }

  render() {
    const variantClass = `wb-newsletter--${this.variant}`;
    
    this.className = `wb-newsletter ${variantClass}`;
    
    this.innerHTML = `
      <div class="wb-newsletter__inner">
        ${this.variant !== 'inline' ? `<h3 class="wb-newsletter__title">${this.title}</h3>` : ''}
        <form class="wb-newsletter__form" ${this.action ? `action="${this.action}"` : ''} method="post">
          <input 
            type="email" 
            class="wb-newsletter__input" 
            placeholder="${this.placeholder}" 
            required
            aria-label="Email address"
          >
          <button type="submit" class="wb-newsletter__button">${this.buttonText}</button>
        </form>
      </div>
    `;

    // Add form submit handler
    const form = this.querySelector('form');
    form.addEventListener('submit', (e) => {
      if (!this.action) {
        e.preventDefault();
        this.dispatchEvent(new CustomEvent('wb-subscribe', {
          bubbles: true,
          detail: { email: this.querySelector('input').value }
        }));
      }
    });
  }
}

// Register the component
if (!customElements.get('wb-newsletter')) {
  customElements.define('wb-newsletter', WBNewsletter);
}
