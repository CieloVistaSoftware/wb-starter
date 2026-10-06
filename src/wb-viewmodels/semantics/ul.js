import { readFlag, readAttr } from '../../core/read-attr.js';
import { setRule, clearRules, onlyChanged } from '../../core/dynamic-style.js';
/**
 * UL - Enhanced <ul> element (Unordered List)
 * Adds styling variants, custom markers, spacing
 * Helper Attribute: [x-ul]
 */
export function ul(element, options = {}) {
  if (element.tagName !== 'UL') {
    console.warn('[ul] Element must be a <ul>');
    return () => {};
  }

  const config = {
    variant: options.variant || readAttr(element, 'variant') || 'default',
    marker: options.marker || readAttr(element, 'marker') || 'disc',
    gap: options.gap || readAttr(element, 'gap') || '0.5rem',
    indentSize: options.indentSize || readAttr(element, 'indentSize') || '1.5rem',
    ...options
  };

  element.classList.add('x-ul');

  // Apply variant
  element.classList.add(`x-ul--${config.variant}`);

  // #779: marker, indent, item gap and the checklist / icon-list / none
  // variants are .x-ul* rules in lists.css; the author's marker / indent /
  // gap travel as a generated rule (only when they differ from the defaults,
  // and never for the three variants that replace the marker and indent).
  const ownsMarker = ['checklist', 'icon-list', 'none'].includes(config.variant);
  setRule(element, 'list', onlyChanged({
    listStyleType: ownsMarker ? '' : config.marker,
    paddingLeft: ownsMarker ? '' : config.indentSize,
    '--x-ul-gap': config.gap,
  }, { listStyleType: 'disc', paddingLeft: '1.5rem', '--x-ul-gap': '0.5rem' }));

  // Gap between items: every item but the last (lists.css).
  const items = element.querySelectorAll(':scope > li');
  items.forEach((li, index) => {
    li.classList.add('x-ul__item');
    if (index < items.length - 1) li.classList.add('x-ul__item--spaced');
  });

  // Variant-specific markup
  if (config.variant === 'checklist') {
    items.forEach(li => {
      const checked = readFlag(li, 'checked');
      const checkbox = document.createElement('span');
      checkbox.className = `x-ul__checkbox${checked ? ' x-ul__checkbox--checked' : ''}`;
      checkbox.textContent = checked ? '✓' : '○';
      li.insertBefore(checkbox, li.firstChild);
    });
  } else if (config.variant === 'icon-list') {
    items.forEach(li => {
      const icon = document.createElement('span');
      icon.className = 'x-ul__icon';
      icon.textContent = readAttr(li, 'icon') || '▸';
      li.insertBefore(icon, li.firstChild);
    });
  }

  return () => {
    clearRules(element);
    element.classList.remove('x-ul', `x-ul--${config.variant}`);
    items.forEach(li => {
      li.classList.remove('x-ul__item', 'x-ul__item--spaced');
      li.querySelector('.x-ul__checkbox')?.remove();
      li.querySelector('.x-ul__icon')?.remove();
    });
  };
}

export default { ul };
