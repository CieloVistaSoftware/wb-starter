import { readAttr } from '../../core/read-attr.js';
/**
 * Form - Enhanced <form> element
 * Adds AJAX submit, validation UI, loading states, auto-save
 * Helper Attribute: [x-behavior="form"]
 */
export function form(element, options = {}) {
  // #751: read the PLAIN attribute as well as the data-* form. The showcase
  // example writes `<form validate ajax>` -- the documented spelling -- while
  // this only ever read `data-ajax`, so ajax was never enabled and submitting
  // did nothing visible. Same gap #697 closed for x-fieldset/x-formrow.
  //
  // `"false"` is honoured as false (#747): a string attribute value is truthy
  // in JS, so `ajax="false"` read as a bare presence check means ON, which is
  // the opposite of what the markup says.
  const flag = (plain, dataKey) => {
    for (const name of [plain, dataKey]) {
      if (!element.hasAttribute(name)) continue;
      const v = element.getAttribute(name);
      if (v === 'false' || v === '0') return false;
      return true;
    }
    return false;
  };
  const str = (plain, dataProp) =>
    element.getAttribute(plain) || element.dataset[dataProp] || '';

  const config = {
    ajax: options.ajax ?? flag('ajax', 'data-ajax'),
    validate: options.validate ?? (element.hasAttribute('validate')
      ? flag('validate', 'data-validate')
      : readAttr(element, 'validate') !== 'false'),
    autoSave: options.autoSave ?? flag('auto-save', 'data-auto-save'),
    loadingText: options.loadingText || str('loadingmessage', 'loadingText') || 'Submitting...',
    successMessage: options.successMessage || str('successmessage', 'successMessage') || 'Success!',
    errorMessage: options.errorMessage || str('errormessage', 'errorMessage') || 'Error. Please try again.',
    ...options
  };

  element.classList.add('x-form');
  element.noValidate = config.validate; // Use custom validation

  let submitBtn = element.querySelector('[type="submit"]');
  let originalBtnText = submitBtn?.textContent || '';

  const setLoading = (loading) => {
    if (submitBtn) {
      submitBtn.disabled = loading;
      submitBtn.textContent = loading ? config.loadingText : originalBtnText;
    }
    element.classList.toggle('x-form--loading', loading);
  };

  const showMessage = (type, message) => {
    let msg = element.querySelector('.x-form__message');
    if (!msg) {
      msg = document.createElement('div');
      msg.className = 'x-form__message';
      element.insertBefore(msg, element.firstChild);
    }
    msg.className = `x-form__message x-form__message--${type}`;
    msg.textContent = message;
    msg.style.cssText = `
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
      border-radius: 6px;
      background: ${type === 'success' ? 'var(--success-color, #22c55e)' : 'var(--danger-color, #ef4444)'};
      color: white;
    `;
    
    // Auto-hide after 5 seconds
    setTimeout(() => msg.remove(), 5000);
  };

  // Validation styling
  if (config.validate) {
    element.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('blur', () => {
        if (!field.checkValidity()) {
          field.style.borderColor = 'var(--danger-color, #ef4444)';
        } else {
          field.style.borderColor = '';
        }
      });
    });
  }

  // AJAX submit
  if (config.ajax) {
    element.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Validate
      if (config.validate && !element.checkValidity()) {
        element.reportValidity();
        return;
      }

      setLoading(true);
      
      try {
        const formData = new FormData(element);
        const response = await fetch(element.action || window.location.href, {
          method: element.method || 'POST',
          body: formData
        });
        
        if (response.ok) {
          showMessage('success', config.successMessage);
          element.dispatchEvent(new CustomEvent('wb:form:success', {
            bubbles: true,
            detail: { response }
          }));
          if (!config.autoSave) element.reset();
        } else {
          throw new Error('Submit failed');
        }
      } catch (err) {
        showMessage('error', config.errorMessage);
        element.dispatchEvent(new CustomEvent('wb:form:error', {
          bubbles: true,
          detail: { error: err }
        }));
      } finally {
        setLoading(false);
      }
    });
  }

  // Auto-save
  if (config.autoSave) {
    const saveKey = `x-form-${element.id || element.name || 'default'}`;
    
    // Restore saved data
    const saved = localStorage.getItem(saveKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        Object.entries(data).forEach(([name, value]) => {
          const field = element.querySelector(`[name="${name}"]`);
          if (field) field.value = value;
        });
      } catch (e) {}
    }
    
    // Save on input
    element.addEventListener('input', () => {
      const formDataObj = {};
      new FormData(element).forEach((value, key) => {
        formDataObj[key] = value;
      });
      localStorage.setItem(saveKey, JSON.stringify(formDataObj));
    });
  }

  // API
  element.wbForm = {
    submit: () => element.requestSubmit(),
    reset: () => element.reset(),
    validate: () => element.checkValidity(),
    getData: () => Object.fromEntries(new FormData(element)),
    setLoading,
    showMessage
  };

  return () => element.classList.remove('x-form', 'x-form--loading');
}

export default { form };
