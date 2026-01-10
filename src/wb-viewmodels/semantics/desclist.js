/**
 * Description List Behavior
 * Populates a dl from data-items JSON
 * Helper Attribute: [x-behavior="desclist"]
 */
export function desclist(element, options = {}) {
  const config = {
    items: options.items || element.dataset.items || '[]',
    horizontal: options.horizontal !== undefined ? options.horizontal : element.hasAttribute('data-horizontal'),
    ...options
  };

  let items = [];
  try {
    items = typeof config.items === 'string' ? JSON.parse(config.items) : config.items;
  } catch (e) {
    console.error('[desclist] Invalid JSON in data-items', e);
    return;
  }

  element.classList.add('wb-dl');
  if (config.horizontal) {
    element.classList.add('wb-dl--horizontal');
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
  if (!document.getElementById('wb-dl-style')) {
    const style = document.createElement('style');
    style.id = 'wb-dl-style';
    style.textContent = `
      .wb-dl { display: grid; gap: 0.5rem; }
      .wb-dl dt { font-weight: 600; color: var(--text-primary); }
      .wb-dl dd { margin: 0; color: var(--text-secondary); }
      
      .wb-dl--horizontal {
        grid-template-columns: auto 1fr;
        align-items: baseline;
        gap: 0.5rem 2rem;
      }
      .wb-dl--horizontal dt { text-align: right; }
    `;
    document.head.appendChild(style);
  }
}

export default desclist;
