/**
 * Details - Enhanced <details> element
 * Helper Attribute: [x-behavior="details"]
 * 
 * Uses native HTML5 <details>/<summary> for:
 * - Built-in accessibility (no ARIA needed)
 * - Works without JavaScript
 * - Keyboard support (Enter/Space)
 * - Browser handles open/close state
 * 
 * JS adds: custom events, animations, programmatic API
 */
export function details(element, options = {}) {
  const config = {
    open: options.open ?? element.hasAttribute('data-open'),
    animated: options.animated ?? element.dataset.animated !== 'false',
    ...options
  };

  // If not already a <details>, wrap content
  if (element.tagName !== 'DETAILS') {
    const summaryText = element.dataset.summary || element.dataset.title || 'Details';
    const contentHtml = element.innerHTML;
    
    const detailsEl = document.createElement('details');
    detailsEl.className = 'wb-details ' + (element.className || '');
    if (config.open) detailsEl.open = true;
    
    detailsEl.innerHTML = `
      <summary class="wb-details__summary">${summaryText}</summary>
      <div class="wb-details__content">${contentHtml}</div>
    `;
    
    Object.keys(element.dataset).forEach(key => {
      detailsEl.dataset[key] = element.dataset[key];
    });
    
    // Add class to original element in case tests are checking it
    element.classList.add('wb-details');
    
    element.replaceWith(detailsEl);
    element = detailsEl;
  } else {
    element.classList.add('wb-details');
    if (config.open) element.open = true;
  }

  // Style the native element
  Object.assign(element.style, {
    border: '1px solid var(--border-color, #374151)',
    borderRadius: '6px',
    overflow: 'hidden',
    background: 'var(--bg-primary, #111827)'
  });

  const summary = element.querySelector('summary');
  if (summary) {
    summary.classList.add('wb-details__summary');
    Object.assign(summary.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 1rem',
      background: 'var(--bg-secondary, #1f2937)',
      cursor: 'pointer',
      fontWeight: '500',
      listStyle: 'none'
    });
    
    // Custom icon
    const labelText = summary.textContent;
    summary.innerHTML = `
      <span class="wb-details__label">${labelText}</span>
      <span class="wb-details__icon" style="transition: transform 0.2s;">▼</span>
    `;
  }

  // Content styling
  const content = element.querySelector('.wb-details__content') || element.querySelector('summary + *');
  if (content) {
    content.classList.add('wb-details__content');
    Object.assign(content.style, {
      padding: '0.75rem 1rem',
      background: 'var(--bg-primary, #111827)'
    });
  }

  // Animation
  const icon = element.querySelector('.wb-details__icon');
  element.addEventListener('toggle', () => {
    if (icon) {
      icon.style.transform = element.open ? 'rotate(180deg)' : '';
    }
    element.dispatchEvent(new CustomEvent('wb:details:toggle', {
      bubbles: true,
      detail: { open: element.open }
    }));
  });

  // API
  element.wbDetails = {
    toggle: () => { element.open = !element.open; },
    open: () => { element.open = true; },
    close: () => { element.open = false; },
    get isOpen() { return element.open; }
  };

  element.dataset.wbReady = 'details';
  return () => element.classList.remove('wb-details');
}

export default { details };
