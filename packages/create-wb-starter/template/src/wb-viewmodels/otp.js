// Standalone otp behavior extracted from enhancements.js
export function otp(element, options = {}) {
  const config = {
    length: parseInt(options.length || element.getAttribute('length') || '6'),
    ...options
  };
  element.classList.add('wb-otp');
  const inputs = [];
  element.innerHTML = '';
  for (let i = 0; i < config.length; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.maxLength = 1;
    input.className = 'wb-otp__input';
    input.addEventListener('input', (e) => {
      if (input.value.length === 1 && i < config.length - 1) {
        inputs[i + 1].focus();
      }
      element.dispatchEvent(new CustomEvent('wb:otp:input', { bubbles: true, detail: { value: getValue() } }));
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && i > 0) {
        inputs[i - 1].focus();
      }
    });
    element.appendChild(input);
    inputs.push(input);
  }
  function getValue() {
    return inputs.map(inp => inp.value).join('');
  }
  element.wbOtp = { getValue };
  return () => {
    element.classList.remove('wb-otp');
    element.innerHTML = '';
  };
}
