/**
 * Divider — content separator.
 * TODO: Migrate inline styles to divider.css
 */
export function cc() {}

/**
 * Divider - Horizontal or vertical content dividers
 */
export function divider(element, options = {}) {
  const config = {
    text: options.text || element.dataset.text || '',
    vertical: options.vertical ?? element.hasAttribute('data-vertical'),
    ...options
  };

  element.classList.add('wb-divider');
  element.setAttribute('role', 'separator');

  if (config.vertical) {
    element.style.display = 'inline-block';
    element.style.width = '1px';
    element.style.height = '100%';
    element.style.minHeight = '1rem';
    element.style.background = 'var(--border-color, #374151)';
    element.style.margin = '0 0.5rem';
  } else {
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.gap = '0.75rem';
    element.style.margin = '0.75rem 0';
    element.style.color = 'var(--text-muted, #6b7280)';
    element.style.fontSize = '0.75rem';

    if (config.text) {
      element.innerHTML = `
        <span style="flex:1;height:1px;background:var(--border-color,#374151);"></span>
        <span>${config.text}</span>
        <span style="flex:1;height:1px;background:var(--border-color,#374151);"></span>
      `;
    } else {
      element.innerHTML = `<span style="flex:1;height:1px;background:var(--border-color,#374151);"></span>`;
    }
  }

  element.dataset.wbReady = 'divider';
  return () => element.classList.remove('wb-divider');
}

export default divider;
