/**
 * Empty State Behavior
 * Renders an empty state placeholder
 * Helper Attribute: [x-behavior="empty"]
 */
export function empty(element, options = {}) {
  const config = {
    icon: options.icon || element.dataset.icon || '∅',
    message: options.message || element.dataset.message || 'No data',
    description: options.description || element.dataset.description || '',
    ...options
  };

  element.classList.add('wb-empty');
  
  element.innerHTML = `
    <div class="wb-empty__icon">${config.icon}</div>
    <h3 class="wb-empty__message">${config.message}</h3>
    ${config.description ? `<p class="wb-empty__description">${config.description}</p>` : ''}
  `;

  // Styles
  Object.assign(element.style, {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    background: 'var(--bg-secondary, rgba(0,0,0,0.02))',
    borderRadius: 'var(--radius-md, 8px)',
    border: '1px dashed var(--border-color, rgba(0,0,0,0.1))'
  });
  
  const icon = element.querySelector('.wb-empty__icon');
  if (icon) {
    icon.style.fontSize = '3rem';
    icon.style.marginBottom = '1rem';
    icon.style.opacity = '0.5';
  }
  
  const msg = element.querySelector('.wb-empty__message');
  if (msg) {
    msg.style.margin = '0 0 0.5rem 0';
    msg.style.color = 'var(--text-primary)';
    msg.style.fontSize = '1.125rem';
  }
  
  const desc = element.querySelector('.wb-empty__description');
  if (desc) {
    desc.style.margin = '0';
    desc.style.fontSize = '0.875rem';
  }
}

export default empty;
