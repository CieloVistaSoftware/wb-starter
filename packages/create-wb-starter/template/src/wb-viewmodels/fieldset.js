// Standalone fieldset behavior extracted from enhancements.js
export function fieldset(element, options = {}) {
  const config = {
    collapsible: options.collapsible ?? element.hasAttribute('data-collapsible'),
    collapsed: options.collapsed ?? element.hasAttribute('data-collapsed'),
    ...options
  };
  element.classList.add('wb-fieldset');
  const legend = element.querySelector('legend');
  if (legend && config.collapsible) {
    legend.classList.add('wb-fieldset__legend', 'wb-fieldset__legend--collapsible');
    if (config.collapsed) element.classList.add('wb-fieldset--collapsed');
    legend.onclick = () => {
      element.classList.toggle('wb-fieldset--collapsed');
    };
  }
  return () => element.classList.remove('wb-fieldset');
}
