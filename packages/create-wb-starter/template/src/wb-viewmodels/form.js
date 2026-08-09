// Standalone form behavior extracted from enhancements.js
export function form(element, options = {}) {
  // <wb-form> is a custom tag, not a real <form> — FormData/.action/.method/
  // .reset()/.requestSubmit() all require a genuine HTMLFormElement. Replace
  // it with a real <form> carrying the same attributes and children, same
  // approach as details.js wrapping non-<details> elements.
  let host = element;
  if (element.tagName === 'WB-FORM') {
    const formEl = document.createElement('form');
    Array.from(element.attributes).forEach((attr) => formEl.setAttribute(attr.name, attr.value));
    while (element.firstChild) formEl.appendChild(element.firstChild);
    element.replaceWith(formEl);
    host = formEl;
  }

  const config = {
    ajax: options.ajax ?? (host.hasAttribute('ajax') || host.hasAttribute('data-ajax')),
    validate: options.validate ?? host.getAttribute('validate') !== 'false',
    ...options
  };
  host.classList.add('wb-form');
  if (config.ajax) {
    host.onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(host);
      host.dispatchEvent(new CustomEvent('wb:form:submit', { bubbles: true, detail: { formData } }));
      try {
        const response = await fetch(host.action, {
          method: host.method || 'POST',
          body: formData
        });
        const data = await response.json();
        host.dispatchEvent(new CustomEvent('wb:form:success', { bubbles: true, detail: { data } }));
      } catch (error) {
        host.dispatchEvent(new CustomEvent('wb:form:error', { bubbles: true, detail: { error } }));
      }
    };
  }
  host.wbForm = {
    getData: () => Object.fromEntries(new FormData(host)),
    reset: () => host.reset(),
    submit: () => host.requestSubmit()
  };
  return () => host.classList.remove('wb-form');
}
