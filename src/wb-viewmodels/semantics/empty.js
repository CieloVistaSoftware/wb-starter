import { readAttr } from '../../core/read-attr.js';
/**
 * Empty State Behavior
 * Renders an empty state placeholder
 * Helper Attribute: [x-behavior="empty"]
 */
export function empty(element, options = {}) {
  // Plain attributes are canonical (Law 11); data-* accepted for back-compat only.
  const config = {
    icon: options.icon || element.getAttribute('icon') || readAttr(element, 'icon') || '∅',
    message: options.message || element.getAttribute('message') || readAttr(element, 'message') || 'No data',
    description: options.description || element.getAttribute('description') || readAttr(element, 'description') || '',
    ...options
  };

  element.classList.add('x-empty');
  
  element.innerHTML = `
    <div class="x-empty__icon">${config.icon}</div>
    <h3 class="x-empty__message">${config.message}</h3>
    ${config.description ? `<div class="x-empty__description">${config.description}</div>` : ''}
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
  
  const icon = element.querySelector('.x-empty__icon');
  if (icon) {
    icon.style.fontSize = '3rem';
    icon.style.marginBottom = '1rem';
    icon.style.opacity = '0.5';
  }
  
  const msg = element.querySelector('.x-empty__message');
  if (msg) {
    msg.style.margin = '0 0 0.5rem 0';
    msg.style.color = 'var(--text-primary)';
    msg.style.fontSize = '1.125rem';
  }
  
  const desc = element.querySelector('.x-empty__description');
  if (desc) {
    desc.style.margin = '0';
    desc.style.fontSize = '0.875rem';
  }
}

export default empty;
