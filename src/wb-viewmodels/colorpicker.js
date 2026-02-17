// Standalone colorpicker behavior extracted from enhancements.js
export function colorpicker(element, options = {}) {
  element.classList.add('wb-colorpicker');
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
