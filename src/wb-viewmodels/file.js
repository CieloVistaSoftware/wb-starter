// Standalone file behavior extracted from enhancements.js
export function file(element, options = {}) {
  element.classList.add('wb-file');
  const input = document.createElement('input');
  input.type = 'file';
  input.className = 'wb-file__input';
  element.appendChild(input);
  input.addEventListener('change', () => {
    element.dispatchEvent(new CustomEvent('wb:file:change', { bubbles: true, detail: { files: input.files } }));
  });
  return () => {
    element.classList.remove('wb-file');
    input.remove();
  };
}
