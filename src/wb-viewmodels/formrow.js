import { readFlag } from '../core/read-attr.js';
// Standalone formrow behavior extracted from enhancements.js
export function formrow(element, options = {}) {
  const config = {
    inline: options.inline ?? readFlag(element, 'inline'),
    ...options
  };
  element.classList.add('wb-form-row');
  if (config.inline) element.classList.add('wb-form-row--inline');
  return () => element.classList.remove('wb-form-row');
}
