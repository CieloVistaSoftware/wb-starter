// Standalone label behavior extracted from enhancements.js
export function label(element, options = {}) {
  const config = {
    required: options.required ?? element.hasAttribute('data-required'),
    optional: options.optional ?? element.hasAttribute('data-optional'),
    ...options
  };
  element.classList.add('wb-label');
  if (config.required) element.classList.add('wb-label--required');
  if (config.optional) element.classList.add('wb-label--optional');
  return () => element.classList.remove('wb-label');
}
