/**
 * Form - Enhanced <form> element
 * Adds AJAX submit, validation UI, loading states, auto-save
 * Helper Attribute: [x-behavior="form"]
 */
export function form(element, options = {}) {
  const config = {
    ajax: options.ajax ?? element.hasAttribute('data-ajax'),
    validate: options.validate ?? element.dataset.validate !== 'false',
    autoSave: options.autoSave ?? element.hasAttribute('data-auto-save'),
    loadingText: options.loadingText || element.dataset.loadingText || 'Submitting...',
    successMessage: options.successMessage || element.dataset.successMessage || 'Success!',
    errorMessage: options.errorMessage || element.dataset.errorMessage || 'Error. Please try again.',
    ...options
  };

  element.classList.add('wb-form');
  element.noValidate = config.validate; // Use custom validation

  let submitBtn = element.querySelector('[type="submit"]');
  let originalBtnText = submitBtn?.textContent || '';

  const setLoading = (loading) => {
    if (submitBtn) {
      submitBtn.disabled = loading;
      submitBtn.textContent = loading ? config.loadingText : originalBtnText;
    }
    element.classList.toggle('wb-form--loading', loading);
  };

  const showMessage = (type, message) => {
    let msg = element.querySelector('.wb-form__message');
    if (!msg) {
      msg = document.createElement('div');
      msg.className = 'wb-form__message';
      element.insertBefore(msg, element.firstChild);
    }
    msg.className = `wb-form__message wb-form__message--${type}`;
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
    const saveKey = `wb-form-${element.id || element.name || 'default'}`;
    
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

  element.dataset.wbReady = 'form';
  return () => element.classList.remove('wb-form', 'wb-form--loading');
}

export default { form };
