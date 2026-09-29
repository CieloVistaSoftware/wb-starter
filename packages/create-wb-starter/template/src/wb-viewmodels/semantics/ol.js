import { readAttr } from '../../core/read-attr.js';
import { setRule, clearRules, onlyChanged } from '../../core/dynamic-style.js';
/**
 * OL - Enhanced <ol> element (Ordered List)
 * Adds numbering styles, custom start, variants
 * Helper Attribute: [x-behavior="ol"]
 */
export function ol(element, options = {}) {
  if (element.tagName !== 'OL') {
    console.warn('[ol] Element must be an <ol>');
    return () => {};
  }

  const config = {
    variant: options.variant || readAttr(element, 'variant') || 'default',
    numberType: options.numberType || readAttr(element, 'numberType') || 'decimal',
    gap: options.gap || readAttr(element, 'gap') || '0.5rem',
    indentSize: options.indentSize || readAttr(element, 'indentSize') || '1.5rem',
    start: options.start || readAttr(element, 'start') || element.start || 1,
    ...options
  };

  element.classList.add('x-ol');

  // Apply variant
  element.classList.add(`x-ol--${config.variant}`);

  // Base list styling
  // #779: numbering, indent, item gap and the stepped / timeline variants
  // are .x-ol* rules in lists.css. The author's number type / indent / gap
  // (and the stepped counter's start) travel as generated rules.
  const ownsMarker = ['stepped', 'timeline'].includes(config.variant);
  setRule(element, 'list', onlyChanged({
    listStyleType: ownsMarker ? '' : config.numberType,
    paddingLeft: ownsMarker ? '' : config.indentSize,
    counterReset: config.variant === 'stepped' ? `x-step ${config.start - 1}` : '',
    '--x-ol-gap': config.gap,
  }, { listStyleType: 'decimal', paddingLeft: '1.5rem', '--x-ol-gap': '0.5rem' }));

  if (config.start !== 1) {
    element.start = config.start;
  }

  const items = element.querySelectorAll(':scope > li');
  items.forEach((li, index) => {
    li.classList.add('x-ol__item');
    if (index < items.length - 1) li.classList.add('x-ol__item--spaced');
  });

  if (config.variant === 'stepped') {
    items.forEach((li, index) => {
      const stepNumber = document.createElement('span');
      stepNumber.className = 'x-ol__step-number';
      stepNumber.textContent = `${parseInt(config.start) + index}`;
      li.insertBefore(stepNumber, li.firstChild);
    });
  } else if (config.variant === 'timeline') {
    items.forEach(li => {
      const marker = document.createElement('span');
      marker.className = 'x-ol__timeline-marker';
      li.insertBefore(marker, li.firstChild);
    });
  }

  return () => {
    clearRules(element);
    element.classList.remove('x-ol', `x-ol--${config.variant}`);
    items.forEach(li => {
      li.classList.remove('x-ol__item', 'x-ol__item--spaced');
      li.querySelector('.x-ol__step-number')?.remove();
      li.querySelector('.x-ol__timeline-marker')?.remove();
    });
  };
}

export default { ol };
