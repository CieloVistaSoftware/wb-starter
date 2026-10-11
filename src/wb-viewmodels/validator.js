import { readFlag, readAttr } from '../core/read-attr.js';
/**
 * Validator Behavior
 * -----------------------------------------------------------------------------
 * Provides client-side validation for form inputs.
 * Supports required fields, email formats, patterns, and custom rules.
 * 
 * Usage:
 *   <form x-validator validateOn="blur input">
 *     <input name="email" validate="required email">
 *   </form>
 * -----------------------------------------------------------------------------
 * Form validation with customizable rules.
 *
 * #1844: the host's options are plain attributes (validateOn, showErrors,
 * errorClass, successClass -- camelCase per ATTRIBUTE-NAMING-STANDARD, read
 * through readAttr/readFlag so the dashed spelling works too), and the fields
 * checked are the ones carrying a plain `validate`. They used to be read only
 * off the element's dataset and only from fields with the data- spelling of
 * `validate`, which the repo forbids, so the documented markup did nothing. The default error class was the literal
 * '[x-error]', which is not a class name: submit built the selector
 * '.[x-error]' from it and threw instead of focusing the first invalid field.
 * The defaults are now the BEM modifiers validator.css styles.
 */
export function validator(element, options = {}) {
  const config = {
    validateOn: options.validateOn || readAttr(element, 'validateOn', 'blur'), // blur, change, input, submit
    showErrors: options.showErrors ?? readFlag(element, 'showErrors', true),
    errorClass: options.errorClass || readAttr(element, 'errorClass', 'x-validator__field--invalid'),
    successClass: options.successClass || readAttr(element, 'successClass', 'x-validator__field--valid'),
    ...options
  };

  const isForm = element.tagName === 'FORM';
  element.classList.add('x-validator');

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

  // Parse a field's rules from its plain `validate` attribute (#1844).
  const parseRules = (input) => {
    const ruleStr = input.getAttribute('validate') || '';
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
        errorSpanEl.className = 'x-validator__error';
        errorSpanEl.textContent = showErrorsArr[0];
        // Styled by .x-validator__error in validator.css (#779).
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
    const errorSpanNode = input.parentNode.querySelector('.x-validator__error');
    if (errorSpanNode) errorSpanNode.remove();
  };

  // Get all validatable inputs
  const getInputs = () => {
    return Array.from(element.querySelectorAll('[validate]'));
  };

  // Validate all inputs; returns the fields that failed, in document order.
  const checkAll = () => {
    const invalid = getInputs().filter(input => !showError(input, validateInput(input)));
    const allValid = invalid.length === 0;
    element.dispatchEvent(new CustomEvent('wb:validator:validate', {
      bubbles: true,
      detail: { valid: allValid }
    }));
    return invalid;
  };
  const validateAll = () => checkAll().length === 0;

  // Event handler for individual inputs
  const onInputEvent = (e) => {
    const input = e.target;
    if (input.hasAttribute && input.hasAttribute('validate')) {
      const inputErrorsEvt = validateInput(input);
      showError(input, inputErrorsEvt);
    }
  };

  // Form submit handler
  const onSubmit = (e) => {
    const invalid = checkAll();
    if (invalid.length) {
      e.preventDefault();
      e.stopPropagation();

      // Focus the first invalid field. Taken from the check itself rather than
      // a selector built from errorClass: an author's class need not be a
      // valid selector, and the old default '[x-error]' was not (#1844).
      invalid[0].focus();
    }
  };

  // Attach event handlers. In the capture phase: the fields' events are
  // heard on the host, and blur -- the default -- does not bubble, so a
  // bubbling listener never heard a field lose focus (#1844).
  const events = config.validateOn.split(/\s+/).filter(evt => evt && evt !== 'submit');
  events.forEach(evt => {
    element.addEventListener(evt, onInputEvent, true);
  });

  if (isForm) {
    element.addEventListener('submit', onSubmit);
  }

  // Expose methods
  element.wbValidator = {
    // #1237: there were two `validate` keys, and the second (one input)
    // silently replaced the first (the whole form), so validate() with no
    // argument ran showError(undefined). One method now does both, under the
    // canonical verb (#782): validate() checks the form, validate(input) one
    // field. Both return whether it is valid.
    validate: (input) => {
      if (!input) return validateAll();
      const fieldErrors = validateInput(input);
      showError(input, fieldErrors);
      return fieldErrors.length === 0;
    },
    reset: () => getInputs().forEach(clearError),
    addRule: (name, fn) => { rules[name] = fn; }
  };

  // Mark as ready
  // Cleanup
  return () => {
    element.classList.remove('x-validator');
    events.forEach(evt => {
      element.removeEventListener(evt, onInputEvent, true);
    });
    if (isForm) {
      element.removeEventListener('submit', onSubmit);
    }
    getInputs().forEach(clearError);
    delete element.wbValidator;
  };
}

export default validator;
