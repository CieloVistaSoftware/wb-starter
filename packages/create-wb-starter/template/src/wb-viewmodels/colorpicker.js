// Standalone colorpicker behavior extracted from enhancements.js
export function colorpicker(element, options = {}) {
  element.classList.add('wb-colorpicker');

  // <input> is a void element — it can never hold a child, so
  // appendChild(input) below silently did nothing when x-colorpicker was
  // applied directly to a real <input> (its documented, demoed usage:
  // <input type="text" x-colorpicker value="#...">). Convert the input
  // itself into the native color picker instead of trying to nest one
  // inside it.
  if (element.tagName === 'INPUT') {
    const previousType = element.type;
    element.type = 'color';
    element.classList.add('wb-colorpicker__input');
    const onInput = () => {
      element.dispatchEvent(new CustomEvent('wb:colorpicker:change', { bubbles: true, detail: { value: element.value } }));
    };
    element.addEventListener('input', onInput);
    return () => {
      element.classList.remove('wb-colorpicker', 'wb-colorpicker__input');
      element.removeEventListener('input', onInput);
      element.type = previousType;
    };
  }

  const input = document.createElement('input');
  input.type = 'color';
  input.className = 'wb-colorpicker__input';
  input.value = element.getAttribute('value') || '#000000';
  input.addEventListener('input', () => {
    element.setAttribute('value', input.value);
    element.dispatchEvent(new CustomEvent('wb:colorpicker:change', { bubbles: true, detail: { value: input.value } }));
  });
  element.appendChild(input);
  return () => {
    element.classList.remove('wb-colorpicker');
    input.remove();
  };
}
