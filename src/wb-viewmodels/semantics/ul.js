/**
 * UL - Enhanced <ul> element (Unordered List)
 * Adds styling variants, custom markers, spacing
 * Helper Attribute: [x-behavior="ul"]
 */
export function ul(element, options = {}) {
  if (element.tagName !== 'UL') {
    console.warn('[ul] Element must be a <ul>');
    return () => {};
  }

  const config = {
    variant: options.variant || element.dataset.variant || 'default',
    marker: options.marker || element.dataset.marker || 'disc',
    gap: options.gap || element.dataset.gap || '0.5rem',
    indentSize: options.indentSize || element.dataset.indentSize || '1.5rem',
    ...options
  };

  element.classList.add('wb-ul');

  // Apply variant
  element.classList.add(`wb-ul--${config.variant}`);

  // Base list styling
  element.style.listStyleType = config.marker;
  element.style.paddingLeft = config.indentSize;

  // Apply gap between items
  const items = element.querySelectorAll(':scope > li');
  items.forEach((li, index) => {
    li.classList.add('wb-ul__item');
    if (index < items.length - 1) {
      li.style.marginBottom = config.gap;
    }
  });

  // Variant-specific styling
  if (config.variant === 'checklist') {
    element.style.listStyleType = 'none';
    element.style.paddingLeft = '0';

    items.forEach(li => {
      li.style.display = 'flex';
      li.style.alignItems = 'start';
      li.style.gap = '0.5rem';

      const checkbox = document.createElement('span');
      checkbox.className = 'wb-ul__checkbox';
      checkbox.textContent = li.hasAttribute('data-checked') ? '✓' : '○';
      checkbox.style.color = li.hasAttribute('data-checked')
        ? 'var(--success, #22c55e)'
        : 'var(--text-secondary, #9ca3af)';
      checkbox.style.fontWeight = '700';
      checkbox.style.minWidth = '1rem';

      li.insertBefore(checkbox, li.firstChild);
    });
  } else if (config.variant === 'icon-list') {
    element.style.listStyleType = 'none';
    element.style.paddingLeft = '0';

    items.forEach(li => {
      li.style.display = 'flex';
      li.style.alignItems = 'start';
      li.style.gap = '0.5rem';

      const icon = document.createElement('span');
      icon.className = 'wb-ul__icon';
      icon.textContent = li.dataset.icon || '▸';
      icon.style.color = 'var(--primary, #6366f1)';
      icon.style.minWidth = '1rem';

      li.insertBefore(icon, li.firstChild);
    });
  } else if (config.variant === 'none') {
    element.style.listStyleType = 'none';
    element.style.paddingLeft = '0';
  }

  return () => {
    element.classList.remove('wb-ul', `wb-ul--${config.variant}`);
    items.forEach(li => {
      li.classList.remove('wb-ul__item');
      li.querySelector('.wb-ul__checkbox')?.remove();
      li.querySelector('.wb-ul__icon')?.remove();
    });
  };
}

export default { ul };
