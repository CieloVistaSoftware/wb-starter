import { readFlag } from '../core/read-attr.js';
/**
 * Form - enhanced <form>: AJAX submit, success/error message, validation on
 * blur, loading state, auto-save.
 *
 * #751: this file used to be a 41-line stub. The working version -- success
 * message, wb:form:success, loading state -- was written into
 * packages/create-wb-starter/template/src/wb-viewmodels/semantics/form.js,
 * which no runtime loads (index.js maps `form` to THIS file), so the
 * form · ajax example never told the reader anything and #751 was closed on
 * code that never ran. Ported here; the message and invalid states are
 * classes in form.css, not the inline cssText the orphan wrote (#779).
 */
export function form(element, options = {}) {
  // The <wb-form> replacement branch is gone (#927). It rebuilt the host as a
  // real <form> when `element.tagName === 'WB-FORM'` -- a tag that cannot
  // exist since 4.0.0 removed custom elements (#919, #921 cleared the last of
  // them), so the branch was unreachable and implied `wb-*` tags were still
  // real. The behavior now enhances whatever host it is given, which for a
  // <form> is already a genuine HTMLFormElement.
  const host = element;
  const text = (name, fallback) => host.getAttribute(name) || fallback;
  const formData = () => new FormData(host);

  const config = {
    ajax: options.ajax ?? (host.hasAttribute('ajax') && readFlag(host, 'ajax', true)),
    validate: options.validate ?? (host.hasAttribute('validate') && readFlag(host, 'validate', true)),
    autoSave: options.autoSave ?? (host.hasAttribute('auto-save') && readFlag(host, 'auto-save', true)),
    // HTML lowercases attribute names, so successMessage="…" arrives as
    // successmessage; the kebab spelling is what the docs teach.
    successMessage: options.successMessage || text('success-message', text('successmessage', 'Sent.')),
    errorMessage: options.errorMessage || text('error-message', text('errormessage', 'Could not send. Please try again.')),
    loadingText: options.loadingText || text('loading-text', 'Sending…'),
    ...options
  };
  host.classList.add('x-form');

  const submitBtn = host.querySelector('[type="submit"]');
  const idleLabel = submitBtn ? submitBtn.textContent : '';
  let hideTimer = 0;

  const setLoading = (loading) => {
    host.classList.toggle('x-form--loading', loading);
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? config.loadingText : idleLabel;
  };

  // role=status so a screen reader hears the outcome the sighted reader sees.
  const showMessage = (type, message) => {
    let msg = host.querySelector(':scope > .x-form__message');
    if (!msg) {
      msg = document.createElement('div');
      msg.setAttribute('role', 'status');
      host.prepend(msg);
    }
    msg.className = `x-form__message x-form__message--${type}`;
    msg.textContent = message;
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => msg.remove(), 5000);
  };

  // Validate on blur and on submit, never per keystroke (#751 point 2).
  const onBlur = (e) => {
    const field = e.target;
    if (!field.matches || !field.matches('input, select, textarea')) return;
    field.classList.toggle('x-form__field--invalid', !field.checkValidity());
  };
  if (config.validate) host.addEventListener('focusout', onBlur);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (config.validate && !host.checkValidity()) {
      host.reportValidity();
      return;
    }
    const body = formData();
    host.dispatchEvent(new CustomEvent('wb:form:submit', { bubbles: true, detail: { formData: body } }));
    setLoading(true);
    try {
      // The ATTRIBUTE, not host.method: the property reads "get" when no
      // method= is written, and fetch() refuses a GET with a body -- every
      // send threw before a request left the page.
      const response = await fetch(host.getAttribute('action') || window.location.href, {
        method: (host.getAttribute('method') || 'POST').toUpperCase(),
        body
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const data = await response.json().catch(() => null);
      showMessage('success', config.successMessage);
      host.dispatchEvent(new CustomEvent('wb:form:success', { bubbles: true, detail: { data } }));
      if (!config.autoSave) host.reset();
    } catch (error) {
      showMessage('error', config.errorMessage);
      host.dispatchEvent(new CustomEvent('wb:form:error', { bubbles: true, detail: { error } }));
    } finally {
      setLoading(false);
    }
  };
  if (config.ajax) host.addEventListener('submit', onSubmit);

  const saveKey = `x-form-${host.id || host.getAttribute('name') || 'default'}`;
  const onInput = () => {
    try { localStorage.setItem(saveKey, JSON.stringify(Object.fromEntries(formData()))); } catch { /* storage may be blocked */ }
  };
  if (config.autoSave) {
    try {
      const saved = JSON.parse(localStorage.getItem(saveKey) || 'null');
      if (saved) {
        for (const [name, value] of Object.entries(saved)) {
          const field = host.elements.namedItem(name);
          if (field && 'value' in field) field.value = value;
        }
      }
    } catch { /* a corrupt or blocked store restores nothing */ }
    host.addEventListener('input', onInput);
  }

  host.wbForm = {
    getData: () => Object.fromEntries(formData()),
    reset: () => host.reset(),
    submit: () => host.requestSubmit(),
    validate: () => host.checkValidity(),
    setLoading,
    showMessage
  };

  return () => {
    clearTimeout(hideTimer);
    host.removeEventListener('focusout', onBlur);
    host.removeEventListener('submit', onSubmit);
    host.removeEventListener('input', onInput);
    host.classList.remove('x-form', 'x-form--loading');
  };
}
