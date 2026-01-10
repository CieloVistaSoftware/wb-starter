/**
 * Inline Semantic Behaviors
 * =========================
 * Behaviors for inline semantic elements like <kbd> and <mark>
 */

/**
 * Kbd - Keyboard Input
 * Helper Attribute: [x-behavior="kbd"]
 */
export function kbd(element, options = {}) {
  element.classList.add('wb-kbd');
  
  // Basic styling if not in CSS
  if (!getComputedStyle(element).getPropertyValue('--wb-kbd-styled')) {
    Object.assign(element.style, {
      display: 'inline-block',
      padding: '0.15em 0.4em',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: '0.85em',
      lineHeight: '1',
      color: 'var(--text-primary, #374151)',
      verticalAlign: 'middle',
      backgroundColor: 'var(--bg-secondary, #f3f4f6)',
      border: '1px solid var(--border-color, #d1d5db)',
      borderRadius: '4px',
      boxShadow: '0 1px 0 rgba(0,0,0,0.1)',
    });
  }

  element.dataset.wbReady = 'kbd';
  return () => element.classList.remove('wb-kbd');
}

/**
 * Mark - Highlight text
 * Helper Attribute: [x-behavior="mark"]
 */
export function mark(element, options = {}) {
  const config = {
    color: options.color || element.dataset.color || 'yellow',
    ...options
  };

  element.classList.add('wb-mark');
  
  const colors = {
    yellow: '#fef08a',
    green: '#bbf7d0',
    blue: '#bfdbfe',
    red: '#fecaca',
    purple: '#e9d5ff'
  };

  // Basic styling
  Object.assign(element.style, {
    backgroundColor: colors[config.color] || config.color,
    color: 'inherit',
    padding: '0.1em 0.2em',
    borderRadius: '2px'
  });

  element.dataset.wbReady = 'mark';
  return () => element.classList.remove('wb-mark');
}

export default { kbd, mark };
