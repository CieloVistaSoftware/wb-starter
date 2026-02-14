/**
 * Validator Behavior
 * -----------------------------------------------------------------------------
 * Provides client-side validation for form inputs.
 * Supports required fields, email formats, patterns, and custom rules.
 * 
 * Helper Attribute: [x-validate]
 * -----------------------------------------------------------------------------
 * 
 * Usage:
 *   <input required type="email">
 * -----------------------------------------------------------------------------
 * Form validation with customizable rules.
 */
export function validator(element, options = {}) {
  const config = {
    validateOn: options.validateOn || element.dataset.validateOn || 'blur', // blur, change, input, submit
    showErrors: options.showErrors ?? (element.dataset.showErrors !== 'false'),
    errorClass: options.errorClass || element.dataset.errorClass || 'wb-error',
    successClass: options.successClass || element.dataset.successClass || 'wb-success',
    ...options
  };

  const isForm = element.tagName === 'FORM';
  element.classList.add('wb-validator');

  // Validation rules
  const rules = {
    required: (value) => value.trim() !== '' || 'This field is required',
    email: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Invalid email address',
    url: (value) => !value || /^https?:\/\/.+/.test(value) || 'Invalid URL',
    number: (value) => !value || !isNaN(Number(value)) || 'Must be a number',
    integer: (value) => !value || Number.isInteger(Number(value)) || 'Must be an integer',
    min: (value, param) => !value || Number(value) >= Number(param) || `Must be at least ${param}`,
    max: (value, param) => !value || Number(value) <= Number(param) || `Must be at most ${param}`,
    minLength: (value, param) => !value || value.length >= Number(param) || `Must be at least ${param} characters`,
    maxLength: (value, param) => !value || value.length <= Number(param) || `Must be at most ${param} characters`,
    pattern: (value, param) => !value || new RegExp(param).test(value) || 'Invalid format',
    match: (value, param, form) => {
      const other = form?.querySelector(`[name="${param}"]`);
      return !value || (other && value === other.value) || `Must match ${param}`;
    }
  };

  // Parse validation rules from data attribute
  const parseRules = (input) => {
    const ruleStr = input.dataset.validate || '';
    return ruleStr.split(/\s+/).filter(Boolean).map(rule => {
      const [name, param] = rule.split(':');
      return { name, param };
    });
  };

  // Validate a single input
  const validateInput = (input) => {
    const inputRules = parseRules(input);
    const value = input.value;
    const errors = [];

    for (const { name, param } of inputRules) {
      if (rules[name]) {
        const result = rules[name](value, param, isForm ? element : null);
        if (result !== true) {
          errors.push(result);
        }
      }
    }

    return errors;
  };

  // Show/clear error state
  const showError = (input, showErrorsArr) => {
    clearError(input);
    if (showErrorsArr.length > 0) {
      input.classList.add(config.errorClass);
      input.classList.remove(config.successClass);
      input.setAttribute('aria-invalid', 'true');
      if (config.showErrors) {
        const errorSpanEl = document.createElement('span');
        errorSpanEl.className = 'wb-validator__error';
        errorSpanEl.textContent = showErrorsArr[0];
        errorSpanEl.style.cssText = `
          display: block;
          color: var(--wb-color-error, #dc3545);
          font-size: 0.875rem;
          margin-top: 0.25rem;
        `;
        input.parentNode.insertBefore(errorSpanEl, input.nextSibling);
      }
      return false;
    } else {
      input.classList.add(config.successClass);
      input.classList.remove(config.errorClass);
      input.removeAttribute('aria-invalid');
      return true;
    }
  };

  const clearError = (input) => {
    input.classList.remove(config.errorClass, config.successClass);
    input.removeAttribute('aria-invalid');
    const errorSpanNode = input.parentNode.querySelector('.wb-validator__error');
    if (errorSpanNode) errorSpanNode.remove();
  };

  // Get all validatable inputs
  const getInputs = () => {
    return Array.from(element.querySelectorAll('[data-validate]'));
  };

  // Validate all inputs
  const validateAll = () => {
    const inputs = getInputs();
    let allValid = true;
    inputs.forEach(input => {
      const inputErrorsAll = validateInput(input);
      if (!showError(input, inputErrorsAll)) {
        allValid = false;
      }
    });
    element.dispatchEvent(new CustomEvent('wb:validator:validate', {
      bubbles: true,
      detail: { valid: allValid }
    }));
    return allValid;
  };

  // Event handler for individual inputs
  const onInputEvent = (e) => {
    const input = e.target;
    if (input.hasAttribute('data-validate')) {
      const inputErrorsEvt = validateInput(input);
      showError(input, inputErrorsEvt);
    }
  };

  // Form submit handler
  const onSubmit = (e) => {
    if (!validateAll()) {
      e.preventDefault();
      e.stopPropagation();
      
      // Focus first invalid input
      const firstInvalid = element.querySelector(`.${config.errorClass}`);
      if (firstInvalid) firstInvalid.focus();
    }
  };

  // Attach event handlers
  const events = config.validateOn.split(/\s+/);
  events.forEach(evt => {
    if (evt !== 'submit') {
      element.addEventListener(evt, onInputEvent);
    }
  });

  if (isForm) {
    element.addEventListener('submit', onSubmit);
  }

  // Expose methods
  element.wbValidator = {
    validate: validateAll,
    validateInput: (input) => showError(input, validateInput(input)),
    clearErrors: () => getInputs().forEach(clearError),
    addRule: (name, fn) => { rules[name] = fn; }
  };

  // Mark as ready
  element.classList.add('wb-ready');

  // Cleanup
  return () => {
    element.classList.remove('wb-validator');
    events.forEach(evt => {
      element.removeEventListener(evt, onInputEvent);
    });
    if (isForm) {
      element.removeEventListener('submit', onSubmit);
    }
    getInputs().forEach(clearError);
    delete element.wbValidator;
  };
}

export default validator;
