/**
 * Simple repeater component for prototyping with templates.
 * - `<wb-repeater>` with items array or count for content duplication.
 */
export function cc() {}

export class WBRepeater extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.style.display = 'contents';
    this.render();
  }

  render() {
    const count = parseInt(this.getAttribute('count') || '0');
    const template = this.querySelector('template');
    
    if (!template) return;
    
    const content = template.innerHTML;
    let html = '';
    
    for (let i = 0; i < count; i++) {
        // Replace {{index}} with 1-based index, {{i}} with 0-based
        let itemHtml = content
            .replace(/{{index}}/g, i + 1)
            .replace(/{{i}}/g, i);
        html += itemHtml;
    }
    
    // Replace the specific repeater element's content with the repeated items
    // NOTE: This actually replaces the <wb-repeater> children!
    // But since the template is a child, it gets removed.
    // If we want to preserve the template for re-rendering (if count changes), we should hide it.
    
    this.innerHTML = html;
    
    // Scan for new behaviors in the injected content
    if (window.WB && window.WB.scan) {
        // Since WB.scan is async, we don't await here but it should run
        window.WB.scan(this);
    }
  }
}

// Export a dummy function for the WB behavior loader
// This allows WB.inject('repeater') to resolve successfully even if it's just a custom element.
export default function repeater(element) {
  // Logic is handled by Custom Element lifecycle.
  // We can force a render if needed, but connectedCallback should handle it.
  if (element.render) element.render();
  return () => {};
}

if (!customElements.get('wb-repeater')) {
  customElements.define('wb-repeater', WBRepeater);
}
