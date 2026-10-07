import { readFlag } from '../core/read-attr.js';
// Standalone formrow behavior extracted from enhancements.js
export function formrow(element, options = {}) {
  const config = {
    inline: options.inline ?? readFlag(element, 'inline'),
    ...options
  };
  element.classList.add('x-formrow');
  if (config.inline) element.classList.add('x-formrow--inline');
  return () => element.classList.remove('x-formrow');
}
