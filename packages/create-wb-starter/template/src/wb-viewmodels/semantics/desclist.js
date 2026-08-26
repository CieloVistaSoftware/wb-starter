import { readFlag, readAttr } from '../../core/read-attr.js';
/**
 * Description List Behavior
 * Populates a dl from data-items JSON
 * Helper Attribute: [x-behavior="desclist"]
 */
export function desclist(element, options = {}) {
  // Plain attributes are canonical (Law 11); data-* accepted for back-compat only.
  const config = {
    items: options.items || element.getAttribute('items') || readAttr(element, 'items') || '[]',
    horizontal: options.horizontal !== undefined ? options.horizontal :
      (element.hasAttribute('horizontal') || readFlag(element, 'horizontal')),
    ...options
  };

  let items = [];
  try {
    items = typeof config.items === 'string' ? JSON.parse(config.items) : config.items;
  } catch (e) {
    console.error('[desclist] Invalid JSON in data-items', e);
    return;
  }

  element.classList.add('x-dl');
  if (config.horizontal) {
    element.classList.add('x-dl--horizontal');
  }

  element.innerHTML = '';

  items.forEach(item => {
    const dt = document.createElement('dt');
    dt.textContent = item.term;
    
    const dd = document.createElement('dd');
    dd.textContent = item.desc;
    
    element.appendChild(dt);
    element.appendChild(dd);
  });

  // Add styles
  if (!document.getElementById('x-dl-style')) {
    const style = document.createElement('style');
    style.id = 'x-dl-style';
    style.textContent = `
      .x-dl { display: grid; gap: 0.5rem; }
      .x-dl dt { font-weight: 600; color: var(--text-primary); }
      .x-dl dd { margin: 0; color: var(--text-secondary); }
      
      .x-dl--horizontal {
        grid-template-columns: auto 1fr;
        align-items: baseline;
        gap: 0.5rem 2rem;
      }
      .x-dl--horizontal dt { text-align: right; }
    `;
    document.head.appendChild(style);
  }
}

export default desclist;
