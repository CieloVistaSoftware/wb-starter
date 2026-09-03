import { readFlag } from '../core/read-attr.js';
// Standalone form behavior extracted from enhancements.js
export function form(element, options = {}) {
  // The <wb-form> replacement branch is gone (#927). It rebuilt the host as a
  // real <form> when `element.tagName === 'WB-FORM'` -- a tag that cannot
  // exist since 4.0.0 removed custom elements (#919, #921 cleared the last of
  // them), so the branch was unreachable and implied `wb-*` tags were still
  // real. The behavior now enhances whatever host it is given, which for a
  // <form> is already a genuine HTMLFormElement.
  const host = element;

  const config = {
    ajax: options.ajax ?? (host.hasAttribute('ajax') || readFlag(host, 'ajax')),
    validate: options.validate ?? host.getAttribute('validate') !== 'false',
    ...options
  };
  host.classList.add('x-form');
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
  return () => host.classList.remove('x-form');
}
