// Standalone form behavior extracted from enhancements.js
export function form(element, options = {}) {
  const config = {
    ajax: options.ajax ?? element.hasAttribute('data-ajax'),
    validate: options.validate ?? element.getAttribute('validate') !== 'false',
    ...options
  };
  element.classList.add('wb-form');
  if (config.ajax) {
    element.onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(element);
      element.dispatchEvent(new CustomEvent('wb:form:submit', { bubbles: true, detail: { formData } }));
      try {
        const response = await fetch(element.action, {
          method: element.method || 'POST',
          body: formData
        });
        const data = await response.json();
        element.dispatchEvent(new CustomEvent('wb:form:success', { bubbles: true, detail: { data } }));
      } catch (error) {
        element.dispatchEvent(new CustomEvent('wb:form:error', { bubbles: true, detail: { error } }));
      }
    };
  }
  element.wbForm = {
    getData: () => Object.fromEntries(new FormData(element)),
    reset: () => element.reset(),
    submit: () => element.requestSubmit()
  };
  return () => element.classList.remove('wb-form');
}
